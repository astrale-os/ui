import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Download, type Page } from '@playwright/test'
import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import uiPackage from '../../packages/ui/package.json' with { type: 'json' }
import registry from '../../registry/registry.json' with { type: 'json' }
import { componentGroups } from '../src/catalog/inventory.js'

const runtimeAddresses = Object.entries(uiPackage.exports)
  .filter(
    ([entrypoint, target]) =>
      entrypoint !== '.' &&
      entrypoint !== './class-name' &&
      typeof target === 'object' &&
      'import' in target,
  )
  .map(([entrypoint]) => `component/${entrypoint.slice(2)}`)
const visualRegistryAddresses = registry.items
  .map((item) => item.meta.canonicalAddress)
  .filter((address) => /^(?:component|pattern|block)\//u.test(address))
const expectedCanonicalAddresses = [
  ...new Set<string>([...runtimeAddresses, ...visualRegistryAddresses]),
].sort()
const expectedComponentNames = expectedCanonicalAddresses
  .filter((address) => address.startsWith('component/'))
  .map((address) => address.slice('component/'.length))
const expectedAddressesByKind = {
  Components: expectedCanonicalAddresses.filter((address) => address.startsWith('component/')),
  Patterns: expectedCanonicalAddresses.filter((address) => address.startsWith('pattern/')),
  Blocks: expectedCanonicalAddresses.filter((address) => address.startsWith('block/')),
} as const
const expectedFamilies = [
  ...new Set([
    ...componentGroups
      .filter((group) => group.components.length > 0)
      .map((group) => `component/${group.id}`),
    ...(visualRegistryAddresses.some((address) => address.startsWith('component/'))
      ? ['component/registry']
      : []),
    ...visualRegistryAddresses
      .filter((address) => /^(?:pattern|block)\//u.test(address))
      .map((address) => address.split('/').slice(0, 2).join('/')),
  ]),
].sort()
const expectedSceneIds = globSync(
  ['packages/ui/previews/**/*.preview.tsx', 'registry/**/*.preview.tsx'],
  { cwd: fileURLToPath(new URL('../..', import.meta.url)) },
)
  .map((file) => {
    const normalized = file.replaceAll('\\', '/')
    const filename = normalized.split('/').at(-1)!
    const match = /^(?<subject>[a-z0-9-]+)(?:\.(?<scene>[a-z0-9-]+))?\.preview\.tsx$/u.exec(
      filename,
    )!
    const scene = match.groups?.scene ?? 'default'
    const runtime = /packages\/ui\/previews\/([^/]+)\//u.exec(normalized)
    if (runtime) return `component/${runtime[1]}#${scene}`
    const component = /registry\/components\/([^/]+)\//u.exec(normalized)
    if (component) return `component/${component[1]}#${scene}`
    const composition = /registry\/(patterns|blocks)\/([^/]+)\/([^/]+)$/u.exec(normalized)!
    const kind = composition[1] === 'patterns' ? 'pattern' : 'block'
    return `${kind}/${composition[2]}/${match.groups!.subject}#${scene}`
  })
  .sort()
const expectedSceneCounts = new Map<string, number>()
for (const id of expectedSceneIds) {
  const address = id.split('#')[0]!
  expectedSceneCounts.set(address, (expectedSceneCounts.get(address) ?? 0) + 1)
}

async function downloadText(download: Download) {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

async function openThemeCustomizer(page: Page) {
  await page.getByRole('button', { name: 'Customize theme' }).click()
  await expect(page.getByLabel('Theme generator')).toBeVisible()
}

async function loadPreview(page: Page, address: string, scene = 'default') {
  const preview = page.locator(`[data-preview-address="${address}"][data-preview-scene="${scene}"]`)
  await expect(preview).toHaveCount(1)
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toHaveAttribute('data-preview-status', 'ready', { timeout: 15_000 })
  return preview
}

async function selectCatalogKind(page: Page, kind: keyof typeof expectedAddressesByKind) {
  const sections = page.getByLabel('Catalog sections')
  await sections.getByRole('tab', { name: kind }).click()
  await expect(sections.getByRole('tab', { name: kind })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-preview-address]')).toHaveCount(
    expectedAddressesByKind[kind].length,
  )
}

async function expectDerivedSceneIndicators(
  page: Page,
  kind: keyof typeof expectedAddressesByKind,
) {
  const observed = await page.locator('[data-preview-address]').evaluateAll((elements) =>
    elements
      .map((element) => {
        const action = element.querySelector('.preview-card-actions')
        const views = action?.querySelectorAll<HTMLElement>('[aria-label^="View "]') ?? []
        const badges = action?.querySelectorAll<HTMLElement>('[data-slot="badge"]') ?? []
        const view = views[0]
        const badge = badges[0]
        const visible = (target: HTMLElement | undefined) => {
          if (!target) return false
          const rect = target.getBoundingClientRect()
          const style = getComputedStyle(target)
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          )
        }
        return {
          address: element.getAttribute('data-preview-address'),
          actionCount: element.querySelectorAll('.preview-card-actions').length,
          badge: badge?.textContent ?? null,
          badgeCount: badges.length,
          badgeLabel: badge?.getAttribute('aria-label') ?? null,
          badgeVisible: visible(badge),
          viewCount: views.length,
          viewVisible: visible(view),
        }
      })
      .sort((left, right) => left.address!.localeCompare(right.address!)),
  )
  expect(observed).toEqual(
    expectedAddressesByKind[kind].map((address) => {
      const count = expectedSceneCounts.get(address)!
      return {
        address,
        actionCount: 1,
        badge: count > 1 ? String(count) : null,
        badgeCount: count > 1 ? 1 : 0,
        badgeLabel: count > 1 ? `${count} preview scenes` : null,
        badgeVisible: count > 1,
        viewCount: 1,
        viewVisible: true,
      }
    }),
  )
}

test('playground exposes every public runtime owner and complete visual registry inventory', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('[data-slot="ui-playground"]')).toBeVisible()
  await expect(
    page.locator('.playground-header, .playground-navigation, .playground-hero'),
  ).toHaveCount(0)
  await expect(page.getByText('Tune the system.')).toHaveCount(0)
  await expect(page.getByText('Theme studio')).toHaveCount(0)
  await expect(page.getByLabel('Theme generator')).toHaveCount(0)

  const rendered = await page.locator('[data-component]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-component'))
      .filter(Boolean)
      .sort(),
  )
  expect(rendered).toEqual(expectedComponentNames)
  expect(new Set(rendered).size).toBe(expectedComponentNames.length)
  const canonicalPreviews: { address: string | null; scene: string | null }[] = []
  for (const kind of ['Components', 'Patterns', 'Blocks'] as const) {
    await selectCatalogKind(page, kind)
    canonicalPreviews.push(
      ...(await page.locator('[data-preview-address]').evaluateAll((elements) =>
        elements.map((element) => ({
          address: element.getAttribute('data-preview-address'),
          scene: element.getAttribute('data-preview-scene'),
        })),
      )),
    )
  }
  expect(canonicalPreviews).toHaveLength(expectedCanonicalAddresses.length)
  expect(new Set(canonicalPreviews.map((item) => `${item.address}#${item.scene}`)).size).toBe(
    expectedCanonicalAddresses.length,
  )
  expect(canonicalPreviews.every((item) => item.scene === 'default')).toBe(true)
  expect(canonicalPreviews.map((item) => item.address).sort()).toEqual(expectedCanonicalAddresses)
  await expect(page.locator('[data-preview-address="block/settings/team"]')).toHaveAttribute(
    'data-preview-status',
    'idle',
  )
  const search = page.getByRole('textbox', { name: 'Search catalog' })
  await search.fill('block/settings/team')
  await expect(page.locator('[data-preview-address]')).toHaveCount(1)
  await expect(page.locator('[data-preview-address="block/settings/team"]')).toHaveAttribute(
    'data-preview-status',
    'ready',
  )
  await search.clear()
  await expect(page.locator('[data-preview-address]')).toHaveCount(
    expectedAddressesByKind.Blocks.length,
  )
  await selectCatalogKind(page, 'Components')
  await search.fill('variants')
  const namedButton = page.locator(
    '[data-preview-address="component/button"][data-preview-scene="variants"]',
  )
  await expect(namedButton).toHaveAttribute('data-preview-status', 'ready')
  await expect(namedButton.getByRole('button', { name: 'Revoke' })).toBeVisible()
  await search.clear()
  const viewport = await page.evaluate(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth)
  await expect(page.getByText('@astrale-os/ui/toggle', { exact: true })).toHaveCount(0)
  await expect(page.getByText('component/calendar', { exact: true })).toHaveCount(0)
  const cardSpecimen = await loadPreview(page, 'component/card')
  const cardWidths = await cardSpecimen.evaluate((element) => ({
    specimen: element.getBoundingClientRect().width,
    card: element
      .querySelector(':scope > [data-slot="card-content"] > [data-slot="card"]')
      ?.getBoundingClientRect(),
    outer: element.getBoundingClientRect(),
    contentOverflow: getComputedStyle(element.querySelector(':scope > [data-slot="card-content"]')!)
      .overflow,
    specimenOverflow: getComputedStyle(element).overflow,
    footerBorder: getComputedStyle(element.querySelector('[data-slot="card-footer"]')!)
      .borderTopColor,
    cardRing: getComputedStyle(
      element.querySelector(':scope > [data-slot="card-content"] > [data-slot="card"]')!,
    ).boxShadow,
    borderToken: getComputedStyle(element.closest('[data-slot="ui-playground"]')!)
      .getPropertyValue('--ui-border')
      .trim(),
  }))
  expect(cardWidths.card?.width).toBeGreaterThan(cardWidths.specimen * 0.8)
  expect(cardWidths.card!.top - cardWidths.outer.top).toBeGreaterThan(1)
  expect(cardWidths.outer.bottom - cardWidths.card!.bottom).toBeGreaterThan(1)
  expect(cardWidths.contentOverflow).toBe('visible')
  expect(cardWidths.specimenOverflow).toBe('visible')
  expect(cardWidths.footerBorder).toBe(cardWidths.borderToken)
  expect(cardWidths.cardRing).toMatch(/0px 0px 0px 1px/u)
  await loadPreview(page, 'component/chart')
  const chartLine = page.locator('[data-component="chart"] path.recharts-line-curve').first()
  await expect(chartLine).toBeVisible()
  await expect
    .poll(() =>
      chartLine.evaluate((element) => {
        const root = element.closest('[data-slot="ui-playground"]')
        if (!root) return false
        const styles = getComputedStyle(root)
        const token = styles.getPropertyValue('--ui-chart-1').trim()
        return token === 'oklch(0.58 0.18 251)' && getComputedStyle(element).stroke === token
      }),
    )
    .toBe(true)

  await selectCatalogKind(page, 'Blocks')
  const team = await loadPreview(page, 'block/settings/team')
  const teamLayout = await team.evaluate((element) => {
    const content = element.querySelector(':scope > [data-slot="card-content"]')!
    const block = content.querySelector('[data-slot="block-settings-team"]')!
    const contentRect = content.getBoundingClientRect()
    const blockRect = block.getBoundingClientRect()
    return {
      width: Math.round(blockRect.width),
      contentWidth: Math.round(contentRect.width),
      maxWidth: getComputedStyle(block).maxWidth,
      leftGap: Math.round(blockRect.left - contentRect.left),
      rightGap: Math.round(contentRect.right - blockRect.right),
    }
  })
  expect(teamLayout.maxWidth).toBe('672px')
  expect(teamLayout.width).toBe(Math.min(672, teamLayout.contentWidth - 24))
  expect(Math.abs(teamLayout.leftGap - teamLayout.rightGap)).toBeLessThanOrEqual(1)
  const signInLayout = await loadPreview(page, 'block/authentication/sign-in-card')
  const signInGeometry = await signInLayout.evaluate((element) => {
    const content = element.querySelector(':scope > [data-slot="card-content"]')!
    const block = content.querySelector('[data-slot="block-authentication-sign-in-card"]')!
    const contentRect = content.getBoundingClientRect()
    const blockRect = block.getBoundingClientRect()
    return {
      width: Math.round(blockRect.width),
      contentWidth: Math.round(contentRect.width),
      maxWidth: getComputedStyle(block).maxWidth,
      leftGap: Math.round(blockRect.left - contentRect.left),
      rightGap: Math.round(contentRect.right - blockRect.right),
    }
  })
  expect(signInGeometry.maxWidth).toBe('448px')
  expect(signInGeometry.width).toBe(Math.min(448, signInGeometry.contentWidth - 24))
  expect(Math.abs(signInGeometry.leftGap - signInGeometry.rightGap)).toBeLessThanOrEqual(1)
  await selectCatalogKind(page, 'Components')

  await openThemeCustomizer(page)
  await expect(page.locator('[data-slot="theme-studio"]')).toBeVisible()
  await expect
    .poll(() =>
      page
        .locator('[data-slot="drawer-overlay"]')
        .evaluate((element) => getComputedStyle(element).backdropFilter),
    )
    .toBe('none')
  const importWidth = await page
    .getByLabel('Import theme document')
    .evaluate((element) => element.getBoundingClientRect().width)
  expect(importWidth).toBeLessThanOrEqual(1)
  await expect(page.locator('[data-component="button"]')).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByLabel('Theme generator')).toHaveCount(0)

  await openThemeCustomizer(page)
  await page.getByLabel('Starter').click()
  await expect(page.getByRole('option', { name: 'Observatory' })).toBeVisible()
})

test('catalog loads previews near the viewport once and preserves loaded state', async ({
  page,
}) => {
  const previewRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('.preview.tsx')) previewRequests.push(request.url())
  })
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')

  const distant = page.locator('[data-preview-address="block/settings/team"]')
  await expect(distant).toHaveAttribute('data-preview-status', 'idle')
  expect(previewRequests.some((url) => url.includes('/team.preview.tsx'))).toBe(false)
  await loadPreview(page, 'block/settings/team')
  expect(previewRequests.filter((url) => url.includes('/team.preview.tsx'))).toHaveLength(1)

  await selectCatalogKind(page, 'Components')
  const select = await loadPreview(page, 'component/select')
  await select.getByRole('combobox', { name: 'Environment' }).click()
  await page.getByRole('option', { name: 'Staging' }).click()
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')
  await select.scrollIntoViewIfNeeded()
  await expect(select).toHaveAttribute('data-preview-status', 'ready')
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')
  expect(previewRequests.filter((url) => url.includes('/team.preview.tsx'))).toHaveLength(1)
  await openThemeCustomizer(page)
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')

  await page.goto('/?family=component%2Factions-inputs')
  const actionsInputs = componentGroups.find((group) => group.id === 'actions-inputs')!
  expect(await page.locator('[data-preview-address]').count()).toBeGreaterThan(
    actionsInputs.components.length,
  )
  await loadPreview(page, 'component/button', 'variants')
  await expect(page.getByRole('button', { name: 'Revoke' })).toBeVisible()
})

test('kind tabs, scene indicators, isolation, and both back journeys preserve place', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByLabel('Catalog sections').getByRole('tab', { name: 'Components' }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.section-heading h2')).toHaveText([
    'Actions & inputs',
    'Content & feedback',
    'Menus & overlays',
    'Navigation & layout',
    'Registry components',
  ])
  await expectDerivedSceneIndicators(page, 'Components')
  const sections = page.getByLabel('Catalog sections')
  const componentsTab = sections.getByRole('tab', { name: 'Components' })
  await componentsTab.focus()
  await componentsTab.press('ArrowRight')
  const patternsTab = sections.getByRole('tab', { name: 'Patterns' })
  await expect(patternsTab).toBeFocused()
  await patternsTab.press('Enter')
  await expect(page).toHaveURL(/\?kind=pattern$/u)
  await expect(patternsTab).toHaveAttribute('aria-selected', 'true')
  await page.goBack()
  await expect(page).toHaveURL(/\/$/u)
  await expect(componentsTab).toHaveAttribute('aria-selected', 'true')
  await expect(componentsTab).toBeFocused()
  await page.goForward()
  await expect(page).toHaveURL(/\?kind=pattern$/u)
  await expect(page.locator('[data-preview-address]')).toHaveCount(
    expectedAddressesByKind.Patterns.length,
  )
  await page.goBack()

  await selectCatalogKind(page, 'Patterns')
  await expect(page).toHaveURL(/\?kind=pattern$/u)
  await expectDerivedSceneIndicators(page, 'Patterns')
  await selectCatalogKind(page, 'Blocks')
  await expect(page).toHaveURL(/\?kind=block$/u)
  await expectDerivedSceneIndicators(page, 'Blocks')

  const signIn = await loadPreview(page, 'block/authentication/sign-in-card')
  await signIn.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const initialTop = await signIn.evaluate((element) => element.getBoundingClientRect().top)
  const viewSignIn = signIn.getByRole('button', { name: 'View sign in card preview' })
  await viewSignIn.focus()
  await viewSignIn.press('Enter')
  await expect(page).toHaveURL(/\?preview=block%2Fauthentication%2Fsign-in-card%23default$/u)
  await expect(page.locator('[data-preview-address]')).toHaveCount(1)
  await expect(
    page.locator('[data-preview-address="block/authentication/sign-in-card"]'),
  ).toHaveCount(1)
  await expect(page.locator('.preview-card-actions')).toHaveCount(0)
  const back = page.getByRole('button', { name: 'Back' })
  await expect(back.locator('[data-icon="inline-start"]')).toHaveCount(1)
  await back.press('Enter')
  await expect(page).toHaveURL(/\?kind=block$/u)
  const restored = page.locator('[data-preview-address="block/authentication/sign-in-card"]')
  const restoredView = restored.getByRole('button', { name: 'View sign in card preview' })
  await expect
    .poll(() => restored.evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(initialTop, 0)
  await expect(restoredView).toBeFocused()

  const nativeTop = await restored.evaluate((element) => element.getBoundingClientRect().top)
  await restoredView.press('Enter')
  await page.goBack()
  await expect(page).toHaveURL(/\?kind=block$/u)
  await expect
    .poll(() => restored.evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(nativeTop, 0)
  await expect(restoredView).toBeFocused()

  await page.goto('/?preview=block%2Fauthentication%2Fsign-in-card%23default')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\?kind=block$/u)
  await expect(page.locator('[data-preview-address]')).toHaveCount(
    expectedAddressesByKind.Blocks.length,
  )
})

test('return anchor survives a delayed lazy block resolving above it', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'The delayed geometry contract is viewport-neutral.',
  )
  let releaseWorkspace: (() => void) | undefined
  const workspaceRelease = new Promise<void>((resolve) => {
    releaseWorkspace = resolve
  })
  await page.route(/\/responsive-workspace\.preview\.tsx(?:\?|$)/u, async (route) => {
    await workspaceRelease
    await route.continue()
  })
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const delayed = page.locator(
    '[data-preview-address="block/application-shell/responsive-workspace"]',
  )
  await expect(delayed).toHaveAttribute('data-preview-status', 'loading')
  const loadingHeight = await delayed.evaluate((element) => element.getBoundingClientRect().height)

  const signIn = await loadPreview(page, 'block/authentication/sign-in-card')
  await signIn.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const expectedTop = await signIn.evaluate((element) => element.getBoundingClientRect().top)
  await signIn.getByRole('button', { name: 'View sign in card preview' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect
    .poll(() => signIn.evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(expectedTop, 0)

  await page.waitForTimeout(350)
  releaseWorkspace?.()
  await expect(delayed).toHaveAttribute('data-preview-status', 'ready')
  const readyHeight = await delayed.evaluate((element) => element.getBoundingClientRect().height)
  expect(readyHeight).toBeGreaterThan(loadingHeight + 100)
  await expect
    .poll(() => signIn.evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(expectedTop, 0)
})

test('every canonical preview mounts without page or console failures', async ({ page }) => {
  test.setTimeout(180_000)
  const pageErrors: string[] = []
  const consoleProblems: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) consoleProblems.push(message.text())
  })
  await page.goto('/')
  let ready = 0
  for (const kind of ['Components', 'Patterns', 'Blocks'] as const) {
    await selectCatalogKind(page, kind)
    const previews = page.locator('[data-preview-address]')
    const count = await previews.count()
    for (let index = 0; index < count; index += 1) {
      const preview = previews.nth(index)
      await preview.scrollIntoViewIfNeeded()
      await expect(preview).toHaveAttribute('data-preview-status', 'ready', { timeout: 10_000 })
      await expect(preview.getByText('Preview unavailable')).toHaveCount(0)
      ready += 1
    }
  }
  expect(ready).toBe(expectedCanonicalAddresses.length)
  expect(pageErrors).toEqual([])
  expect(consoleProblems).toEqual([])
  const width = await page.evaluate(() => ({
    inner: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(width.scroll).toBeLessThanOrEqual(width.inner)
})

test('every discovered canonical and named scene appears in a family and mounts', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await page.goto('/')
  const rendered = new Set<string>()
  for (const family of expectedFamilies) {
    await page.evaluate((nextFamily) => {
      history.pushState({}, '', `?family=${encodeURIComponent(nextFamily)}`)
      dispatchEvent(new PopStateEvent('popstate'))
      scrollTo({ top: 0 })
    }, family)
    await expect(page.locator(`#catalog-group-${family.replaceAll('/', '-')}`)).toBeVisible()
    const previews = page.locator('[data-preview-address]')
    const count = await previews.count()
    for (let index = 0; index < count; index += 1) {
      const preview = previews.nth(index)
      rendered.add(
        `${await preview.getAttribute('data-preview-address')}#${await preview.getAttribute('data-preview-scene')}`,
      )
      await preview.scrollIntoViewIfNeeded()
      await expect(preview).toHaveAttribute('data-preview-status', 'ready', { timeout: 15_000 })
      await expect(preview.getByText('Preview unavailable')).toHaveCount(0)
    }
    const width = await page.evaluate(() => ({
      inner: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(width.scroll).toBeLessThanOrEqual(width.inner)
  }
  expect([...rendered].sort()).toEqual(expectedSceneIds)
})

test('representative patterns and blocks keep controlled state without product navigation', async ({
  page,
}) => {
  const interactWithoutNavigation = async (interaction: () => Promise<void>) => {
    const before = page.url()
    await interaction()
    expect(page.url()).toBe(before)
  }

  await page.goto('/?family=pattern%2Fcalendar')
  const calendar = await loadPreview(page, 'pattern/calendar/range-basic')
  await interactWithoutNavigation(async () => {
    await calendar.getByRole('button', { name: '2', exact: true }).click()
    await calendar.getByRole('button', { name: '8', exact: true }).click()
  })
  await expect(calendar.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(calendar.getByRole('button', { name: '8', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.goto('/?family=pattern%2Fcarousel')
  const carousel = await loadPreview(page, 'pattern/carousel/horizontal-controlled')
  const carouselPrevious = carousel.getByRole('button', { name: 'Previous' })
  await expect(carouselPrevious).toBeDisabled()
  await interactWithoutNavigation(() => carousel.getByRole('button', { name: 'Next' }).click())
  await expect(carouselPrevious).toBeEnabled()

  await page.goto('/?family=pattern%2Fcommand-palette')
  const commandPalette = await loadPreview(page, 'pattern/command-palette/dialog-basic')
  await commandPalette.getByRole('button', { name: 'Open command palette' }).click()
  const commandSearch = page.getByPlaceholder('Search commands')
  await commandSearch.fill('Inspect')
  await expect(page.getByRole('option', { name: 'Inspect Schema' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Open Domain' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await page.goto('/?family=pattern%2Fdata-table')
  const table = await loadPreview(page, 'pattern/data-table/server-controlled')
  await expect(table.getByText('Page 1 of 3')).toBeVisible()
  await interactWithoutNavigation(() => table.getByRole('button', { name: 'Next' }).click())
  await expect(table.getByText('Page 2 of 3')).toBeVisible()

  await page.goto('/?family=pattern%2Fform')
  const wizard = await loadPreview(page, 'pattern/form/wizard-controlled')
  await interactWithoutNavigation(() => wizard.getByRole('button', { name: 'Continue' }).click())
  await expect(wizard.getByRole('heading', { name: 'Review' })).toBeVisible()
  await expect(wizard.getByRole('button', { name: 'Finish' })).toBeVisible()

  await page.goto('/?family=pattern%2Ftoast')
  const toast = await loadPreview(page, 'pattern/toast/controlled-queue')
  await expect(toast.getByText('Revision ready')).toBeVisible()
  await interactWithoutNavigation(() => toast.getByRole('button', { name: 'Dismiss' }).click())
  await expect(toast.getByText('Revision ready')).toHaveCount(0)

  await page.goto('/?family=pattern%2Fsidebar')
  const sidebar = await loadPreview(page, 'pattern/sidebar/mobile-controlled')
  await sidebar.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible()
  await page.getByRole('button', { name: 'Catalog' }).click()
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden()

  await page.goto('/?family=block%2Fauthentication')
  const signIn = await loadPreview(page, 'block/authentication/sign-in-card')
  const email = signIn.getByRole('textbox', { name: 'Email' })
  await email.fill('owner@astrale.ai')
  await expect(email).toHaveValue('owner@astrale.ai')
  await interactWithoutNavigation(() =>
    signIn.getByRole('button', { name: 'Sign in', exact: true }).click(),
  )

  await page.goto('/?family=block%2Fsettings')
  const notifications = await loadPreview(page, 'block/settings/notifications')
  const updates = notifications.getByRole('switch', { name: 'Product updates' })
  await expect(updates).toHaveAttribute('aria-checked', 'false')
  await updates.click()
  await expect(updates).toHaveAttribute('aria-checked', 'true')
})

test('invalid catalog addresses have an accessible empty state', async ({ page }) => {
  await page.goto('/?preview=component%2Fmissing%23default')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('No previews found')
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
})

test('a failed preview module is contained and recovers after a document reload', async ({
  page,
}) => {
  const previewModule = /\/button\.preview\.tsx(?:\?|$)/u
  await page.route(previewModule, (route) => route.abort('failed'))
  await page.goto('/?preview=component%2Fbutton%23default')
  const preview = page.locator('[data-preview-address="component/button"]')
  await expect(preview).toHaveAttribute('data-preview-status', 'error')
  await expect(preview.getByRole('button', { name: 'Reload playground' })).toBeVisible()
  await page.unroute(previewModule)
  await preview.getByRole('button', { name: 'Reload playground' }).click()
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')
  await expect(preview.getByRole('button', { name: 'Continue' })).toBeVisible()
})

test('loading and readiness expose stable accessible canvas semantics', async ({ page }) => {
  let releaseModule: (() => void) | undefined
  const holdModule = new Promise<void>((resolve) => {
    releaseModule = resolve
  })
  await page.route(/\/team\.preview\.tsx(?:\?|$)/u, async (route) => {
    await holdModule
    await route.continue()
  })
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const preview = page.locator('[data-preview-address="block/settings/team"]')
  const labelledBy = await preview.getAttribute('aria-labelledby')
  expect(labelledBy).toBeTruthy()
  await expect(page.locator(`#${labelledBy}`)).toHaveCount(1)
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toHaveAttribute('aria-busy', 'true')
  await expect(preview.locator('.preview-placeholder')).toHaveAttribute('aria-hidden', 'true')
  releaseModule?.()
  await expect(preview).toHaveAttribute('data-preview-status', 'ready')
  await expect(preview).not.toHaveAttribute('aria-busy', 'true')
})

test('catalog specimens own their interaction without navigating the playground', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')

  await loadPreview(page, 'component/input')
  const domainPath = page.getByRole('textbox', { name: 'Domain path' })
  await domainPath.fill('/:journal.astrale.ai')
  await expect(domainPath).toHaveValue('/:journal.astrale.ai')
  await loadPreview(page, 'component/input-group')
  const graphPath = page.getByRole('textbox', { name: 'Graph path' })
  await graphPath.fill('domains/journal')
  await expect(graphPath).toHaveValue('domains/journal')

  await loadPreview(page, 'component/select')
  const select = page.locator('[data-component="select"]')
  const selectTrigger = select.getByRole('combobox', { name: 'Environment' })
  await selectTrigger.click()
  await expect(page.locator('[data-slot="select-content"]')).toHaveAttribute(
    'data-align-trigger',
    'true',
  )
  await page.getByRole('option', { name: 'Staging' }).click()
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')

  await loadPreview(page, 'component/slider')
  const slider = page.getByRole('slider', { name: 'Retention' })
  await expect(slider).toHaveAttribute('aria-valuenow', '62')
  await slider.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '63')

  await loadPreview(page, 'component/input-otp')
  const otp = page.getByRole('textbox', { name: 'Verification code' })
  await otp.fill('805214')
  await expect(otp).toHaveValue('805214')

  await loadPreview(page, 'component/spinner')
  const spinner = page.locator('[data-component="spinner"] [data-slot="spinner"]')
  await spinner.scrollIntoViewIfNeeded()
  const spinnerMotion = await spinner.evaluate(async (element) => {
    const before = getComputedStyle(element).transform
    await new Promise((resolve) => setTimeout(resolve, 120))
    const styles = getComputedStyle(element)
    return {
      before,
      after: styles.transform,
      duration: styles.animationDuration,
      name: styles.animationName,
      playState: styles.animationPlayState,
    }
  })
  expect(spinnerMotion).toMatchObject({ duration: '1s', name: 'spin', playState: 'running' })
  expect(spinnerMotion.after).not.toBe(spinnerMotion.before)

  await loadPreview(page, 'component/calendar')
  await page.getByRole('button', { name: 'Thursday, August 27th, 2026' }).click()
  await expect(
    page.getByRole('gridcell', { name: /Thursday, August 27th, 2026/u }),
  ).toHaveAttribute('aria-selected', 'true')

  await loadPreview(page, 'component/carousel')
  const carousel = page.getByRole('region', { name: 'Component families' })
  const previous = carousel.getByRole('button', { name: 'Previous slide' })
  await expect(previous).toBeDisabled()
  await carousel.getByRole('button', { name: 'Next slide' }).click()
  await expect(previous).toBeEnabled()

  await loadPreview(page, 'component/dropdown-menu')
  const dropdown = page.locator('[data-component="dropdown-menu"]')
  await dropdown.scrollIntoViewIfNeeded()
  await dropdown.getByRole('button', { name: 'Complex menu' }).click()
  await expect(page.getByRole('menuitem', { name: /Profile/u })).toContainText('⇧⌘P')
  const statusBar = page.getByRole('menuitemcheckbox', { name: 'Status Bar' })
  await expect(statusBar).toHaveAttribute('aria-checked', 'false')
  await statusBar.click()
  await expect(statusBar).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('menuitem', { name: 'Invite Users' }).press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: 'Email', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await loadPreview(page, 'component/menubar')
  const menubar = page.locator('[data-component="menubar"]')
  await menubar.getByRole('menuitem', { name: 'File' }).click()
  await expect(page.getByRole('menuitem', { name: /New Tab/u })).toContainText('⌘T')
  await page.getByRole('menuitem', { name: 'Share' }).press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: 'Email link' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  const themeMenu = menubar.getByRole('menuitem', { name: 'Theme' })
  await themeMenu.click()
  const darkItem = page.getByRole('menuitemradio', { name: 'Dark' })
  await darkItem.click()
  await expect(themeMenu).toHaveAttribute('aria-expanded', 'true')
  await expect(darkItem).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Escape')
  await expect(themeMenu).toHaveAttribute('aria-expanded', 'false')
  await expect(darkItem).toBeHidden()

  await loadPreview(page, 'component/pagination')
  const pagination = page.locator('[data-component="pagination"]')
  await pagination.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => ({ href: location.href, scrollY }))
  await pagination.getByRole('button', { name: '2' }).click()
  await expect(pagination.getByRole('button', { name: '2' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect.poll(() => page.evaluate(() => ({ href: location.href, scrollY }))).toEqual(before)
})

test('theme editing, mode, history, saving, import, and export remain live', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await openThemeCustomizer(page)
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
  await page.keyboard.press('Escape')
  const customizerTrigger = page.getByRole('button', { name: 'Customize theme' })
  await expect(customizerTrigger).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Theme generator')).toBeVisible()
  await expect(page.getByLabel('Primary', { exact: true })).toHaveValue('oklch(0.62 0.2 145)')
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
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
  await page.getByRole('slider', { name: 'Corner radius' }).press('ArrowRight')
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
  await openThemeCustomizer(page)
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
  const copyFailure = page.getByRole('dialog', { name: 'Copy failed' })
  await expect(copyFailure).toBeVisible()
  await expect(copyFailure.getByRole('button', { name: 'Close toast' })).toHaveCount(0)
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
  const importInput = page.getByLabel('Import theme document')
  await importInput.setInputFiles({
    name: 'atelier.astrale-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  })
  const importedToast = page.getByRole('dialog', { name: 'Atelier imported' })
  await expect(importedToast).toBeVisible()
  await expect(importInput).toHaveValue('')
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
  await page.mouse.move(0, 0)
  await expect(importedToast).toBeHidden({ timeout: 10_000 })

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
  await openThemeCustomizer(page)
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
    .toEqual(expect.objectContaining({ viewport: 390, document: 390 }))
  const panelWidth = await page
    .getByLabel('Theme generator')
    .evaluate((element) => Math.ceil(element.getBoundingClientRect().width))
  expect(panelWidth).toBeGreaterThanOrEqual(374)
  expect(panelWidth).toBeLessThanOrEqual(390)
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
  await openThemeCustomizer(page)
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
  const saveFailure = page.getByRole('dialog', { name: 'Theme save failed' })
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
  const customizerTrigger = page.getByRole('button', { name: 'Customize theme' })
  await customizerTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Theme generator')).toBeVisible()
  const drawerPopup = page.locator('[data-slot="drawer-popup"]')
  const focusRemainsInDrawer = () =>
    page.evaluate(() => Boolean(document.activeElement?.closest('[data-slot="drawer-popup"]')))
  await drawerPopup.focus()
  await page.keyboard.press('Shift+Tab')
  await expect.poll(focusRemainsInDrawer).toBe(true)
  const lastDrawerControl = drawerPopup
    .locator(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )
    .last()
  await lastDrawerControl.focus()
  await page.keyboard.press('Tab')
  await expect.poll(focusRemainsInDrawer).toBe(true)
  await expect(lastDrawerControl).not.toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Theme generator')).toHaveCount(0)

  await loadPreview(page, 'component/dialog')
  const dialogTrigger = page.getByRole('button', { name: 'Open dialog' })
  await dialogTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeHidden()

  await loadPreview(page, 'component/accordion')
  const disclosure = page.getByRole('button', { name: 'Public contract' })
  const disclosureContent = page.getByText('Every runtime owner has a flat package subpath.')
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(disclosureContent).toBeHidden()
  await page.keyboard.press('Space')
  await expect(disclosureContent).toBeVisible()
})

test('all starter modes have no serious automated accessibility violations', async ({ page }) => {
  test.setTimeout(60_000)
  const consoleProblems: string[] = []
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) consoleProblems.push(message.text())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await openThemeCustomizer(page)
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
  await page.keyboard.press('Escape')
  await loadPreview(page, 'component/spinner')
  const reducedSpinner = await page
    .locator('[data-component="spinner"] [data-slot="spinner"]')
    .evaluate(async (element) => {
      const before = getComputedStyle(element).transform
      await new Promise((resolve) => setTimeout(resolve, 120))
      const style = getComputedStyle(element)
      return {
        after: style.transform,
        before,
        duration: style.animationDuration,
        iterations: style.animationIterationCount,
        name: style.animationName,
        playState: style.animationPlayState,
      }
    })
  expect(reducedSpinner).toMatchObject({
    duration: '1s',
    iterations: 'infinite',
    name: 'spin',
    playState: 'running',
  })
  expect(reducedSpinner.after).not.toBe(reducedSpinner.before)
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition-delay: 0s !important; transition-duration: 0s !important; }',
  })
  await openThemeCustomizer(page)
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

test('every loaded family is serious-violation-free in every released theme mode', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The semantic theme matrix is viewport-neutral.')
  test.setTimeout(360_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const pageErrors: string[] = []
  const consoleProblems: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) consoleProblems.push(message.text())
  })
  await page.goto('/')
  const familyUrls = expectedFamilies.map((family) => `?family=${encodeURIComponent(family)}`)

  for (const starter of ['Atelier', 'Observatory', 'Terminal']) {
    for (const mode of ['Light', 'Dark']) {
      await openThemeCustomizer(page)
      await page.getByLabel('Starter').click()
      await page.getByRole('option', { name: starter }).click()
      await page.getByRole('button', { name: mode, exact: true }).click()
      await page.getByRole('button', { name: 'Close', exact: true }).click()

      for (const familyUrl of familyUrls) {
        const family = new URL(familyUrl, 'http://catalog.local').searchParams.get('family')!
        await page.evaluate((url) => {
          history.pushState({}, '', url)
          dispatchEvent(new PopStateEvent('popstate'))
          scrollTo({ top: 0 })
        }, familyUrl)
        await expect(page.locator(`#catalog-group-${family.replaceAll('/', '-')}`)).toBeVisible()
        const previews = page.locator('[data-preview-address]')
        const count = await previews.count()
        expect(count, familyUrl).toBeGreaterThan(0)
        for (let index = 0; index < count; index += 1) {
          const preview = previews.nth(index)
          await preview.scrollIntoViewIfNeeded()
          await expect(preview).toHaveAttribute('data-preview-status', 'ready', {
            timeout: 15_000,
          })
          await expect(preview.getByText('Preview unavailable')).toHaveCount(0)
        }
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
        expect(
          results.violations.filter((violation) =>
            ['critical', 'serious'].includes(violation.impact ?? ''),
          ),
          `${starter} ${mode} ${familyUrl}`,
        ).toEqual([])
      }
    }
  }
  expect(pageErrors).toEqual([])
  expect(consoleProblems).toEqual([])
})
