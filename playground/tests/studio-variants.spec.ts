import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import uiPackage from '../../packages/ui/package.json' with { type: 'json' }
import registry from '../../registry/registry.json' with { type: 'json' }

type StudioCatalogItem = { address: string; title: string; source: string }
const catalogPath = fileURLToPath(new URL('../../registry/variants/catalog.json', import.meta.url))
const catalog: StudioCatalogItem[] = existsSync(catalogPath)
  ? JSON.parse(readFileSync(catalogPath, 'utf8'))
  : []
test.skip(catalog.length === 0, 'The Astrale variant catalog is not available.')

function groupBy<T>(values: readonly T[], key: (value: T) => string) {
  const groups = new Map<string, T[]>()
  for (const value of values) {
    const group = groups.get(key(value)) ?? []
    group.push(value)
    groups.set(key(value), group)
  }
  return groups
}

const byKind = groupBy(catalog, (item) => item.address.split('/')[0]!)
const runtimeComponentAddresses = Object.entries(uiPackage.exports)
  .filter(
    ([entrypoint, target]) =>
      entrypoint !== '.' &&
      entrypoint !== './class-name' &&
      typeof target === 'object' &&
      'import' in target,
  )
  .map(([entrypoint]) => `component/${entrypoint.slice(2)}`)
const publicByKind = groupBy(
  registry.items.filter(
    (item) =>
      item.meta.provider !== '@astrale-os/ui' &&
      /^(?:component|pattern|block)\//u.test(item.meta.canonicalAddress),
  ),
  (item) => item.meta.canonicalAddress.split('/')[0]!,
)

function expectedAddressesForKind(kind: string) {
  return [
    ...(byKind.get(kind) ?? []).map((item) => item.address),
    ...(publicByKind.get(kind) ?? []).map((item) => item.meta.canonicalAddress),
    ...(kind === 'component' ? runtimeComponentAddresses : []),
  ].sort()
}

test('every public and Studio preview has exactly one family owner', async ({ page }) => {
  for (const kind of ['component', 'pattern', 'block']) {
    await page.goto(`/?kind=${kind}`)
    const expectedAddresses = expectedAddressesForKind(kind)
    const observed = await page.locator('[data-preview-address]').evaluateAll((elements) =>
      elements
        .map((element) => ({
          address: element.getAttribute('data-preview-address')!,
          section: element.closest('section')?.id,
        }))
        .sort((left, right) => left.address.localeCompare(right.address)),
    )
    expect(observed.map((item) => item.address)).toEqual(expectedAddresses)
    expect(new Set(observed.map((item) => item.address)).size).toBe(expectedAddresses.length)
    expect(
      observed.every(
        (item) => item.section === `catalog-group-${item.address.split('/').slice(0, 2).join('-')}`,
      ),
    ).toBe(true)
  }
})

test('every workbook-defined Studio variant lazy-loads without a module or render failure', async ({
  page,
}) => {
  test.setTimeout(10 * 60_000)
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })

  for (const kind of ['component', 'pattern', 'block']) {
    const expected = byKind.get(kind) ?? []
    await page.goto(`/?kind=${kind}`)
    const all = page.locator('[data-preview-address]')
    const expectedAddresses = expectedAddressesForKind(kind)
    await expect(all).toHaveCount(expectedAddresses.length)
    for (const [index, item] of expected.entries()) {
      const preview = page.locator(`[data-preview-address="${item.address}"]`)
      await preview.scrollIntoViewIfNeeded()
      await expect(preview, `${index + 1}/${expected.length} ${item.address}`).toHaveAttribute(
        'data-preview-status',
        'ready',
        { timeout: 20_000 },
      )
    }
  }

  expect(browserErrors).toEqual([])
})

test('search metadata finds an unloaded item, intent prefetches its family, and selection loads only that preview', async ({
  page,
}) => {
  await page.goto('/?kind=pattern')
  const preview = page.locator(
    '[data-preview-address="pattern/navigation-menu/navigation-menu-01"]',
  )
  await expect(preview).toHaveAttribute('data-preview-status', 'idle')
  await expect(preview).not.toBeInViewport()
  const loadedResources = () =>
    page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name))
  expect((await loadedResources()).some((url) => url.includes('pattern-navigation-menu.gen'))).toBe(
    false,
  )
  await page.getByRole('button', { name: /Search components/u }).click()
  const palette = page.getByRole('dialog', { name: 'Search catalog' })
  await palette
    .getByPlaceholder('Search components, patterns, and blocks…')
    .fill('navigation-menu-01')
  const result = palette.getByRole('option', { name: 'Navigation Menu 1' })
  await expect(result).toBeVisible()
  expect((await loadedResources()).some((url) => url.includes('pattern-navigation-menu.gen'))).toBe(
    false,
  )
  await result.hover()
  await expect
    .poll(async () =>
      (await loadedResources()).some((url) => url.includes('pattern-navigation-menu.gen')),
    )
    .toBe(true)
  const loadedFamilyPreviews = async () =>
    (await loadedResources()).filter((url) => /navigation-menu-\d+\.preview-/u.test(url))
  expect(await loadedFamilyPreviews()).toEqual([])
  await result.press('Enter')
  await expect(page).toHaveURL(
    /\?preview=pattern%2Fnavigation-menu%2Fnavigation-menu-01%23default$/u,
  )
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')
  expect(await loadedFamilyPreviews()).toHaveLength(1)
  expect((await loadedFamilyPreviews())[0]).toContain('navigation-menu-01.preview')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\?kind=pattern$/u)
  await expect(page.getByRole('button', { name: /Search components/u })).toBeFocused()
})

test('near-viewport family prefetch preserves scroll and focus before preview execution', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/?kind=pattern')
  await page.waitForLoadState('networkidle')
  let releasePreviewRequests!: () => void
  const previewGate = new Promise<void>((resolve) => {
    releasePreviewRequests = resolve
  })
  await page.route('**/*.preview-*.js', async (route) => {
    await previewGate
    await route.continue()
  })
  const section = page.locator('#catalog-group-pattern-navigation-menu')
  const preview = section.locator(
    '[data-preview-address="pattern/navigation-menu/navigation-menu-01"]',
  )
  await expect(preview).toHaveAttribute('data-preview-status', 'idle')
  const focusBefore = await page.evaluate(() => document.activeElement?.tagName)
  await preview.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await expect
    .poll(() => requests.some((url) => url.includes('pattern-navigation-menu.gen')))
    .toBe(true)
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBefore, 0)
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focusBefore)
  const familyRequest = requests.findIndex((url) => url.includes('pattern-navigation-menu.gen'))
  expect(familyRequest).toBeGreaterThan(-1)
  await expect
    .poll(() => requests.some((url) => url.includes('navigation-menu-01.preview')))
    .toBe(true)
  const resolvedPreviewRequest = requests.findIndex((url) =>
    url.includes('navigation-menu-01.preview'),
  )
  expect(resolvedPreviewRequest).toBeGreaterThan(familyRequest)
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBefore, 0)
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focusBefore)
  releasePreviewRequests()
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focusBefore)
})

test('a direct URL loads an unloaded family and one family failure stays isolated', async ({
  page,
}) => {
  const failedFamily = '**/assets/component-kbd.gen-*.js'
  await page.route(failedFamily, (route) => route.abort())
  await page.goto('/?preview=component%2Fkbd%2Fkbd-08%23default')
  const failed = page.locator('[data-preview-address="component/kbd/kbd-08"]')
  await expect(failed).toHaveAttribute('data-preview-status', 'error')
  await expect(failed.getByText('Preview unavailable')).toBeVisible()
  await page.unroute(failedFamily)

  await page.goto('/?preview=component%2Flabel%2Flabel-01%23default')
  await expect(page.locator('[data-preview-address="component/label/label-01"]')).toHaveAttribute(
    'data-preview-status',
    'ready',
  )
})
