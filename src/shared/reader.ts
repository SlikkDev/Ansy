/**
 * Ansy Reader, the pure parts. The main process fetches the page's
 * accessibility tree through the DevTools protocol, the same tree a real
 * screen reader is given, and this file turns it into a reading order, finds
 * what a screen reader user would stumble on, moves the virtual cursor, and
 * composes what is said. Nothing here touches Electron or the DOM, so it is
 * tested against trees captured from real pages.
 */

import { readerRules, type FindingElement, type ReaderRuleId, type RetestOutcome } from './findings'
import type { MessageKey } from './i18n'
import type { Translate } from './report'

/** An accessibility node as the protocol sends it, down to the fields Ansy reads. */
export interface AXNode {
  nodeId: string
  ignored?: boolean
  ignoredReasons?: { name: string }[]
  role?: { value: string }
  name?: { value: string }
  description?: { value: string }
  value?: { value: unknown }
  properties?: { name: string; value: { value: unknown } }[]
  childIds?: string[]
  backendDOMNodeId?: number
}

export function isAXNodes(value: unknown): value is AXNode[] {
  return (
    Array.isArray(value) &&
    value.every((n) => n && typeof n === 'object' && typeof n.nodeId === 'string')
  )
}

/** What Ansy Reader can say an item is. The protocol's own role is kept beside it. */
export type ReaderRole =
  | 'heading'
  | 'link'
  | 'button'
  | 'edit'
  | 'combobox'
  | 'listbox'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'spinbutton'
  | 'image'
  | 'text'
  | 'list'
  | 'listEnd'
  | 'table'
  | 'tableEnd'
  | 'cell'
  | 'header'
  | 'landmark'
  | 'dialog'
  | 'figure'
  | 'separator'
  | 'tab'
  | 'menuitem'
  | 'option'
  | 'progressbar'
  | 'video'
  | 'audio'
  | 'frame'
  | 'other'

export type ReaderState =
  | 'checked'
  | 'unchecked'
  | 'mixed'
  | 'pressed'
  | 'notPressed'
  | 'expanded'
  | 'collapsed'
  | 'disabled'
  | 'required'
  | 'invalid'
  | 'readonly'
  | 'selected'
  | 'current'
  | 'multiline'

/** One stop of the virtual cursor. */
export interface ReaderItem {
  index: number
  /** The DOM node behind it, as the protocol numbers them; 0 when there is none. */
  node: number
  role: ReaderRole
  /** The protocol's own role, spoken as is for roles Ansy has no word for. */
  raw: string
  /** For landmarks: which one. */
  landmark: string
  name: string
  description: string
  value: string
  /** Heading level. */
  level: number
  /** Items in a list, rows in a table. */
  count: number
  columns: number
  states: ReaderState[]
  focusable: boolean
  editable: boolean
}

/** A page's reading order, plus what was counted on the way. */
export interface ReaderSnapshot {
  title: string
  items: ReaderItem[]
  headings: number
  links: number
  fields: number
  landmarks: number
  /** The page had more than Ansy reads; the rest is left out. */
  truncated: boolean
}

export const emptySnapshot: ReaderSnapshot = {
  title: '',
  items: [],
  headings: 0,
  links: 0,
  fields: 0,
  landmarks: 0,
  truncated: false,
}

/** Stops per page. A long page reads its first part; real screen readers buffer the whole thing. */
export const MAX_ITEMS = 4000

/** Ignored for these reasons means hidden from assistive tech, children included. */
const HIDDEN_REASONS = new Set([
  'activeModalDialog',
  'ariaHiddenElement',
  'ariaHiddenSubtree',
  'hiddenRoot',
  'hiddenSubtree',
  'inertElement',
  'inertSubtree',
  'notRendered',
  'notVisible',
])

/** Roles read as one stop, by the protocol's names (ARIA ones and Chromium's own). */
const LEAF_ROLES: Record<string, ReaderRole> = {
  heading: 'heading',
  link: 'link',
  button: 'button',
  DisclosureTriangle: 'button',
  textbox: 'edit',
  searchbox: 'edit',
  combobox: 'combobox',
  PopUpButton: 'combobox',
  listbox: 'listbox',
  checkbox: 'checkbox',
  radio: 'radio',
  switch: 'switch',
  slider: 'slider',
  spinbutton: 'spinbutton',
  image: 'image',
  img: 'image',
  'graphics-document': 'image',
  'graphics-symbol': 'image',
  'graphics-object': 'image',
  StaticText: 'text',
  separator: 'separator',
  tab: 'tab',
  menuitem: 'menuitem',
  menuitemcheckbox: 'menuitem',
  menuitemradio: 'menuitem',
  option: 'option',
  treeitem: 'option',
  progressbar: 'progressbar',
  meter: 'progressbar',
  Video: 'video',
  video: 'video',
  Audio: 'audio',
  audio: 'audio',
  Iframe: 'frame',
  iframe: 'frame',
  cell: 'cell',
  gridcell: 'cell',
  columnheader: 'header',
  rowheader: 'header',
}

const LANDMARK_ROLES = new Set([
  'navigation',
  'main',
  'banner',
  'contentinfo',
  'complementary',
  'search',
  'form',
  'region',
])

/** Landmarks that only count when they have a name, as ARIA has it. */
const NAMED_LANDMARKS = new Set(['form', 'region'])

/** Never read: list bullets and line breaks are noise, inline boxes are the text again. */
const SKIP_ROLES = new Set(['ListMarker', 'LineBreak', 'InlineTextBox'])

/** Inline emphasis that stays part of the sentence around it, as it does for a screen reader. */
const INLINE_ROLES = new Set([
  'strong',
  'emphasis',
  'code',
  'time',
  'Abbr',
  'subscript',
  'superscript',
  'mark',
  'deletion',
  'insertion',
])

const TABLE_ROLES = new Set(['table', 'grid', 'treegrid'])

export const FIELD_ROLES: ReadonlySet<ReaderRole> = new Set<ReaderRole>([
  'edit',
  'combobox',
  'listbox',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'spinbutton',
])

/** Where Enter should put the keyboard rather than click: typing or choosing happens there. */
export const TYPING_ROLES: ReadonlySet<ReaderRole> = new Set<ReaderRole>([
  'edit',
  'combobox',
  'listbox',
  'slider',
  'spinbutton',
])

/** Roles whose state Enter changes, so they are read again after it. */
export const TOGGLE_ROLES: ReadonlySet<ReaderRole> = new Set<ReaderRole>([
  'checkbox',
  'radio',
  'switch',
  'button',
  'tab',
  'option',
  'menuitem',
])

const INTERACTIVE: ReadonlySet<ReaderRole> = new Set<ReaderRole>([...FIELD_ROLES, 'link', 'button'])

const prop = (node: AXNode, name: string): unknown =>
  node.properties?.find((p) => p.name === name)?.value.value

const str = (value: unknown): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''

const clean = (value: string): string => value.replace(/\s+/g, ' ').trim()

/** Text with at least one letter or digit; " · " and the like are not worth a stop. */
const hasWords = (value: string): boolean => /[\p{L}\p{N}]/u.test(value)

const roleOf = (node: AXNode): string => node.role?.value ?? ''

const isHidden = (node: AXNode): boolean =>
  !!node.ignoredReasons?.some((reason) => HIDDEN_REASONS.has(reason.name))

function statesOf(node: AXNode): ReaderState[] {
  const states: ReaderState[] = []
  const checked = prop(node, 'checked')
  if (checked === 'true' || checked === true) states.push('checked')
  else if (checked === 'mixed') states.push('mixed')
  else if (checked === 'false' || checked === false) states.push('unchecked')
  const pressed = prop(node, 'pressed')
  if (pressed === 'true' || pressed === true) states.push('pressed')
  else if (pressed === 'false' || pressed === false) states.push('notPressed')
  const expanded = prop(node, 'expanded')
  if (expanded === true) states.push('expanded')
  else if (expanded === false) states.push('collapsed')
  if (prop(node, 'disabled') === true) states.push('disabled')
  if (prop(node, 'required') === true) states.push('required')
  const invalid = prop(node, 'invalid')
  if (invalid !== undefined && invalid !== 'false' && invalid !== false) states.push('invalid')
  if (prop(node, 'readonly') === true) states.push('readonly')
  if (prop(node, 'selected') === true) states.push('selected')
  const current = prop(node, 'current')
  if (current !== undefined && current !== 'false' && current !== false) states.push('current')
  if (prop(node, 'multiline') === true) states.push('multiline')
  return states
}

function itemOf(node: AXNode, role: ReaderRole, name: string): Omit<ReaderItem, 'index'> {
  const editable = prop(node, 'editable')
  return {
    node: node.backendDOMNodeId ?? 0,
    role,
    raw: roleOf(node),
    landmark: '',
    name: clean(name),
    description: clean(str(node.description?.value)),
    value: clean(str(node.value?.value)),
    level: Number(prop(node, 'level')) || 0,
    count: 0,
    columns: 0,
    states: statesOf(node),
    focusable: prop(node, 'focusable') === true,
    editable: editable !== undefined && editable !== false && editable !== 'false',
  }
}

/**
 * Turns a tree into the order a screen reader reads it in: one stop per
 * heading, link, control, image and run of text, with lists, tables and
 * landmarks announced on the way in. Ignored nodes are skipped but not their
 * children, unless they are hidden from assistive tech. `start` reads one
 * subtree instead of the page, for describing a single element.
 */
export function linearize(nodes: AXNode[], start?: string): ReaderSnapshot {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]))
  const root = start ? byId.get(start) : nodes[0]
  const snapshot: ReaderSnapshot = { ...emptySnapshot, items: [] }
  if (!root) return snapshot
  if (roleOf(root) === 'RootWebArea') snapshot.title = clean(str(root.name?.value))

  const children = (node: AXNode): AXNode[] =>
    (node.childIds ?? []).map((id) => byId.get(id)).filter((n): n is AXNode => !!n)

  const push = (partial: Omit<ReaderItem, 'index'>): ReaderItem | null => {
    if (snapshot.items.length >= MAX_ITEMS) {
      snapshot.truncated = true
      return null
    }
    const item: ReaderItem = { index: snapshot.items.length, ...partial }
    snapshot.items.push(item)
    if (item.role === 'heading') snapshot.headings += 1
    else if (item.role === 'link') snapshot.links += 1
    else if (item.role === 'landmark') snapshot.landmarks += 1
    else if (FIELD_ROLES.has(item.role) || item.role === 'button') snapshot.fields += 1
    return item
  }

  /** The text inside a node, the way its name would be computed from content. */
  const textOf = (node: AXNode): string => {
    if (node.ignored && isHidden(node)) return ''
    const role = roleOf(node)
    if (role === 'StaticText') return str(node.name?.value)
    if (SKIP_ROLES.has(role)) return ''
    if (!node.ignored && LEAF_ROLES[role] && LEAF_ROLES[role] !== 'text') {
      return str(node.name?.value) || children(node).map(textOf).join('')
    }
    return children(node).map(textOf).join('')
  }

  const countRole = (node: AXNode, roles: Set<string>, deep: boolean): number => {
    let count = 0
    for (const child of children(node)) {
      if (child.ignored && isHidden(child)) continue
      if (!child.ignored && roles.has(roleOf(child))) count += 1
      else if (deep || child.ignored) count += countRole(child, roles, deep)
    }
    return count
  }

  const firstRow = (node: AXNode): AXNode | null => {
    for (const child of children(node)) {
      if (child.ignored && isHidden(child)) continue
      if (!child.ignored && roleOf(child) === 'row') return child
      const inner = firstRow(child)
      if (inner) return inner
    }
    return null
  }

  const visit = (node: AXNode, onlyInteractive: boolean): void => {
    if (snapshot.truncated) return
    if (node.ignored) {
      if (!isHidden(node)) for (const child of children(node)) visit(child, onlyInteractive)
      return
    }
    const role = roleOf(node)
    if (SKIP_ROLES.has(role)) return
    const name = str(node.name?.value)
    const leaf = LEAF_ROLES[role]

    if (leaf === 'text') {
      if (!onlyInteractive && hasWords(name)) push(itemOf(node, 'text', name))
      return
    }
    if (leaf) {
      if (onlyInteractive && !INTERACTIVE.has(leaf)) {
        for (const child of children(node)) visit(child, true)
        return
      }
      if (leaf === 'heading' || leaf === 'cell' || leaf === 'header') {
        // The name covers the text; links and controls inside still get their own stop.
        push(itemOf(node, leaf, name || textOf(node)))
        for (const child of children(node)) visit(child, true)
        return
      }
      push(itemOf(node, leaf, name))
      return
    }

    if (LANDMARK_ROLES.has(role) && (!NAMED_LANDMARKS.has(role) || clean(name))) {
      push({ ...itemOf(node, 'landmark', name), landmark: role })
      for (const child of children(node)) visit(child, onlyInteractive)
      return
    }
    if (role === 'list') {
      const count = countRole(node, new Set(['listitem']), false)
      push({ ...itemOf(node, 'list', name), count })
      for (const child of children(node)) visit(child, onlyInteractive)
      push(itemOf(node, 'listEnd', ''))
      return
    }
    if (TABLE_ROLES.has(role)) {
      const row = firstRow(node)
      push({
        ...itemOf(node, 'table', name),
        count: countRole(node, new Set(['row']), true),
        columns: row
          ? countRole(row, new Set(['cell', 'gridcell', 'columnheader', 'rowheader']), true)
          : 0,
      })
      for (const child of children(node)) visit(child, onlyInteractive)
      push(itemOf(node, 'tableEnd', ''))
      return
    }
    if (role === 'dialog' || role === 'alertdialog') {
      push(itemOf(node, 'dialog', name))
      for (const child of children(node)) visit(child, onlyInteractive)
      return
    }
    if (role === 'figure') {
      push(itemOf(node, 'figure', name))
      for (const child of children(node)) visit(child, onlyInteractive)
      return
    }

    const kids = children(node)
    if (!kids.length && !onlyInteractive && hasWords(name) && role !== 'RootWebArea') {
      push(itemOf(node, 'other', name))
      return
    }
    // Text runs across siblings make one line, the way a sentence with a <strong> in it reads.
    let run: { first: AXNode; text: string } | null = null
    const flush = () => {
      if (run && !onlyInteractive && hasWords(run.text)) push(itemOf(run.first, 'text', run.text))
      run = null
    }
    for (const child of kids) {
      const piece = inlineText(child)
      if (piece !== null) {
        run = run ? { first: run.first, text: run.text + piece } : { first: child, text: piece }
        continue
      }
      flush()
      visit(child, onlyInteractive)
    }
    flush()
  }

  /** A child's text when it belongs to the line around it; null when it is its own stop. */
  const inlineText = (node: AXNode): string | null => {
    if (node.ignored) return isHidden(node) ? '' : null
    const role = roleOf(node)
    if (role === 'StaticText') return str(node.name?.value)
    if (role === 'LineBreak') return ' '
    if (INLINE_ROLES.has(role) && textOnly(node)) return textOf(node)
    return null
  }

  const textOnly = (node: AXNode): boolean =>
    children(node).every((child) => {
      if (child.ignored) return isHidden(child) || textOnly(child)
      const role = roleOf(child)
      return (
        role === 'StaticText' || SKIP_ROLES.has(role) || (INLINE_ROLES.has(role) && textOnly(child))
      )
    })

  visit(root, false)

  // Reading one element: a focused box with only text in it still deserves a line.
  if (start && !snapshot.items.length && !root.ignored) {
    const text = clean(textOf(root))
    if (hasWords(text)) push(itemOf(root, 'other', text))
  }
  return snapshot
}

// ---- What the reader stumbles on -------------------------------------------

export interface ReaderFinding {
  rule: ReaderRuleId
  /** The item it is about; -1 for the page as a whole. */
  index: number
  role: ReaderRole
  name: string
  level: number
  /** Filled in by the main process, which can reach the DOM. */
  element: FindingElement | null
}

/** Per rule; a template bug repeats, and the first few show the pattern. */
const MAX_PER_RULE = 10

/** Unnamed controls and images, headings that skip a level, a page with no landmarks. */
export function readerFindings(snapshot: ReaderSnapshot): ReaderFinding[] {
  const found: ReaderFinding[] = []
  const counts: Partial<Record<ReaderRuleId, number>> = {}
  const add = (rule: ReaderRuleId, item: ReaderItem | null) => {
    const n = counts[rule] ?? 0
    if (n >= MAX_PER_RULE) return
    counts[rule] = n + 1
    found.push({
      rule,
      index: item ? item.index : -1,
      role: item ? item.role : 'other',
      name: item ? item.name : '',
      level: item ? item.level : 0,
      element: null,
    })
  }
  let lastLevel = 0
  for (const item of snapshot.items) {
    const unnamed = !hasWords(item.name)
    if (item.role === 'image' && unnamed) add('reader-image-name', item)
    else if (item.role === 'link' && unnamed) add('reader-link-name', item)
    else if (item.role === 'button' && unnamed) add('reader-button-name', item)
    else if (FIELD_ROLES.has(item.role) && unnamed) add('reader-field-name', item)
    else if (item.role === 'heading') {
      if (unnamed) add('reader-heading-empty', item)
      if (item.level && lastLevel && item.level > lastLevel + 1) add('reader-heading-order', item)
      if (item.level) lastLevel = item.level
    }
  }
  if (snapshot.items.length && !snapshot.landmarks) add('reader-no-landmarks', null)
  return found
}

/** Does the item still break the rule? For a check on a later day. */
export function readerRuleHolds(rule: ReaderRuleId, item: ReaderItem | null): RetestOutcome {
  if (rule === 'reader-no-landmarks') return 'unknown'
  if (!item) return 'unknown'
  const unnamed = !hasWords(item.name)
  switch (rule) {
    case 'reader-image-name':
      return item.role === 'image' ? (unnamed ? 'failing' : 'fixed') : 'fixed'
    case 'reader-link-name':
      return item.role === 'link' ? (unnamed ? 'failing' : 'fixed') : 'unknown'
    case 'reader-button-name':
      return item.role === 'button' ? (unnamed ? 'failing' : 'fixed') : 'unknown'
    case 'reader-field-name':
      return FIELD_ROLES.has(item.role) ? (unnamed ? 'failing' : 'fixed') : 'unknown'
    case 'reader-heading-empty':
      return item.role === 'heading' ? (unnamed ? 'failing' : 'fixed') : 'fixed'
    default:
      return 'unknown'
  }
}

// ---- Moving the virtual cursor ------------------------------------------------

/** What the quick keys jump to. */
export type ReaderTarget =
  'heading' | 'link' | 'button' | 'field' | 'edit' | 'list' | 'image' | 'landmark' | 'table'

export const readerTargets: readonly ReaderTarget[] = [
  'heading',
  'link',
  'button',
  'field',
  'edit',
  'list',
  'image',
  'landmark',
  'table',
]

export function matchesTarget(item: ReaderItem, target: ReaderTarget, level?: number): boolean {
  switch (target) {
    case 'heading':
      return item.role === 'heading' && (!level || item.level === level)
    case 'field':
      return FIELD_ROLES.has(item.role) || item.role === 'button'
    case 'edit':
      return item.role === 'edit'
    default:
      return item.role === target
  }
}

/** The next stop from `from` (-1 before the first) in `dir`; -1 when there is none. */
export function findNext(
  items: readonly ReaderItem[],
  from: number,
  target: ReaderTarget | null,
  dir: 1 | -1,
  level?: number,
): number {
  for (let i = from + dir; i >= 0 && i < items.length; i += dir) {
    const item = items[i]!
    if (!target || matchesTarget(item, target, level)) return i
  }
  return -1
}

// ---- What the owner's screens ask for and hear back ------------------------------

export type ReaderCommand =
  | { kind: 'move'; target: ReaderTarget | null; dir: 1 | -1; level?: number }
  | { kind: 'first' }
  | { kind: 'last' }
  | { kind: 'activate' }
  | { kind: 'refresh' }

export function isReaderCommand(value: unknown): value is ReaderCommand {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  if (c.kind === 'first' || c.kind === 'last' || c.kind === 'activate' || c.kind === 'refresh') {
    return true
  }
  if (c.kind !== 'move' || (c.dir !== 1 && c.dir !== -1)) return false
  if (c.target !== null && !(readerTargets as readonly unknown[]).includes(c.target)) return false
  const level = c.level
  return (
    level === undefined ||
    (typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 6)
  )
}

export type ReaderMode = 'browse' | 'focus'

/** One thing the reader says. The screens turn it into words and speech. */
export type ReaderEvent =
  | {
      type: 'page'
      title: string
      items: number
      headings: number
      links: number
      fields: number
      landmarks: number
      truncated: boolean
    }
  | { type: 'item'; item: ReaderItem; focus: boolean }
  | { type: 'edge'; edge: 'top' | 'bottom' }
  | { type: 'none'; target: ReaderTarget; dir: 1 | -1; level?: number }
  | { type: 'mode'; mode: ReaderMode }
  | { type: 'empty' }
  | { type: 'stop' }

/** What the reader card shows, pushed with every experience report. */
export interface ReaderReport {
  ready: boolean
  title: string
  items: number
  headings: number
  links: number
  fields: number
  landmarks: number
  truncated: boolean
  /** -1 before the first item. */
  cursor: number
  current: ReaderItem | null
  mode: ReaderMode
  findings: ReaderFinding[]
}

// ---- Words ------------------------------------------------------------------------

const roleWord = (item: ReaderItem, t: Translate): string => {
  switch (item.role) {
    case 'heading':
      return t('reader.role.heading', { level: item.level || 2 })
    case 'list':
      return item.count === 1
        ? t('reader.role.listOne')
        : t('reader.role.list', { count: item.count })
    case 'table':
      return t('reader.role.table', { rows: item.count, columns: item.columns })
    case 'landmark':
      return t(`reader.landmark.${item.landmark}` as MessageKey)
    case 'text':
    case 'cell':
      return ''
    case 'other':
      return item.raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
    default:
      return t(`reader.role.${item.role}` as MessageKey)
  }
}

/** Only states that say something: an unchecked box is worth a word, an enabled button is not. */
const stateWords = (item: ReaderItem, t: Translate): string[] => {
  const words: string[] = []
  for (const state of item.states) {
    if (state === 'multiline') continue
    if (item.role === 'switch' && (state === 'checked' || state === 'unchecked')) {
      words.push(t(state === 'checked' ? 'reader.state.on' : 'reader.state.off'))
    } else {
      words.push(t(`reader.state.${state}` as MessageKey))
    }
  }
  return words
}

/** What is said for one stop: the name, then what it is, then its state, as NVDA orders it. */
export function itemSpeech(item: ReaderItem, t: Translate): string {
  if (item.role === 'text') return item.name
  const parts: string[] = []
  if (item.name) parts.push(item.name)
  const role = roleWord(item, t)
  if (role) parts.push(role)
  if (item.role === 'edit' && item.states.includes('multiline'))
    parts.push(t('reader.role.multiline'))
  if (TYPING_ROLES.has(item.role) || item.role === 'progressbar') {
    parts.push(item.value || (item.role === 'edit' ? t('reader.blank') : ''))
  }
  parts.push(...stateWords(item, t))
  if (item.description) parts.push(item.description)
  return parts.filter(Boolean).join(', ')
}

/** How a finding is listed on the card: what it is, and its name when it has one. */
export function findingLabel(
  finding: Pick<ReaderFinding, 'role' | 'name' | 'level'>,
  t: Translate,
): string {
  if (finding.role === 'other') return t('reader.wholePage')
  const item: ReaderItem = {
    index: -1,
    node: 0,
    role: finding.role,
    raw: finding.role,
    landmark: '',
    name: '',
    description: '',
    value: '',
    level: finding.level,
    count: 0,
    columns: 0,
    states: [],
    focusable: false,
    editable: false,
  }
  const role = roleWord(item, t)
  return finding.name ? `${role} “${finding.name}”` : `${role} ${t('reader.unnamed')}`
}

const targetWord = (target: ReaderTarget, level: number | undefined, t: Translate): string =>
  target === 'heading' && level
    ? t('reader.what.headingLevel', { level })
    : t(`reader.what.${target}` as MessageKey)

/** The line for the transcript and the voice. Empty for events that say nothing. */
export function readerSpeech(event: ReaderEvent, t: Translate): string {
  switch (event.type) {
    case 'page': {
      const line = t('reader.page', {
        title: event.title || t('reader.untitled'),
        headings: event.headings,
        links: event.links,
        fields: event.fields,
        landmarks: event.landmarks,
      })
      return event.truncated ? `${line} ${t('reader.truncated', { count: event.items })}` : line
    }
    case 'item':
      return itemSpeech(event.item, t)
    case 'edge':
      return t(event.edge === 'top' ? 'reader.top' : 'reader.bottom')
    case 'none':
      return t(event.dir > 0 ? 'reader.noNext' : 'reader.noPrev', {
        what: targetWord(event.target, event.level, t),
      })
    case 'mode':
      return t(event.mode === 'focus' ? 'reader.mode.focus' : 'reader.mode.browse')
    case 'empty':
      return t('reader.empty')
    default:
      return ''
  }
}

/** The rule a reader finding breaks, in the shape findings are saved with. */
export function readerRuleFor(rule: ReaderRuleId, t: Translate) {
  const info = readerRules[rule]
  return {
    id: rule,
    help: t(`reader.rule.${rule}` as MessageKey),
    description: '',
    helpUrl: '',
    wcag: [...info.wcag],
    level: info.level,
    severity: info.severity,
  }
}
