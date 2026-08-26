export const domainRows = [
  { id: 'observatory', name: 'Observatory', status: 'Ready' },
  { id: 'journal', name: 'Journal', status: 'Draft' },
] as const

export const domainColumns = [
  { key: 'name', label: 'Domain' },
  { key: 'status', label: 'Status' },
] as const
