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

const refuse = async () => {
  await acknowledge()
  throw new Error('The secret store refused this request.')
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

export const secretManagerRejectedActions = {
  async onCreateVariable(_variable: EnvVar) {
    await refuse()
  },
  async onUpdateVariable(_variable: EnvVar) {
    await refuse()
  },
  async onDeleteVariable(_variable: EnvVar) {
    await refuse()
  },
  async onCopyValue(_variable: EnvVar) {
    await refuse()
  },
}
