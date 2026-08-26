import React from 'react'
import ReactDOM from 'react-dom/client'
import '@astrale-os/ui/theme.css'
import '@astrale-os/ui/presets/astrale.css'

import './playground.css'
import { Playground } from './playground.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Playground />
  </React.StrictMode>,
)
