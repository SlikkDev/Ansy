import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ansy } from './lib/ansy'
import { applyLocale } from './lib/i18n'
import { applyTheme } from './lib/theme'
import './styles/globals.css'

// Language and theme go onto <html> before the first paint, so nothing flashes.
applyLocale(ansy.initial.locale)
applyTheme(ansy.initial.settings.theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initial={ansy.initial} />
  </StrictMode>,
)
