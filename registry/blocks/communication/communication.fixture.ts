export const conversations = [
  { id: 'runtime', sender: 'Runtime', subject: 'Schema revision ready', unread: true },
  { id: 'operator', sender: 'Operator', subject: 'Qualification complete' },
] as const

export const messages = [
  { id: '1', author: 'Runtime', body: 'The schema revision is ready.' },
  { id: '2', author: 'Operator', body: 'Proceed with qualification.' },
] as const
