import React from 'react'
import ReactDOM from 'react-dom/client'
import '@astrale-os/ui/reset.css'
// Webfonts the bundled registry themes name, so each previews in its own type.
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/hanken-grotesk'

import './playground-theme.css'
import '@astrale-os/ui/presets/astrale.css'

import './playground.css'
import { Playground } from './playground.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Playground />
  </React.StrictMode>,
)
