import { expect, test } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import uiPackage from '../../packages/ui/package.json' with { type: 'json' }
import registry from '../../registry/registry.json' with { type: 'json' }

type StudioCatalogItem = { address: string; title: string; source: string }
const catalogPath = fileURLToPath(
  new URL('../../.internal/shadcn-studio/catalog.json', import.meta.url),
)
const catalog: StudioCatalogItem[] = existsSync(catalogPath)
  ? JSON.parse(readFileSync(catalogPath, 'utf8'))
  : []
test.skip(catalog.length === 0, 'The licensed local Studio catalog is not hydrated.')

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
  registry.items.filter((item) =>
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

test('a filtered offscreen variant loads after moving into the viewport', async ({ page }) => {
  await page.goto('/?kind=pattern')
  const preview = page.locator(
    '[data-preview-address="pattern/navigation-menu/navigation-menu-01"]',
  )
  await expect(preview).toHaveAttribute('data-preview-status', 'idle')
  await expect(preview).not.toBeInViewport()
  await page.getByRole('textbox', { name: 'Search catalog' }).fill('navigation-menu-01')
  await expect(preview).toBeInViewport()
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')
})
