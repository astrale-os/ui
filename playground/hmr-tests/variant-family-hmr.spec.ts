import { expect, test } from '@playwright/test'
import { readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const implementationPath = fileURLToPath(
  new URL('../../registry/variants/source/components/kbd/kbd-08/kbd-08.tsx', import.meta.url),
)
const autocompleteImplementationPath = fileURLToPath(
  new URL(
    '../../registry/variants/source/patterns/autocomplete/autocomplete-01/autocomplete-01.tsx',
    import.meta.url,
  ),
)

test('a loaded variant preview hot-updates without restarting or navigating', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?preview=component%2Fkbd%2Fkbd-08%23default')
  const preview = page.locator('[data-preview-address="component/kbd/kbd-08"]')
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')
  const documentSentinel = await page.evaluate(() => {
    const sentinel = crypto.randomUUID()
    ;(window as Window & { __catalogHmrSentinel?: string }).__catalogHmrSentinel = sentinel
    return sentinel
  })
  const original = statSync(implementationPath)
  const originalSource = readFileSync(implementationPath, 'utf8')
  const probeSource = originalSource.replace('>Combo Builder</span>', '>Combo Builder HMR</span>')
  try {
    writeFileSync(implementationPath, probeSource)
    await expect(preview.getByText('Combo Builder HMR', { exact: true })).toBeVisible()
    await expect(preview).toHaveAttribute('data-preview-status', 'ready')
    await expect(page).toHaveURL(/preview=component%2Fkbd%2Fkbd-08%23default/u)
    expect(
      await page.evaluate(
        () => (window as Window & { __catalogHmrSentinel?: string }).__catalogHmrSentinel,
      ),
    ).toBe(documentSentinel)
  } finally {
    writeFileSync(implementationPath, originalSource)
    utimesSync(implementationPath, original.atime, original.mtime)
    await expect(preview.getByText('Combo Builder HMR', { exact: true })).toHaveCount(0)
  }
})

test('a context-backed variant remains interactive in the development module graph', async ({
  page,
}) => {
  const reactContextErrors: string[] = []
  const recordReactContextError = (message: string) => {
    if (
      /Cannot read properties of null \(reading 'useContext'\)|Invalid hook call/iu.test(message)
    ) {
      reactContextErrors.push(message)
    }
  }
  page.on('pageerror', (error) => recordReactContextError(error.message))
  page.on('console', (message) => recordReactContextError(message.text()))

  await page.goto('/?preview=pattern%2Fautocomplete%2Fautocomplete-01%23default')
  const preview = page.locator('[data-preview-address="pattern/autocomplete/autocomplete-01"]')
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')

  const original = statSync(autocompleteImplementationPath)
  const originalSource = readFileSync(autocompleteImplementationPath, 'utf8')
  const probeSource = originalSource.replace(
    "placeholder='Search items'",
    "placeholder='Search items HMR'",
  )
  try {
    await preview.getByRole('combobox', { name: 'Search items' }).fill('dia')
    await expect(page.getByRole('option', { name: 'Dialog', exact: true })).toBeVisible()

    const documentSentinel = await page.evaluate(() => {
      const sentinel = crypto.randomUUID()
      ;(window as Window & { __catalogHmrSentinel?: string }).__catalogHmrSentinel = sentinel
      return sentinel
    })
    writeFileSync(autocompleteImplementationPath, probeSource)

    const updatedInput = preview.getByRole('combobox', { name: 'Search items HMR' })
    await expect(updatedInput).toBeVisible()
    await updatedInput.fill('dia')
    await expect(page.getByRole('option', { name: 'Dialog', exact: true })).toBeVisible()
    expect(
      await page.evaluate(
        () => (window as Window & { __catalogHmrSentinel?: string }).__catalogHmrSentinel,
      ),
    ).toBe(documentSentinel)
    await expect(preview).toHaveAttribute('data-preview-status', 'ready')
    expect(reactContextErrors).toEqual([])
  } finally {
    writeFileSync(autocompleteImplementationPath, originalSource)
    utimesSync(autocompleteImplementationPath, original.atime, original.mtime)
    await expect(preview.getByRole('combobox', { name: 'Search items' })).toBeVisible()
  }
})
