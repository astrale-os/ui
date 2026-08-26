import React from 'react'
import ReactDOM from 'react-dom/client'
import '@astrale-os/ui/theme.css'
import '@astrale-os/ui/presets/astrale.css'
import '@astrale-os/ui/presets/compact.css'
import '@astrale-os/ui/presets/expressive.css'

import './catalog.css'
import { Catalog } from './catalog.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Catalog />
  </React.StrictMode>,
)
