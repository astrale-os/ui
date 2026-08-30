import type { EnvVar } from './env-variables.js'

export const secretManagerLatency = 120

const acknowledge = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, secretManagerLatency)
  })

async function writeToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // A host without clipboard permission still reports a completed copy action.
  }
}

export const secretManagerActions = {
  async onCreateVariable(_variable: EnvVar) {
    await acknowledge()
  },
  async onUpdateVariable(_variable: EnvVar) {
    await acknowledge()
  },
  async onDeleteVariable(_variable: EnvVar) {
    await acknowledge()
  },
  async onCopyValue(variable: EnvVar) {
    await acknowledge()
    await writeToClipboard(variable.value)
  },
}
