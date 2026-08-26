import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Download } from '@playwright/test'

import registry from '../../registry/registry.json' with { type: 'json' }
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
  await expect(page.locator('[data-slot="ui-playground"]')).toBeVisible()
  await expect(
    page.locator('.playground-header, .playground-navigation, .playground-hero'),
  ).toHaveCount(0)
  await expect(page.getByText('Tune the system.')).toHaveCount(0)
  await expect(page.getByText('Theme studio')).toHaveCount(0)

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
  const registryItems = await page.locator('[data-registry-item]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-registry-item'))
      .filter(Boolean)
      .sort(),
  )
  expect(registryItems).toEqual(registry.items.map((item) => item.name).sort())
  expect(new Set(registryItems).size).toBe(52)
  await expect(page.locator('[data-registry-item="theme-observatory"]')).toBeVisible()
})

test('theme editing, mode, history, saving, import, and export remain live', async ({
  context,
  page,
}, testInfo) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
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
  await expect(page.getByRole('option', { name: 'Atelier' })).toBeHidden()
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

  await page.getByRole('tab', { name: 'Typography' }).click()
  await page.getByLabel('Body font').click()
  await page.getByRole('option', { name: 'Avenir Next' }).click()
  await expect
    .poll(() =>
      root.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ui-font-body').trim(),
      ),
    )
    .toContain('Avenir Next')

  await page.getByRole('tab', { name: 'Other' }).click()
  await page.locator('input[aria-label="Corner radius"]').press('ArrowRight')
  await expect
    .poll(() =>
      root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-radius').trim()),
    )
    .toBe('1.05rem')

  await page.getByRole('button', { name: 'Randomize' }).click()
  await expect.poll(primaryValue).not.toBe('oklch(0.62 0.2 145)')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')

  await page.getByRole('button', { name: 'Save theme' }).click()
  const savedToast = page.getByRole('dialog', { name: 'Atelier saved in this browser' })
  await expect(savedToast).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('astrale-ui-playground:themes:v1') ?? '[]')
        return {
          count: saved.length,
          name: saved[0]?.name,
          primary: saved[0]?.appearance?.dark?.primary,
          body: saved[0]?.typography?.body,
          radius: saved[0]?.geometry?.radius,
        }
      }),
    )
    .toEqual({
      count: 1,
      name: 'atelier',
      primary: 'oklch(0.62 0.2 145)',
      body: "'Avenir Next', 'Segoe UI Variable', ui-sans-serif, sans-serif",
      radius: '1.05rem',
    })

  await page.reload()
  await page.getByLabel('Saved themes').click()
  await page.getByRole('option', { name: 'Atelier' }).click()
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(root).toHaveAttribute('data-ui-theme', 'atelier')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect
    .poll(() =>
      root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-radius').trim()),
    )
    .toBe('1.05rem')

  await page.getByRole('tab', { name: 'Export' }).click()
  await expect(page.locator('[data-slot="theme-install-command"]')).toContainText(
    'astrale ui add ./atelier.css',
  )
  await page.getByRole('button', { name: 'Copy command' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('astrale ui add ./atelier.css')
  await expect(page.getByRole('dialog', { name: 'Install command copied' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close toast' })).toHaveCount(0)
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: () => Promise.reject(new Error('Clipboard denied for qualification')),
    })
  })
  await page.getByRole('button', { name: 'Copy CSS' }).click()
  const copyFailure = page.getByRole('alert').filter({ hasText: 'Copy failed' })
  await expect(copyFailure).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close toast' })).toHaveCount(0)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('atelier.astrale-theme.json')
  const exported = JSON.parse(await downloadText(download))
  expect(exported).toMatchObject({
    version: 1,
    name: 'atelier',
    appearance: { dark: { primary: 'oklch(0.62 0.2 145)' } },
    typography: { body: "'Avenir Next', 'Segoe UI Variable', ui-sans-serif, sans-serif" },
    geometry: { radius: '1.05rem' },
  })

  await page.getByLabel('Starter').click()
  await page.getByRole('option', { name: 'Terminal' }).click()
  await expect(root).toHaveAttribute('data-ui-theme', 'terminal')
  await page.getByLabel('Import theme document').setInputFiles({
    name: 'atelier.astrale-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  })
  await expect(page.getByRole('dialog', { name: 'Atelier imported' })).toBeVisible()
  await expect(root).toHaveAttribute('data-ui-theme', 'atelier')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect
    .poll(() =>
      root.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ui-font-body').trim(),
      ),
    )
    .toContain('Avenir Next')
  await expect
    .poll(() =>
      root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-radius').trim()),
    )
    .toBe('1.05rem')

  const cssDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSS' }).click()
  const cssDownload = await cssDownloadPromise
  expect(cssDownload.suggestedFilename()).toBe('atelier.css')
  const css = await downloadText(cssDownload)
  expect(css).toContain('Consumer-owned after installation.')
  expect(css.match(/--ui-primary: oklch\(0\.62 0\.2 145\);/gu)).toHaveLength(1)
  expect(css).toContain(
    "--ui-font-body: 'Avenir Next', 'Segoe UI Variable', ui-sans-serif, sans-serif;",
  )
  expect(css).toContain('--ui-radius: 1.05rem;')
  await expect(page.getByRole('button', { name: 'Close toast' })).toHaveCount(0)
  await testInfo.attach(`theme-studio-${testInfo.project.name}`, {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
  await page.waitForTimeout(100)
  expect(pageErrors).toEqual([])
})

test('phone layout settles without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect
    .poll(() =>
      page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        panel: Math.ceil(
          document.querySelector('[aria-label="Theme generator"]')!.getBoundingClientRect().width,
        ),
      })),
    )
    .toEqual({ viewport: 390, document: 390, panel: 390 })
})

test('invalid storage and save failures stay contained', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem('astrale-ui-playground:themes:v1', '{not-valid-json'),
  )
  await page.reload()
  await expect(page.locator('[data-slot="ui-playground"]')).toBeVisible()
  await expect(page.getByLabel('Saved themes')).toHaveCount(0)

  await page.evaluate(() => {
    const storage = Storage.prototype as Storage & { restoreSetItem?: () => void }
    const original = storage.setItem
    storage.setItem = () => {
      throw new DOMException('Storage unavailable for qualification', 'QuotaExceededError')
    }
    storage.restoreSetItem = () => {
      storage.setItem = original
      delete storage.restoreSetItem
    }
  })
  await page.getByRole('button', { name: 'Save theme' }).click()
  const saveFailure = page.getByRole('alert').filter({ hasText: 'Theme save failed' })
  await expect(saveFailure).toContainText('Storage unavailable for qualification')
  await expect(page.getByLabel('Saved themes')).toHaveCount(0)
  await page.evaluate(() => {
    const storage = Storage.prototype as Storage & { restoreSetItem?: () => void }
    storage.restoreSetItem?.()
  })
  expect(pageErrors).toEqual([])
})

test('representative overlays and disclosures are keyboard operable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeHidden()

  await page.getByRole('button', { name: 'Public contract' }).click()
  await expect(page.getByText('Every runtime owner has a flat package subpath.')).toBeVisible()
})

test('all starter modes have no serious automated accessibility violations', async ({ page }) => {
  const consoleProblems: string[] = []
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) consoleProblems.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const accordionDurations = await page
    .locator('[data-slot="accordion-content"]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          animation: style.animationDuration,
          transition: style.transitionDuration,
        }
      }),
    )
  expect(accordionDurations.length).toBeGreaterThan(0)
  expect(accordionDurations).toEqual(
    accordionDurations.map(() => ({ animation: '0s', transition: '0s' })),
  )
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
  expect(consoleProblems).toEqual([])
})
