import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Download } from '@playwright/test'

import { componentNames } from '../src/catalog/inventory.js'

async function downloadText(download: Download) {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

test('playground renders every public runtime owner and complete registry inventory', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Tune the system. Keep the behavior.' }),
  ).toBeVisible()

  const rendered = await page.locator('[data-component]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-component'))
      .filter(Boolean)
      .sort(),
  )
  expect(rendered).toEqual([...componentNames].sort())
  expect(new Set(rendered).size).toBe(50)
  const viewport = await page.evaluate(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    importWidth: document
      .querySelector<HTMLInputElement>('[aria-label="Import theme document"]')!
      .getBoundingClientRect().width,
  }))
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth)
  expect(viewport.importWidth).toBeLessThanOrEqual(1)

  await page.getByRole('tab', { name: 'Complete inventory' }).click()
  await expect(page.locator('[data-registry-item]')).toHaveCount(52)
  await expect(page.locator('[data-registry-item="theme-observatory"]')).toBeVisible()
})

test('theme editing, mode, history, saving, import, and export remain live', async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  const root = page.locator('[data-slot="ui-playground"]')
  const primaryValue = () =>
    root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-primary').trim())
  await expect.poll(primaryValue).toBe('oklch(0.36 0.14 251)')

  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(root).toHaveClass(/dark/u)
  await expect.poll(primaryValue).toBe('oklch(0.76 0.13 250)')
  await page.getByLabel('Starter').click()
  await page.getByRole('option', { name: 'Atelier' }).click()
  await expect(root).toHaveAttribute('data-ui-theme', 'atelier')
  await expect.poll(primaryValue).toBe('oklch(0.72 0.19 32)')

  await page.getByRole('tab', { name: 'Colors' }).click()
  const primaryToken = page.getByLabel('Primary', { exact: true })
  await primaryToken.fill('oklch(0.62 0.2 145)')
  await primaryToken.blur()
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(primaryToken).toHaveValue('oklch(0.72 0.19 32)')
  await expect.poll(primaryValue).toBe('oklch(0.72 0.19 32)')
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByLabel('Primary', { exact: true })).toHaveValue('oklch(0.62 0.2 145)')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')

  await page.getByRole('button', { name: 'Save theme' }).click()
  await expect(page.getByText('Atelier saved in this browser')).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('astrale-ui-playground:themes:v1') ?? '[]')
        return {
          count: saved.length,
          name: saved[0]?.name,
          primary: saved[0]?.appearance?.dark?.primary,
        }
      }),
    )
    .toEqual({ count: 1, name: 'atelier', primary: 'oklch(0.62 0.2 145)' })

  await page.reload()
  await page.getByLabel('Saved themes').click()
  await page.getByRole('option', { name: 'Atelier' }).click()
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(root).toHaveAttribute('data-ui-theme', 'atelier')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')

  await page.getByRole('tab', { name: 'Export' }).click()
  await expect(page.locator('[data-slot="theme-install-command"]')).toContainText(
    'astrale ui add ./atelier.css',
  )
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('atelier.astrale-theme.json')
  const exported = JSON.parse(await downloadText(download))
  expect(exported).toMatchObject({
    version: 1,
    name: 'atelier',
    appearance: { dark: { primary: 'oklch(0.62 0.2 145)' } },
  })

  await page.getByLabel('Starter').click()
  await page.getByRole('option', { name: 'Terminal' }).click()
  await expect(root).toHaveAttribute('data-ui-theme', 'terminal')
  const importInput = page.getByLabel('Import theme document')
  await importInput.setInputFiles((await download.path())!)
  await expect(root).toHaveAttribute('data-ui-theme', 'atelier')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect(importInput).toHaveValue('')

  const cssDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSS' }).click()
  const cssDownload = await cssDownloadPromise
  expect(cssDownload.suggestedFilename()).toBe('atelier.css')
  const css = await downloadText(cssDownload)
  expect(css).toContain('Consumer-owned after installation.')
  expect(css.match(/--ui-primary: oklch\(0\.62 0\.2 145\);/gu)).toHaveLength(1)
  expect(pageErrors).toEqual([])
  await testInfo.attach(`theme-studio-${testInfo.project.name}`, {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
})

test('search navigation and representative overlays are keyboard operable', async ({ page }) => {
  await page.goto('/')
  const search = page.getByLabel('Find a component or registry item')
  await search.fill('dialog')
  await search.press('Enter')
  await expect(page.locator('[data-component="dialog"]')).toBeInViewport()

  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeHidden()

  await page.getByRole('button', { name: 'Public contract' }).click()
  await expect(page.getByText('Every runtime owner has a flat package subpath.')).toBeVisible()
})

test('all starter modes have no serious automated accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const starters = {
    Atelier: { slug: 'atelier', light: 'oklch(0.52 0.2 28)', dark: 'oklch(0.72 0.19 32)' },
    Observatory: {
      slug: 'observatory',
      light: 'oklch(0.36 0.14 251)',
      dark: 'oklch(0.76 0.13 250)',
    },
    Terminal: { slug: 'terminal', light: 'oklch(0.43 0.12 205)', dark: 'oklch(0.72 0.14 195)' },
  } as const
  const root = page.locator('[data-slot="ui-playground"]')
  for (const [starter, expected] of Object.entries(starters)) {
    await page.getByLabel('Starter').click()
    await page.getByRole('option', { name: starter }).click()
    for (const mode of ['light', 'dark'] as const) {
      await page
        .getByRole('button', { name: mode === 'light' ? 'Light' : 'Dark', exact: true })
        .click()
      await expect(root).toHaveAttribute('data-ui-theme', expected.slug)
      if (mode === 'dark') await expect(root).toHaveClass(/dark/u)
      else await expect(root).not.toHaveClass(/dark/u)
      await expect
        .poll(() =>
          root.evaluate((element) =>
            getComputedStyle(element).getPropertyValue('--ui-primary').trim(),
          ),
        )
        .toBe(expected[mode])
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(
        results.violations.filter((violation) =>
          ['critical', 'serious'].includes(violation.impact ?? ''),
        ),
        `${starter} ${mode}`,
      ).toEqual([])
    }
  }
})
