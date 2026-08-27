import { expect, test } from '@playwright/test'
import { readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const implementationPath = fileURLToPath(
  new URL('../../registry/variants/source/components/kbd/kbd-08/kbd-08.tsx', import.meta.url),
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
