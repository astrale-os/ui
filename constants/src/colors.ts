export const MACOS_COLORS = {
  close: {
    default: '#ff5f57',
    hover: '#ff4136',
  },
  minimize: {
    default: '#febc2e',
    hover: '#e5a829',
  },
  maximize: {
    default: '#28c840',
    hover: '#1fb037',
  },
  disabled: {
    light: '#ddd',
    dark: '#4a5568',
  },
} as const

export const GLASS_COLORS = {
  window: {
    light: 'rgba(255, 255, 255, 0.92)',
    dark: 'rgba(15, 23, 42, 0.92)',
  },
  panel: {
    default: 'rgba(0, 0, 0, 0.35)',
  },
  taskbar: {
    default: 'rgba(15, 23, 42, 0.85)',
  },
  dock: {
    default: 'rgba(0, 0, 0, 0.2)',
  },
} as const

export const BLUR_VALUES = {
  glass: '12px',
  glassLight: '20px',
  glassHeavy: '40px',
} as const
