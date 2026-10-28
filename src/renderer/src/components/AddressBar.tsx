import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type FormEvent } from 'react'
import type { SiteState } from '../../../shared/ipc'
import { displayAddress, normalizeAddress } from '../../../shared/url'
import { ansy } from '../lib/ansy'
import { useT } from '../lib/i18n'

export interface AddressBarHandle {
  focus: () => void
}

/**
 * The address bar. Shows the site's address while the owner isn't editing,
 * refuses anything that isn't a web address with a plain explanation, and
 * hands valid addresses to the site view.
 */
export const AddressBar = forwardRef<AddressBarHandle, { site: SiteState }>(function AddressBar(
  { site },
  ref,
) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (!editing) setValue(site.url ? displayAddress(site.url) : '')
  }, [site.url, editing])

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    },
  }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!normalizeAddress(value)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setEditing(false)
    void ansy.site.navigate(value)
  }

  return (
    <form className="relative flex min-w-0 flex-1 items-center gap-2" onSubmit={submit}>
      <label htmlFor="address" className="visually-hidden">
        {t('address.label')}
      </label>
      <input
        id="address"
        ref={inputRef}
        className="field min-w-0 flex-1"
        type="text"
        dir="auto"
        inputMode="url"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={t('address.placeholder')}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setEditing(true)
          setInvalid(false)
        }}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? 'address-error' : undefined}
      />
      <button type="submit" className="btn">
        {t('address.go')}
      </button>
      {invalid && (
        <p
          id="address-error"
          role="alert"
          className="card absolute start-0 top-full z-10 mt-2 max-w-md px-3 py-2 text-sm"
        >
          {t('address.invalid')}
        </p>
      )}
    </form>
  )
})
