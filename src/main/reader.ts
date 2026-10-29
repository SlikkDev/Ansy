import type { Input, WebContents } from 'electron'
import {
  isReaderRuleId,
  type Finding,
  type FindingElement,
  type RetestOutcome,
} from '../shared/findings'
import {
  emptySnapshot,
  findNext,
  isAXNodes,
  linearize,
  readerFindings,
  readerRuleHolds,
  TOGGLE_ROLES,
  TYPING_ROLES,
  type AXNode,
  type ReaderCommand,
  type ReaderEvent,
  type ReaderFinding,
  type ReaderItem,
  type ReaderMode,
  type ReaderReport,
  type ReaderSnapshot,
  type ReaderTarget,
} from '../shared/reader'
import { readerTargetKeys } from '../shared/replay'
import { ringFunction } from './highlight'
import { selectorFunction } from './selector'

/** After Tab, before asking the page what has focus. */
const FOCUS_SETTLE = 80
/** How often the page is asked where its focus is, for focus the page moved by itself. */
const FOCUS_POLL = 500
/** After a load, before the tree is read: late content has a moment to arrive. */
const LOAD_SETTLE = 400
/** After a click, before the element is read again for its new state. */
const ACTIVATE_SETTLE = 500
const HTML_MAX = 300
/** Remote objects Ansy holds in the page are released together under this group. */
const OBJECTS = 'ansy-reader'

/** The quick keys, by physical key, so a Hebrew layout works the same as an English one. */

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Ansy Reader's engine. It reads the site's accessibility tree through the
 * DevTools protocol, keeps a virtual cursor on it, takes the screen reader
 * keys before the page sees them, follows the page's real focus, and tells
 * Ansy's screens what to say. One thing happens at a time: every action goes
 * through a queue, so a key pressed mid-refresh waits for the fresh tree.
 */
export class Reader {
  private snapshot: ReaderSnapshot = emptySnapshot
  private findings: ReaderFinding[] = []
  private cursor = -1
  private mode: ReaderMode = 'browse'
  private on = false
  /** Bumped on every refresh and load, so a tree fetched before is dropped. */
  private generation = 0
  /** The page's focused node as last announced, so it is not announced twice. */
  private focused = 0
  private poll: ReturnType<typeof setInterval> | null = null
  private polling = false
  private queue: Promise<void> = Promise.resolve()
  private timers = new Set<ReturnType<typeof setTimeout>>()

  constructor(
    private readonly contents: WebContents,
    private readonly emit: (event: ReaderEvent) => void,
    private readonly changed: () => void,
  ) {}

  async start(): Promise<void> {
    if (this.on) return
    this.on = true
    this.mode = 'browse'
    await this.send('Accessibility.enable')
    await this.enqueued(() => this.refresh(true))
    this.poll = setInterval(() => {
      if (this.polling || !this.contents.isFocused()) return
      this.polling = true
      this.enqueue(async () => {
        try {
          await this.followFocus()
        } finally {
          this.polling = false
        }
      })
    }, FOCUS_POLL)
  }

  async stop(): Promise<void> {
    if (!this.on) return
    this.on = false
    this.generation += 1
    if (this.poll) clearInterval(this.poll)
    this.poll = null
    for (const timer of this.timers) clearTimeout(timer)
    this.timers.clear()
    this.snapshot = emptySnapshot
    this.findings = []
    this.cursor = -1
    this.focused = 0
    this.mode = 'browse'
    await this.send('Accessibility.disable')
    this.changed()
  }

  /** A new page is under the reader: read it once it has settled, and say so. */
  pageLoaded(): void {
    if (!this.on) return
    this.generation += 1
    this.cursor = -1
    this.focused = 0
    this.mode = 'browse'
    this.after(LOAD_SETTLE, () => this.refresh(true))
  }

  /** The page changed in place (a route, a menu): read it again, quietly. */
  pageChanged(): void {
    if (this.on) this.after(LOAD_SETTLE, () => this.refresh(false))
  }

  getReport(): ReaderReport {
    const { title, items, headings, links, fields, landmarks, truncated } = this.snapshot
    return {
      ready: this.on && items.length > 0,
      title,
      items: items.length,
      headings,
      links,
      fields,
      landmarks,
      truncated,
      cursor: this.cursor,
      current: items[this.cursor] ?? null,
      mode: this.mode,
      findings: this.findings,
    }
  }

  /**
   * A key pressed in the site. True when the reader keeps it from the page:
   * the arrows and quick keys in browse mode, Escape in focus mode. Tab always
   * reaches the page, and the reader follows where focus lands.
   */
  handleInput(input: Input): boolean {
    if (!this.on || input.type !== 'keyDown') return false
    const { code } = input
    const ctrl = input.control || input.meta
    if (/^(Control|Meta)(Left|Right)$/.test(code)) {
      this.emit({ type: 'stop' })
      return false
    }
    if (code === 'Tab') {
      this.after(FOCUS_SETTLE, () => this.followFocus())
      return false
    }
    if (input.alt) return false
    if (this.mode === 'focus') {
      if (code === 'Escape' && !ctrl) return this.enqueue(() => this.setMode('browse'))
      return false
    }
    if (ctrl) {
      if (code === 'Home') return this.enqueue(() => this.jump(0))
      if (code === 'End') return this.enqueue(() => this.jump(this.snapshot.items.length - 1))
      return false
    }
    const dir: 1 | -1 = input.shift ? -1 : 1
    if (code === 'ArrowDown') return this.enqueue(() => this.move(null, 1))
    if (code === 'ArrowUp') return this.enqueue(() => this.move(null, -1))
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') {
      return this.enqueue(() => this.activate())
    }
    const target = readerTargetKeys[code]
    if (target) return this.enqueue(() => this.move(target, dir))
    const digit = /^Digit([1-6])$/.exec(code)
    if (digit) return this.enqueue(() => this.move('heading', dir, Number(digit[1])))
    return false
  }

  /** The same moves, from the buttons on the card. */
  run(command: ReaderCommand): Promise<void> {
    return this.enqueued(async () => {
      switch (command.kind) {
        case 'move':
          return this.move(command.target, command.dir, command.level)
        case 'first':
          return this.jump(0)
        case 'last':
          return this.jump(this.snapshot.items.length - 1)
        case 'activate':
          return this.activate()
        case 'refresh':
          return this.refresh(true)
      }
    })
  }

  /** Scrolls the site to an item and rings it. False when there is nothing to show. */
  async show(index: number): Promise<boolean> {
    const item = this.snapshot.items[index]
    if (!item?.node) return false
    await this.scrollTo(item)
    return true
  }

  /** Where an item is, for a finding: a selector and its HTML. */
  elementFor(index: number): Promise<FindingElement | null> {
    const item = this.snapshot.items[index]
    return item?.node ? this.describeElement(item.node) : Promise.resolve(null)
  }

  /** Does a saved reader finding still hold? Reads the page afresh and looks again. */
  async check(finding: Finding): Promise<RetestOutcome> {
    if (!this.on || !finding.rule || !isReaderRuleId(finding.rule.id)) return 'unknown'
    const rule = finding.rule.id
    await this.enqueued(() => this.refresh(false))
    const { items, landmarks } = this.snapshot
    if (rule === 'reader-no-landmarks') {
      return items.length ? (landmarks ? 'fixed' : 'failing') : 'unknown'
    }
    if (!finding.element) return 'unknown'
    const node = await this.nodeFor(finding.element.target)
    if (!node) return 'unknown'
    if (rule === 'reader-heading-order') {
      const index = items.findIndex((item) => item.node === node)
      const item = items[index]
      if (!item || item.role !== 'heading') return 'unknown'
      let last = 0
      for (const earlier of items.slice(0, index)) {
        if (earlier.role === 'heading' && earlier.level) last = earlier.level
      }
      return last && item.level > last + 1 ? 'failing' : 'fixed'
    }
    const nodes = await this.partial(node)
    const own = nodes?.find((n) => n.backendDOMNodeId === node)
    if (!nodes || !own) return 'unknown'
    // An image that became decoration (alt="") leaves the tree: that is the fix.
    if (own.ignored) return rule === 'reader-image-name' ? 'fixed' : 'unknown'
    return readerRuleHolds(rule, linearize(nodes, own.nodeId).items[0] ?? null)
  }

  // ---- Reading the tree ------------------------------------------------------

  private async refresh(announce: boolean): Promise<void> {
    if (!this.on) return
    const generation = ++this.generation
    const tree = await this.send<{ nodes: unknown }>('Accessibility.getFullAXTree')
    if (generation !== this.generation || !this.on) return
    const nodes = tree && isAXNodes(tree.nodes) ? tree.nodes : []
    const keep = announce ? 0 : (this.snapshot.items[this.cursor]?.node ?? 0)
    const snapshot = linearize(nodes)
    const findings = readerFindings(snapshot)
    for (const finding of findings) {
      const node = snapshot.items[finding.index]?.node
      if (node) finding.element = await this.describeElement(node)
      if (generation !== this.generation || !this.on) return
    }
    this.snapshot = snapshot
    this.findings = findings
    const last = snapshot.items.length - 1
    if (announce) {
      this.cursor = -1
      this.emit(
        snapshot.items.length
          ? {
              type: 'page',
              title: snapshot.title,
              items: snapshot.items.length,
              headings: snapshot.headings,
              links: snapshot.links,
              fields: snapshot.fields,
              landmarks: snapshot.landmarks,
              truncated: snapshot.truncated,
            }
          : { type: 'empty' },
      )
    } else {
      const index = keep ? snapshot.items.findIndex((item) => item.node === keep) : -1
      this.cursor = index >= 0 ? index : Math.min(this.cursor, last)
    }
    this.changed()
  }

  /** What one element reads as, from its own subtree. */
  private async describe(node: number): Promise<ReaderItem | null> {
    const nodes = await this.partial(node)
    const own = nodes?.find((n) => n.backendDOMNodeId === node)
    if (!nodes || !own || own.ignored) return null
    return linearize(nodes, own.nodeId).items[0] ?? null
  }

  private async partial(node: number): Promise<AXNode[] | null> {
    const result = await this.send<{ nodes: unknown }>('Accessibility.getPartialAXTree', {
      backendNodeId: node,
      fetchRelatives: true,
    })
    return result && isAXNodes(result.nodes) ? result.nodes : null
  }

  // ---- Moving --------------------------------------------------------------------

  private async move(target: ReaderTarget | null, dir: 1 | -1, level?: number): Promise<void> {
    const { items } = this.snapshot
    if (!items.length) {
      this.emit({ type: 'empty' })
      return
    }
    const next = findNext(items, this.cursor, target, dir, level)
    if (next < 0) {
      if (target) this.emit({ type: 'none', target, dir, ...(level ? { level } : {}) })
      else this.emit({ type: 'edge', edge: dir > 0 ? 'bottom' : 'top' })
      return
    }
    await this.goTo(next, false)
  }

  private async jump(index: number): Promise<void> {
    if (index < 0 || index >= this.snapshot.items.length) {
      this.emit({ type: 'empty' })
      return
    }
    await this.goTo(index, false)
  }

  private async goTo(index: number, focus: boolean): Promise<void> {
    const item = this.snapshot.items[index]
    if (!item) return
    this.cursor = index
    await this.scrollTo(item)
    this.emit({ type: 'item', item, focus })
    this.changed()
  }

  private async scrollTo(item: ReaderItem): Promise<void> {
    if (!item.node) return
    await this.send('DOM.scrollIntoViewIfNeeded', { backendNodeId: item.node })
    await this.callOn(item.node, ringFunction)
  }

  /** Enter: click what is being read, or put the keyboard in it when it is for typing. */
  private async activate(): Promise<void> {
    const item = this.snapshot.items[this.cursor]
    if (!item?.node) return
    if (TYPING_ROLES.has(item.role)) {
      await this.send('DOM.focus', { backendNodeId: item.node })
      this.focused = item.node
      await this.setMode('focus')
      return
    }
    await this.callOn(item.node, 'function () { this.click() }')
    if (TOGGLE_ROLES.has(item.role)) {
      await delay(ACTIVATE_SETTLE)
      const fresh = await this.describe(item.node)
      if (fresh && this.snapshot.items[item.index] === item) {
        const updated = { ...fresh, index: item.index }
        this.snapshot.items[item.index] = updated
        this.emit({ type: 'item', item: updated, focus: false })
        this.changed()
      }
    }
    // A menu may have opened; a link's new page announces itself through pageLoaded.
    this.pageChanged()
  }

  private async setMode(mode: ReaderMode): Promise<void> {
    if (this.mode === mode) return
    this.mode = mode
    this.emit({ type: 'mode', mode })
    this.changed()
  }

  /** Where the page's focus is now. Announces it when it moved, and picks the mode for it. */
  private async followFocus(): Promise<void> {
    if (!this.on) return
    const node = await this.activeNode()
    if (!this.on || !node || node === this.focused) return
    this.focused = node
    const index = this.snapshot.items.findIndex((item) => item.node === node)
    const item = index >= 0 ? this.snapshot.items[index]! : await this.describe(node)
    if (!item) {
      // Focus went to the page itself or something unreadable: back to browsing.
      await this.setMode('browse')
      return
    }
    if (index >= 0) this.cursor = index
    this.emit({ type: 'item', item, focus: true })
    await this.setMode(item.editable || TYPING_ROLES.has(item.role) ? 'focus' : 'browse')
    this.changed()
  }

  // ---- The protocol ---------------------------------------------------------------

  /** The DOM node behind `document.activeElement`, or 0. */
  private activeNode(): Promise<number> {
    return this.nodeOf('document.activeElement')
  }

  private nodeFor(selector: string): Promise<number> {
    return this.nodeOf(`document.querySelector(${JSON.stringify(selector)})`)
  }

  private async nodeOf(expression: string): Promise<number> {
    const evaluated = await this.send<{ result: { objectId?: string; subtype?: string } }>(
      'Runtime.evaluate',
      { expression, returnByValue: false, objectGroup: OBJECTS },
    )
    const objectId = evaluated?.result.objectId
    if (!objectId || evaluated.result.subtype !== 'node') return 0
    const described = await this.send<{ node: { backendNodeId: number } }>('DOM.describeNode', {
      objectId,
    })
    void this.send('Runtime.releaseObject', { objectId })
    return described?.node.backendNodeId ?? 0
  }

  /** Calls a function on a node, with the node as `this`, and returns its value. */
  private async callOn(node: number, functionDeclaration: string): Promise<unknown> {
    const resolved = await this.send<{ object: { objectId?: string } }>('DOM.resolveNode', {
      backendNodeId: node,
      objectGroup: OBJECTS,
    })
    const objectId = resolved?.object.objectId
    if (!objectId) return null
    const called = await this.send<{ result: { value?: unknown } }>('Runtime.callFunctionOn', {
      objectId,
      functionDeclaration,
      returnByValue: true,
    })
    void this.send('Runtime.releaseObject', { objectId })
    return called?.result.value ?? null
  }

  private async describeElement(node: number): Promise<FindingElement | null> {
    const target = await this.callOn(node, selectorFunction)
    if (typeof target !== 'string' || !target) return null
    const html = await this.send<{ outerHTML: string }>('DOM.getOuterHTML', {
      backendNodeId: node,
    })
    const outer = (html?.outerHTML ?? '').replace(/\s+/g, ' ').trim()
    return { target, html: outer.length > HTML_MAX ? outer.slice(0, HTML_MAX - 1) + '…' : outer }
  }

  private async send<T = unknown>(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<T | null> {
    if (this.contents.isDestroyed()) return null
    const dbg = this.contents.debugger
    try {
      if (!dbg.isAttached()) dbg.attach('1.3')
      return (await dbg.sendCommand(method, params)) as T
    } catch {
      return null
    }
  }

  // ---- One thing at a time ---------------------------------------------------------

  private enqueued(task: () => Promise<void>): Promise<void> {
    const next = this.queue.then(task).catch((error: unknown) => {
      console.error('Ansy Reader', error)
    })
    this.queue = next
    return next
  }

  private enqueue(task: () => Promise<void>): true {
    void this.enqueued(task)
    return true
  }

  private after(ms: number, task: () => Promise<void>): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      this.enqueue(task)
    }, ms)
    this.timers.add(timer)
  }
}
