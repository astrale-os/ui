import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Download, type Page } from '@playwright/test'
import { globSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import uiPackage from '../../packages/ui/package.json' with { type: 'json' }
import registry from '../../registry/registry.json' with { type: 'json' }
import { componentNames } from '../src/catalog/inventory.js'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const starterThemeDocuments = globSync('registry/themes/*.astrale-theme.json', {
  cwd: repositoryRoot,
})
  .map((file) => JSON.parse(readFileSync(`${repositoryRoot}/${file}`, 'utf8')))
  .sort((left, right) => left.label.localeCompare(right.label))

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
  .filter((item) => item.meta.provider !== '@astrale-os/ui')
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
  ...new Set(expectedCanonicalAddresses.map((address) => address.split('/').slice(0, 2).join('/'))),
].sort()
const expectedComponentFamilyNames = [
  ...new Set(
    expectedCanonicalAddresses
      .filter((address) => address.startsWith('component/'))
      .map((address) => address.split('/')[1]!),
  ),
]
const componentFamilyOrder = new Map<string, number>(
  componentNames.map((name, index) => [name, index]),
)
const expectedComponentFamilyLabels = expectedComponentFamilyNames
  .sort((left, right) => {
    const leftOrder = componentFamilyOrder.get(left)
    const rightOrder = componentFamilyOrder.get(right)
    if (leftOrder !== undefined || rightOrder !== undefined) {
      return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER)
    }
    return left.localeCompare(right)
  })
  .map((name) => name.replaceAll('-', ' '))
const expectedSceneIds = globSync(
  ['packages/ui/previews/**/*.preview.tsx', 'registry/**/*.preview.tsx'],
  { cwd: repositoryRoot },
)
  .filter((file) => !file.includes('registry/variants/'))
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
async function downloadText(download: Download) {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

async function openThemeCustomizer(page: Page) {
  await page.getByRole('button', { name: 'Customize theme' }).click()
  await expect(page.getByLabel('Theme generator')).toBeVisible()
  await expect(page.locator('[data-slot="theme-studio"]')).toBeVisible()
}

async function selectFieldOption(page: Page, label: string, option: string) {
  const openContent = page.locator('[data-slot="select-content"]:visible')
  await expect(openContent).toHaveCount(0)
  await page.getByLabel(label, { exact: true }).click()
  await expect(openContent).toHaveCount(1)
  await openContent.getByRole('option', { name: option, exact: true }).click()
  await expect(openContent).toHaveCount(0)
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
  await expect(page.getByLabel('Theme generator')).not.toBeVisible()
  await expect(page.locator('[aria-label^="View "][aria-label$=" preview"]')).toHaveCount(0)

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
  await selectCatalogKind(page, 'Components')
  await expect(
    page.locator('#catalog-group-component-button [data-preview-address]').first(),
  ).toHaveAttribute('data-preview-address', 'component/button')
  await selectCatalogKind(page, 'Components')
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
  await expect(page.locator('[data-slot="drawer-overlay"]')).toHaveCount(0)
  await expect(page.locator('#playground-main')).not.toHaveAttribute('inert', '')
  const importWidth = await page
    .getByLabel('Import theme document')
    .evaluate((element) => element.getBoundingClientRect().width)
  expect(importWidth).toBeLessThanOrEqual(1)
  await expect(page.locator('[data-component="button"]')).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByLabel('Theme generator')).not.toBeVisible()

  await openThemeCustomizer(page)
  const themeSelect = page.getByRole('combobox', { name: 'Theme' })
  await themeSelect.click()
  await expect(page.getByRole('option', { name: 'Observatory', exact: true })).toBeVisible()
})

test('theme runtime stays isolated from catalog size and projects only changed properties', async ({
  page,
}) => {
  await page.goto('/')
  const documentRoot = page.locator('html')
  const catalog = page.locator('#playground-main')
  await openThemeCustomizer(page)

  await expect(page.locator('[data-slot="live-theme-css"]')).toHaveCount(0)
  await expect(page.locator('[data-slot="drawer-overlay"]')).toHaveCount(0)
  await expect(catalog).not.toHaveAttribute('inert', '')
  await expect
    .poll(() =>
      page
        .locator('.specimen-section')
        .nth(1)
        .evaluate((element) => getComputedStyle(element).contentVisibility),
    )
    .toBe('auto')

  const properties = () =>
    documentRoot.evaluate((element) =>
      Object.fromEntries(
        [...element.style]
          .filter((name) => name.startsWith('--ui-'))
          .map((name) => [name, element.style.getPropertyValue(name)]),
      ),
    )
  const before = await properties()
  const primary = page.getByLabel('Primary', { exact: true })
  await primary.fill('oklch(0.61 0.18 145)')
  await primary.blur()
  await expect
    .poll(() => documentRoot.evaluate((element) => element.style.getPropertyValue('--ui-primary')))
    .toBe('oklch(0.61 0.18 145)')
  const after = await properties()

  expect(Object.keys(after).filter((name) => before[name] !== after[name])).toEqual([
    '--ui-primary',
  ])
})

test('catalog loads previews near the viewport once and preserves loaded state', async ({
  page,
}) => {
  const previewRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('.preview.tsx')) previewRequests.push(request.url())
  })
  await page.goto('/')
  await selectCatalogKind(page, 'Components')

  const distant = page.locator('[data-preview-address="component/tooltip"]')
  await expect(distant).toHaveAttribute('data-preview-status', 'idle')
  expect(previewRequests.some((url) => url.includes('/tooltip.preview.tsx'))).toBe(false)
  await loadPreview(page, 'component/tooltip')
  expect(previewRequests.filter((url) => url.includes('/tooltip.preview.tsx'))).toHaveLength(1)

  await selectCatalogKind(page, 'Components')
  const select = await loadPreview(page, 'component/select')
  await select.getByRole('combobox', { name: 'Environment' }).click()
  await page.getByRole('option', { name: 'Staging' }).click()
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')
  await select.scrollIntoViewIfNeeded()
  await expect(select).toHaveAttribute('data-preview-status', 'ready')
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')
  expect(previewRequests.filter((url) => url.includes('/tooltip.preview.tsx'))).toHaveLength(1)
  await openThemeCustomizer(page)
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')

  await page.goto('/?family=component%2Fbutton')
  expect(await page.locator('[data-preview-address]').count()).toBeGreaterThan(1)
  await loadPreview(page, 'component/button', 'variants')
  await expect(page.getByRole('button', { name: 'Revoke' })).toBeVisible()
})

test('kind tabs, outline, family navigation, and both back journeys preserve place', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Components' })).toHaveCount(0)
  const outlineTrigger = page.getByRole('button', { name: 'Outline' })
  await outlineTrigger.click()
  const outline = page.getByRole('dialog', { name: 'Components' })
  await expect(outline).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(outline).toBeHidden()
  await expect(outlineTrigger).toBeFocused()
  await outlineTrigger.press('Enter')
  await expect(outline).toBeVisible()
  const outlineNavigation = outline.getByRole('navigation', { name: 'Components outline' })
  await expect(outlineNavigation.getByRole('button')).toHaveCount(
    expectedComponentFamilyLabels.length,
  )
  await outlineNavigation
    .getByRole('button')
    .filter({ hasText: /^calendar/u })
    .click()
  await expect(page).toHaveURL(/\?family=component%2Fcalendar$/u)
  await expect(outline).toBeHidden()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/$/u)
  await expect(outlineTrigger).toBeFocused()
  await expect(
    page.getByLabel('Catalog sections').getByRole('tab', { name: 'Components' }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.section-heading h2')).toHaveText(expectedComponentFamilyLabels)
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
  await selectCatalogKind(page, 'Blocks')
  await expect(page).toHaveURL(/\?kind=block$/u)

  const authentication = page.locator('#catalog-group-block-authentication')
  const authenticationPreviews = authentication.locator('[data-preview-address]')
  for (let index = 0; index < (await authenticationPreviews.count()); index += 1) {
    const preview = authenticationPreviews.nth(index)
    await preview.scrollIntoViewIfNeeded()
    await expect(preview).toHaveAttribute('data-preview-status', 'ready', { timeout: 15_000 })
  }
  await authentication.scrollIntoViewIfNeeded()
  const viewAuthentication = authentication.getByRole('button', { name: 'View family' })
  await viewAuthentication.scrollIntoViewIfNeeded()
  await viewAuthentication.focus()
  const initialTop = await authentication.evaluate((element) => element.getBoundingClientRect().top)
  await viewAuthentication.press('Enter')
  await expect(page).toHaveURL(/\?family=block%2Fauthentication$/u)
  await expect(
    page.locator('[data-preview-address="block/authentication/sign-in-card"]'),
  ).toHaveCount(1)
  const back = page.getByRole('button', { name: 'Back' })
  await expect(back.locator('[data-icon="inline-start"]')).toHaveCount(1)
  await back.press('Enter')
  await expect(page).toHaveURL(/\?kind=block$/u)
  const restored = page.locator('#catalog-group-block-authentication')
  const restoredView = restored.getByRole('button', { name: 'View family' })
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

test('command palette searches canonical items and preserves keyboard navigation', async ({
  page,
}) => {
  const previewRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('.preview.tsx')) previewRequests.push(request.url())
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const trigger = page.getByRole('button', { name: /Search components/u })
  await expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K')
  await expect(trigger.locator('[data-slot="kbd"]')).toHaveText('⌘K')

  await page.evaluate(() =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: 'k',
        repeat: true,
      }),
    ),
  )
  await expect(page.getByRole('dialog', { name: 'Search catalog' })).toHaveCount(0)
  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Search catalog' })
  await expect(palette).toBeVisible()
  await page.evaluate(() =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: 'k',
        repeat: true,
      }),
    ),
  )
  await expect(palette).toBeVisible()
  await expect(palette.getByRole('option')).toHaveCount(expectedCanonicalAddresses.length)
  await expect(page.locator('[data-preview-status="loading"]')).toHaveCount(0)
  await page.waitForLoadState('networkidle')
  const previewRequestBaseline = previewRequests.length
  const input = palette.getByPlaceholder('Search components, patterns, and blocks…')
  await expect(input).toBeFocused()
  await input.fill('range basic')
  await page.waitForTimeout(250)
  expect(previewRequests).toHaveLength(previewRequestBaseline)
  expect(await palette.getByRole('option').count()).toBeLessThan(expectedCanonicalAddresses.length)
  const calendar = palette.getByRole('option').first()
  await expect(calendar).toHaveAccessibleName('Pattern · Calendar · Range Basic')
  await calendar.press('Enter')
  await expect(page).toHaveURL(/\?preview=pattern%2Fcalendar%2Frange-basic%23default$/u)
  await expect(palette).toBeHidden()
  await loadPreview(page, 'pattern/calendar/range-basic')
  expect(previewRequests.some((url) => url.includes('/calendar/range-basic.preview.tsx'))).toBe(
    true,
  )

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(input).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.goto('/?family=component%2Finput')
  const inputPreview = await loadPreview(page, 'component/input')
  const domainPath = inputPreview.getByRole('textbox', { name: 'Domain path' })
  await domainPath.fill('/:edited.astrale.ai')
  await domainPath.evaluate((element) => {
    const preventCommand = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent
      if (
        keyboardEvent.key.toLowerCase() === 'k' &&
        (keyboardEvent.metaKey || keyboardEvent.ctrlKey)
      ) {
        event.preventDefault()
        element.removeEventListener('keydown', preventCommand)
      }
    }
    element.addEventListener('keydown', preventCommand)
  })
  await domainPath.press('Control+k')
  await expect(palette).toBeHidden()
  await expect(domainPath).toBeFocused()
  await page.keyboard.press('Control+k')
  await expect(palette).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  await expect(domainPath).toBeFocused()
  await expect(domainPath).toHaveValue('/:edited.astrale.ai')

  await page.getByRole('button', { name: 'Customize theme' }).click()
  await expect(page.getByLabel('Theme generator')).toBeVisible()
  await page.keyboard.press('Control+k')
  await expect(palette).toBeHidden()
})

test('a command palette chunk failure leaves the catalog usable', async ({ page }) => {
  await page.route(
    /\/(?:assets\/controlled-[^/]+\.js|@fs\/.*\/registry\/patterns\/command-palette\/controlled\.tsx)(?:\?.*)?$/u,
    (route) => route.abort(),
  )
  await page.goto('/')
  await page.getByRole('button', { name: /Search components/u }).click()
  await expect(page.getByText('Search unavailable', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload catalog' })).toBeVisible()
  const patternsTab = page.getByLabel('Catalog sections').getByRole('tab', { name: 'Patterns' })
  await patternsTab.click()
  await expect(patternsTab).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/\?kind=pattern$/u)
  await expect(page.locator('[data-preview-address^="pattern/"]').first()).toBeVisible()
})

test('return anchor survives a delayed lazy block resolving above it', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'The delayed geometry contract is viewport-neutral.',
  )
  let releaseSignUp: (() => void) | undefined
  const signUpRelease = new Promise<void>((resolve) => {
    releaseSignUp = resolve
  })
  await page.route(/\/sign-up-card\.preview\.tsx(?:\?|$)/u, async (route) => {
    await signUpRelease
    await route.continue()
  })
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const delayed = page.locator('[data-preview-address="block/authentication/sign-up-card"]')
  await expect(delayed).toHaveAttribute('data-preview-status', 'loading')
  const loadingHeight = await delayed.evaluate((element) => element.getBoundingClientRect().height)

  const dashboard = page.locator('#catalog-group-block-dashboard')
  await dashboard.scrollIntoViewIfNeeded()
  const viewDashboard = dashboard.getByRole('button', { name: 'View family' })
  await viewDashboard.scrollIntoViewIfNeeded()
  await viewDashboard.focus()
  const expectedTop = await dashboard.evaluate((element) => element.getBoundingClientRect().top)
  await viewDashboard.press('Enter')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect
    .poll(() => dashboard.evaluate((element) => element.getBoundingClientRect().top))
    .toBeCloseTo(expectedTop, 0)

  await page.waitForTimeout(350)
  releaseSignUp?.()
  await expect(delayed).toHaveAttribute('data-preview-status', 'ready')
  const readyHeight = await delayed.evaluate((element) => element.getBoundingClientRect().height)
  expect(readyHeight).toBeGreaterThan(loadingHeight + 64)
  await expect
    .poll(() => dashboard.evaluate((element) => element.getBoundingClientRect().top))
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

  await page.goto('/?family=block%2Fauthentication')
  const signIn = await loadPreview(page, 'block/authentication/sign-in-card')
  const email = signIn.getByRole('textbox', { name: 'Email' })
  await email.fill('owner@astrale.ai')
  await expect(email).toHaveValue('owner@astrale.ai')
  await interactWithoutNavigation(() =>
    signIn.getByRole('button', { name: 'Sign in', exact: true }).click(),
  )
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
  await page.route(/\/operations\.preview\.tsx(?:\?|$)/u, async (route) => {
    await holdModule
    await route.continue()
  })
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const preview = page.locator('[data-preview-address="block/dashboard/operations"]')
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

test('status heatmap incident-recovery scene tells the 30-day operational story', async ({
  page,
}) => {
  await page.goto('/?family=component%2Fstatus-heatmap')
  const preview = await loadPreview(page, 'component/status-heatmap', 'incident-recovery')

  const heatmap = preview.getByRole('img', { name: 'API status heatmap, last 30 days' })
  await expect(heatmap).toBeVisible()
  await expect(preview.locator('[data-slot="status-heatmap-block"]')).toHaveCount(30)

  const values = await preview
    .locator('[data-slot="status-heatmap-block"]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-value')))
  expect(values.slice(6, 10)).toEqual(['2', '1', '1', '2'])
  expect(values.slice(16, 20)).toEqual(['2', '2', '1', '1'])
  expect(values.slice(10, 16)).toEqual(Array.from({ length: 6 }, () => '3'))
  expect(values.slice(20)).toEqual(Array.from({ length: 10 }, () => '3'))

  await expect(preview.getByLabel('2026-08-08: Critical')).toHaveCount(1)
  await expect(preview.getByLabel('2026-08-19: Critical')).toHaveCount(1)
  await expect(preview.getByLabel('2026-08-20: Critical')).toHaveCount(1)
  await expect(preview.getByLabel('2026-08-21: Healthy')).toHaveCount(1)
  await expect(preview.getByLabel('2026-08-30: Healthy')).toHaveCount(1)
  await expect(preview.locator('[data-slot="status-heatmap-stat"]')).toHaveText('22 days healthy')
  await expect(preview.getByLabel('API status legend')).toBeVisible()

  const canonical = await loadPreview(page, 'component/status-heatmap')
  await expect(canonical.getByRole('img', { name: 'Status heatmap' })).toBeVisible()
  await expect(canonical.locator('[data-slot="status-heatmap-block"]')).toHaveCount(90)
})

test('status monitor presents responsive availability and incident details', async ({ page }) => {
  await page.goto('/')
  const sections = page.getByLabel('Catalog sections')
  await sections.getByRole('tab', { name: 'Blocks' }).click()
  await expect(sections.getByRole('tab', { name: 'Blocks' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const preview = await loadPreview(page, 'block/observability/status-monitor')

  await expect(preview.getByText('API availability')).toBeVisible()
  const initialSlots = page.viewportSize()!.width < 640 ? 30 : 90
  const initialUptime = initialSlots === 90 ? '93.33% uptime' : '90% uptime'
  await expect(preview.getByText(initialUptime)).toBeVisible()
  await expect(preview.locator('button[aria-label]')).toHaveCount(initialSlots)

  const incident = preview.getByLabel('Jul 03, 2026: Error')
  if (page.viewportSize()!.width >= 640) {
    await preview.getByLabel('Jul 02, 2026: Normal').focus()
    await page.keyboard.press('Tab')
    await expect(incident).toBeFocused()
    await expect(
      page.getByText('API requests failed while traffic shifted to the recovery pool.'),
    ).toBeVisible()
    const tooltip = page.locator('[data-slot="tooltip-content"]')
    await expect(tooltip).toContainText(
      'API requests failed while traffic shifted to the recovery pool.',
    )
    await page.keyboard.press('Escape')
    await expect(tooltip).not.toBeVisible()
  } else {
    await incident.tap()
    await expect(
      page.getByText('API requests failed while traffic shifted to the recovery pool.'),
    ).toBeVisible()
    await incident.tap()
    await expect(
      page.getByText('API requests failed while traffic shifted to the recovery pool.'),
    ).not.toBeVisible()
  }

  const contrast = await new AxeBuilder({ page })
    .include('[data-preview-address="block/observability/status-monitor"]')
    .analyze()
  expect(contrast.violations).toEqual([])

  await page.setViewportSize({ width: 560, height: 844 })
  await expect(preview.locator('button[aria-label]')).toHaveCount(60)
  await expect(preview.getByText('91.67% uptime')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(preview.locator('button[aria-label]')).toHaveCount(30)
  await expect(preview.getByText('90% uptime')).toBeVisible()
})

test('log viewer filters the stream, then pauses and resumes the live tail', async ({ page }) => {
  await page.goto('/?family=block%2Fobservability')
  const preview = await loadPreview(page, 'block/observability/log-viewer')

  await expect(preview.getByText('GET /v1/deployments completed in 42ms')).toBeVisible()
  await expect(preview.getByText('8 entries', { exact: true })).toBeVisible()

  await preview.getByRole('button', { name: 'ERROR', exact: true }).click()
  await preview
    .getByRole('button', { name: /ERROR Auth Token exchange rejected for tenant acme-eu/u })
    .click()
  await expect(preview.getByText('Token exchange rejected for tenant acme-eu').last()).toBeVisible()
  await expect(preview.getByText('GET /v1/deployments completed in 42ms')).toHaveCount(0)
  await preview.getByRole('button', { name: 'Clear filters' }).click()

  const search = preview.getByPlaceholder('Search logs...')
  await search.fill('routing table')
  await expect(preview.getByText('Routing table reloaded with 12 upstreams')).toBeVisible()
  await expect(preview.getByText('Token exchange rejected for tenant acme-eu')).toHaveCount(0)
  await preview.getByRole('button', { name: 'Clear search' }).click()
  await expect(preview.getByText('Token exchange rejected for tenant acme-eu').last()).toBeVisible()

  const rows = preview.locator('button[aria-expanded]')
  await expect(rows).toHaveCount(8)
  await preview.getByRole('button', { name: 'Live Tail' }).click()
  await expect(preview.getByText('Live tail entry 1')).toBeVisible({ timeout: 15_000 })

  await preview.getByRole('button', { name: 'Tailing' }).click()
  const paused = await rows.count()
  await page.waitForTimeout(6_000)
  expect(await rows.count()).toBe(paused)
  await expect(preview.getByRole('button', { name: 'Live Tail', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('log viewer follows new entries without stealing focus', async ({ page }) => {
  await page.goto('/?family=block%2Fobservability')
  const preview = await loadPreview(page, 'block/observability/log-viewer')

  const follow = preview.getByRole('button', { name: 'Toggle follow logs' })
  await expect(follow).toHaveAttribute('aria-pressed', 'true')
  await follow.click()
  await expect(follow).toHaveAttribute('aria-pressed', 'false')
  await follow.press(' ')
  await expect(follow).toHaveAttribute('aria-pressed', 'true')
  await expect(follow).toBeFocused()

  const search = preview.getByPlaceholder('Search logs...')
  await preview.getByRole('button', { name: 'Live Tail' }).click()
  await search.focus()
  await expect(preview.getByText('Live tail entry 1')).toBeVisible({ timeout: 15_000 })
  await expect(search).toBeFocused()
  await preview.getByRole('button', { name: 'Tailing' }).click()
})

test('log viewer copies the visible filtered logs to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/?family=block%2Fobservability')
  const preview = await loadPreview(page, 'block/observability/log-viewer')
  const status = preview.locator('p[role="status"]')

  await preview.getByRole('button', { name: 'ERROR', exact: true }).click()
  await preview.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(status).toHaveText('Copied 1 log entries to the clipboard.')
  await expect(status).not.toContainText('Token exchange rejected')

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('Token exchange rejected for tenant acme-eu')
  expect(copied).not.toContain('GET /v1/deployments completed in 42ms')
})

test('log viewer rejected-actions scene reports failures without log text', async ({ page }) => {
  await page.goto('/?family=block%2Fobservability')
  const preview = await loadPreview(page, 'block/observability/log-viewer', 'rejected-actions')
  const status = preview.locator('p[role="status"]')

  await preview.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(status).toHaveText('Could not copy the visible logs.')
  await preview.getByRole('button', { name: 'Export filtered logs' }).click()
  await expect(status).toHaveText('Could not export the visible logs.')

  await preview.getByRole('button', { name: 'Live Tail' }).click()
  await expect(status).toHaveText('Could not append the next log entry.', { timeout: 15_000 })
  await expect(status).not.toContainText('Token exchange rejected')
  await preview.getByRole('button', { name: 'Tailing' }).click()

  const canonical = await loadPreview(page, 'block/observability/log-viewer')
  await canonical.getByRole('button', { name: 'Export filtered logs' }).click()
  await expect(canonical.locator('p[role="status"]')).toHaveText('Exported 8 log entries.')
})

test('log viewer loading, stream error, and empty states are independently observable', async ({
  page,
}) => {
  await page.goto('/?family=block%2Fobservability')

  const loading = await loadPreview(page, 'block/observability/log-viewer', 'loading')
  await expect(loading.getByText('Generating log data…')).toBeVisible()
  await expect(loading.getByRole('button', { name: 'Copy', exact: true })).toHaveCount(0)

  const disconnected = await loadPreview(page, 'block/observability/log-viewer', 'stream-error')
  await expect(
    disconnected.getByText('Stream error: disconnected from the log gateway'),
  ).toBeVisible()
  await expect(disconnected.getByText('GET /v1/deployments completed in 42ms')).toBeVisible()

  const empty = await loadPreview(page, 'block/observability/log-viewer', 'empty')
  await expect(empty.getByText('No log entries match your filters')).toBeVisible()
  await expect(empty.getByText('0 entries')).toBeVisible()
  await expect(empty.getByRole('button', { name: 'Toggle follow logs' })).toBeDisabled()

  const connected = await loadPreview(page, 'block/observability/log-viewer')
  await expect(connected.getByText('Stream error: disconnected from the log gateway')).toHaveCount(
    0,
  )
  await expect(connected.getByText('No log entries match your filters')).toHaveCount(0)
})

test('log viewer names every icon control and passes an accessibility audit', async ({ page }) => {
  await page.goto('/?family=block%2Fobservability')
  const preview = await loadPreview(page, 'block/observability/log-viewer')

  for (const name of ['Live Tail', 'Copy', 'Export filtered logs', 'Toggle follow logs']) {
    await expect(preview.getByRole('button', { name, exact: true })).toBeVisible()
  }
  await expect(preview.getByLabel('Service')).toBeVisible()
  await expect(preview.getByLabel('Time')).toBeVisible()
  await preview.getByPlaceholder('Search logs...').fill('gateway')
  await expect(preview.getByRole('button', { name: 'Clear search' })).toBeVisible()

  // The MIT source owns its dark palette, so contrast is upstream authority rather than an
  // Astrale decision; every other accessibility rule stays enforced.
  const audit = await new AxeBuilder({ page })
    .include(
      '[data-preview-address="block/observability/log-viewer"][data-preview-scene="default"]',
    )
    .disableRules(['color-contrast'])
    .analyze()
  expect(audit.violations).toEqual([])
})

test('log viewer keeps toolbar and log content reachable at a mobile width', async ({ page }) => {
  await page.goto('/?family=block%2Fobservability')
  const preview = await loadPreview(page, 'block/observability/log-viewer')
  await page.setViewportSize({ width: 390, height: 844 })

  const bounds = (await preview.boundingBox())!
  for (const name of [
    'Live Tail',
    'Copy',
    'Export filtered logs',
    'Toggle follow logs',
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
    'FATAL',
  ]) {
    const control = preview.getByRole('button', { name, exact: true }).first()
    await expect(control).toBeVisible()
    const box = (await control.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
  }
  await expect(preview.getByPlaceholder('Search logs...')).toBeVisible()
  await expect(preview.getByLabel('Service')).toBeVisible()
  await expect(preview.getByLabel('Time')).toBeVisible()
  await expect(preview.getByText('GET /v1/deployments completed in 42ms')).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('environment variables mask stored secrets until an explicit reveal', async ({ page }) => {
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const preview = await loadPreview(page, 'block/secrets/env-variables')

  await expect(preview.getByRole('heading', { name: /Environment Variables/u })).toBeVisible()
  const values = preview.locator('input[readonly]')
  await expect(values.first()).toHaveValue('••••••••••••••••')
  const reveals = preview.locator('input[readonly] + button')

  await reveals.first().click()
  await expect(values.first()).toHaveValue('postgresql://user:pass@db.example.com:5432/mydb')
  await expect(values.nth(1)).toHaveValue('••••••••••••••••')
  await reveals.first().click()
  await expect(values.first()).toHaveValue('••••••••••••••••')

  const filter = preview.getByPlaceholder('Filter variables...')
  await filter.fill('stripe')
  await expect(preview.getByText('STRIPE_SECRET_KEY', { exact: true })).toBeVisible()
  await expect(preview.getByText('DATABASE_URL', { exact: true })).toHaveCount(0)
  await filter.fill('no-such-variable')
  await expect(preview.getByText('No variables found.')).toBeVisible()
  await filter.fill('')
  await expect(preview.getByText('DATABASE_URL', { exact: true })).toBeVisible()

  await preview.getByRole('tab', { name: 'Development' }).click()
  await expect(preview.getByText('REDIS_URL', { exact: true })).toBeVisible()
  await expect(preview.getByText('DATABASE_POOL_SIZE', { exact: true })).toHaveCount(0)

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await expect(preview.getByRole('heading', { name: /Environment Variables/u })).toBeVisible()
    await expect(values.first()).toHaveValue('••••••••••••••••')
  }
})

test('environment variables keep every control reachable at a mobile width', async ({ page }) => {
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const preview = await loadPreview(page, 'block/secrets/env-variables')
  await page.setViewportSize({ width: 390, height: 844 })

  const bounds = (await preview.boundingBox())!
  for (const name of [
    'Import .env',
    'Export .env',
    'Add Variable',
    'Reveal value of DATABASE_URL',
    'Actions for DATABASE_URL',
  ]) {
    const control = preview.getByRole('button', { name, exact: true }).first()
    await expect(control).toBeVisible()
    const box = (await control.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
  }
  await expect(preview.getByLabel('Filter by group')).toBeVisible()
  await expect(
    preview.getByRole('textbox', { name: 'Value of DATABASE_URL', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})

test('environment variables add, update, copy, and delete through host actions', async ({
  page,
}) => {
  await page.goto('/')
  await selectCatalogKind(page, 'Blocks')
  const preview = await loadPreview(page, 'block/secrets/env-variables')
  const status = preview.locator('p[role="status"]')

  await preview.getByRole('button', { name: 'Add Variable' }).click()
  await preview.getByLabel('Key', { exact: true }).fill('CAMPAIGN_TOKEN')
  await preview.getByLabel('Value', { exact: true }).fill('campaign-secret')
  await preview.getByRole('checkbox', { name: 'production' }).click()
  await preview.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(status).toHaveText('Added CAMPAIGN_TOKEN.')
  await expect(status).not.toContainText('campaign-secret')
  await expect(
    preview.getByRole('textbox', { name: 'Value of CAMPAIGN_TOKEN', exact: true }),
  ).toHaveValue('••••••••••••••••')

  await preview.getByRole('button', { name: 'Actions for CAMPAIGN_TOKEN' }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await expect(preview.getByRole('heading', { name: 'Edit Variable' })).toBeVisible()
  await preview.getByLabel('Value', { exact: true }).fill('rotated-secret')
  await preview.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(status).toHaveText('Updated CAMPAIGN_TOKEN.')
  await expect(status).not.toContainText('rotated-secret')

  await preview.getByRole('button', { name: 'Actions for CAMPAIGN_TOKEN' }).click()
  await page.getByRole('menuitem', { name: 'Copy Value' }).click()
  await expect(status).toHaveText('Copied the value of CAMPAIGN_TOKEN to the clipboard.')
  await expect(status).not.toContainText('rotated-secret')

  await preview.getByRole('button', { name: 'Actions for CAMPAIGN_TOKEN' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation).toContainText('CAMPAIGN_TOKEN')
  await expect(confirmation).not.toContainText('rotated-secret')
  await confirmation.getByRole('button', { name: 'Cancel' }).click()
  await expect(
    preview.getByRole('textbox', { name: 'Value of CAMPAIGN_TOKEN', exact: true }),
  ).toHaveCount(1)

  await preview.getByRole('button', { name: 'Actions for CAMPAIGN_TOKEN' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(status).toHaveText('Deleted CAMPAIGN_TOKEN.')
  await expect(
    preview.getByRole('textbox', { name: 'Value of CAMPAIGN_TOKEN', exact: true }),
  ).toHaveCount(0)
})

test('environment variables rejected-actions scene reports failures without leaking a value', async ({
  page,
}) => {
  await page.goto('/?family=block%2Fsecrets')
  const preview = await loadPreview(page, 'block/secrets/env-variables', 'rejected-actions')
  const status = preview.locator('p[role="status"]')

  await preview.getByRole('button', { name: 'Actions for DATABASE_URL' }).click()
  await page.getByRole('menuitem', { name: 'Copy Value' }).click()
  await expect(status).toHaveText('Could not copy the value of DATABASE_URL.')
  await expect(status).not.toContainText('postgresql://')

  await preview.getByRole('button', { name: 'Actions for DATABASE_URL' }).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation).not.toContainText('postgresql://')
  await confirmation.getByRole('button', { name: 'Delete' }).click()
  await expect(status).toHaveText('Could not delete DATABASE_URL.')
  await expect(
    preview.getByRole('textbox', { name: 'Value of DATABASE_URL', exact: true }),
  ).toHaveCount(1)

  await preview.getByRole('button', { name: 'Add Variable' }).click()
  await preview.getByLabel('Key', { exact: true }).fill('CAMPAIGN_TOKEN')
  await preview.getByLabel('Value', { exact: true }).fill('campaign-secret')
  await preview.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(status).toHaveText('Could not add the variable.')
  await expect(status).not.toContainText('campaign-secret')
  await expect(
    preview.getByRole('textbox', { name: 'Value of CAMPAIGN_TOKEN', exact: true }),
  ).toHaveCount(0)

  const canonical = await loadPreview(page, 'block/secrets/env-variables')
  await canonical.getByRole('button', { name: 'Actions for DATABASE_URL' }).click()
  await page.getByRole('menuitem', { name: 'Copy Value' }).click()
  await expect(canonical.locator('p[role="status"]')).toHaveText(
    'Copied the value of DATABASE_URL to the clipboard.',
  )
})

test('environment variable type badges keep token contrast and visible labels', async ({
  page,
}) => {
  await page.goto('/?family=block%2Fsecrets')
  const preview = await loadPreview(page, 'block/secrets/env-variables')

  for (const label of ['URL', 'Secret', 'Bool', 'Num', 'Str']) {
    await expect(preview.getByText(label, { exact: true }).first()).toBeVisible()
  }

  const contrast = await new AxeBuilder({ page })
    .include('[data-preview-address="block/secrets/env-variables"][data-preview-scene="default"]')
    .withRules(['color-contrast'])
    .analyze()
  expect(contrast.violations).toEqual([])
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
    const animation = element.getAnimations()[0]
    const before = typeof animation?.currentTime === 'number' ? animation.currentTime : null
    await new Promise((resolve) => setTimeout(resolve, 120))
    const styles = getComputedStyle(element)
    return {
      before,
      after: typeof animation?.currentTime === 'number' ? animation.currentTime : null,
      duration: styles.animationDuration,
      name: styles.animationName,
      playState: styles.animationPlayState,
    }
  })
  expect(spinnerMotion).toMatchObject({ duration: '1s', name: 'spin', playState: 'running' })
  expect(spinnerMotion.before).not.toBeNull()
  expect(spinnerMotion.after ?? Number.NEGATIVE_INFINITY).toBeGreaterThan(
    spinnerMotion.before ?? Number.POSITIVE_INFINITY,
  )

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

test('typography sliders preview during one gesture and commit one history entry', async ({
  page,
}) => {
  await page.goto('/')
  await openThemeCustomizer(page)
  const studio = page.getByLabel('Theme generator')
  const root = page.locator('[data-slot="ui-playground"]')
  await page.getByRole('tab', { name: 'Typography' }).click()
  const slider = page.getByRole('slider', { name: 'Body letter spacing' })
  const cssValue = () =>
    root.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--ui-tracking-body').trim(),
    )
  await expect(slider).toHaveAttribute('aria-valuetext', '0')
  await expect(studio.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await slider.scrollIntoViewIfNeeded()

  const sliderField = page.locator('[data-slot="theme-range-field"]').filter({ has: slider })
  const sliderControl = sliderField.locator('[data-base-ui-slider-control]')
  const trackBox = await sliderControl.boundingBox()
  expect(trackBox).not.toBeNull()
  await page.mouse.move(trackBox!.x + trackBox!.width / 2, trackBox!.y + trackBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(trackBox!.x + trackBox!.width * 0.8, trackBox!.y + trackBox!.height / 2, {
    steps: 8,
  })
  await expect(slider).not.toHaveAttribute('aria-valuetext', '0')
  await expect.poll(cssValue).not.toBe('0')
  await expect(studio.getByRole('button', { name: 'Undo' })).toBeDisabled()
  const previewed = await cssValue()
  await page.mouse.up()

  await expect(studio.getByRole('button', { name: 'Undo' })).toBeEnabled()
  await studio.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(cssValue).toBe('0')
  await expect(studio.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await studio.getByRole('button', { name: 'Redo' }).click()
  await expect.poll(cssValue).toBe(previewed)

  const committed = await cssValue()
  await slider.scrollIntoViewIfNeeded()
  const nextTrackBox = await sliderControl.boundingBox()
  expect(nextTrackBox).not.toBeNull()
  await page.mouse.move(
    nextTrackBox!.x + nextTrackBox!.width * 0.8,
    nextTrackBox!.y + nextTrackBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    nextTrackBox!.x + nextTrackBox!.width * 0.2,
    nextTrackBox!.y + nextTrackBox!.height / 2,
  )
  await expect.poll(cssValue).not.toBe(committed)
  await sliderControl.dispatchEvent('pointercancel')
  await page.mouse.up()
  await expect.poll(cssValue).toBe(committed)
})

test('theme editing, mode, history, saving, import, and export remain live', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(90_000)
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await openThemeCustomizer(page)
  const studio = page.getByLabel('Theme generator')
  const root = page.locator('[data-slot="ui-playground"]')
  const primaryValue = () =>
    root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-primary').trim())
  const ringValue = () =>
    root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-ring').trim())
  const menuRingValue = () =>
    root.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--ui-sidebar-ring').trim(),
    )
  await expect.poll(primaryValue).toBe('oklch(0.36 0.14 251)')
  await expect.poll(ringValue).toBe('oklch(0.705 0.015 286.067)')

  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(root).toHaveClass(/dark/u)
  await expect.poll(primaryValue).toBe('oklch(0.76 0.13 250)')
  await expect.poll(ringValue).toBe('oklch(0.552 0.016 285.938)')
  await expect(root).toHaveAttribute('data-ui-theme', 'observatory')
  const paletteDarkPrimary = page
    .getByRole('combobox', { name: 'Theme' })
    .locator('[data-slot="theme-palette-icon"] > span')
    .nth(3)
  await expect
    .poll(() =>
      page
        .getByRole('combobox', { name: 'Theme' })
        .locator('[data-slot="theme-palette-icon"] > span')
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).backgroundColor),
        ),
    )
    .toEqual([
      'oklch(0.985 0.006 82)',
      'oklch(0.36 0.14 251)',
      'oklch(0.15 0.02 255)',
      'oklch(0.76 0.13 250)',
    ])
  await page.getByRole('tab', { name: 'Colors' }).click()
  const primaryToken = page.getByLabel('Primary', { exact: true })
  await page.getByRole('button', { name: /Pick Primary$/u }).click()
  const colorArea = page.locator('.aspect-square:visible')
  await expect(colorArea).toHaveCount(1)
  const colorAreaBox = await colorArea.boundingBox()
  expect(colorAreaBox).not.toBeNull()
  await page.mouse.move(colorAreaBox!.x + colorAreaBox!.width * 0.25, colorAreaBox!.y + 24)
  await page.mouse.down()
  await page.mouse.move(
    colorAreaBox!.x + colorAreaBox!.width * 0.75,
    colorAreaBox!.y + colorAreaBox!.height * 0.65,
    { steps: 12 },
  )
  await expect.poll(primaryValue).not.toBe('oklch(0.76 0.13 250)')
  await expect(studio.getByRole('button', { name: 'Undo' })).toBeDisabled()
  await page.mouse.up()
  await expect(primaryToken).toHaveValue(/^#/u)
  await expect.poll(primaryValue).not.toBe('oklch(0.76 0.13 250)')
  await page.keyboard.press('Escape')
  await studio.getByRole('button', { name: 'Undo' }).click()
  await expect(primaryToken).toHaveValue('oklch(0.76 0.13 250)')
  await primaryToken.fill('oklch(0.62 0.2 145)')
  await primaryToken.blur()
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await page.keyboard.press('Escape')
  const customizerTrigger = page.getByRole('button', { name: 'Customize theme' })
  await expect(customizerTrigger).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Theme generator')).toBeVisible()
  await expect(page.getByLabel('Primary', { exact: true })).toHaveValue('oklch(0.62 0.2 145)')
  await expect(studio.getByRole('button', { name: 'Undo' })).toBeEnabled()
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect
    .poll(() => paletteDarkPrimary.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('oklch(0.62 0.2 145)')

  await studio.getByRole('button', { name: 'Undo' }).click()
  await expect(primaryToken).toHaveValue('oklch(0.76 0.13 250)')
  await expect.poll(primaryValue).toBe('oklch(0.76 0.13 250)')
  await studio.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByLabel('Primary', { exact: true })).toHaveValue('oklch(0.62 0.2 145)')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')

  await page.getByRole('button', { name: 'Base colors' }).click()
  const focusRingToken = page.getByLabel('Focus ring', { exact: true })
  await focusRingToken.fill('oklch(0.705 0.015 286.067)')
  await focusRingToken.blur()
  await expect.poll(ringValue).toBe('oklch(0.705 0.015 286.067)')
  await page.getByRole('button', { name: 'Menu colors' }).click()
  const menuFocusRingToken = page.getByLabel('Menu focus ring', { exact: true })
  await menuFocusRingToken.fill('oklch(0.552 0.016 285.938)')
  await menuFocusRingToken.blur()
  await expect.poll(menuRingValue).toBe('oklch(0.552 0.016 285.938)')

  await page.getByRole('tab', { name: 'Typography' }).click()
  await expect(page.locator('.theme-typography-section h3')).toHaveText([
    'Heading',
    'Body',
    'Terminal',
  ])
  await expect(page.getByLabel('Body font', { exact: true })).toContainText('Avenir Next · Sans')
  await expect(page.getByLabel('Heading font', { exact: true })).toContainText(
    'Iowan Old Style · Serif',
  )
  const terminalSection = page.locator('.theme-typography-section').filter({
    has: page.getByRole('heading', { name: 'Terminal', exact: true }),
  })
  await expect(terminalSection.getByRole('combobox')).toHaveCount(1)
  await expect(terminalSection.getByRole('slider')).toHaveCount(0)
  await selectFieldOption(page, 'Body font', 'System UI · Sans')
  await expect
    .poll(() =>
      root.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ui-font-body').trim(),
      ),
    )
    .toContain('system-ui')
  await selectFieldOption(page, 'Heading font', 'Charter · Serif')
  await selectFieldOption(page, 'Body weight', '500')
  await selectFieldOption(page, 'Heading weight', '700')
  const bodyTracking = page.getByRole('slider', { name: 'Body letter spacing' })
  const bodyLeading = page.getByRole('slider', { name: 'Body line height' })
  const headingTracking = page.getByRole('slider', { name: 'Heading letter spacing' })
  const headingLeading = page.getByRole('slider', { name: 'Heading line height' })
  await expect(bodyTracking).toHaveAttribute('aria-valuetext', '0')
  await expect(bodyLeading).toHaveAttribute('aria-valuetext', '1.5')
  await expect(headingTracking).toHaveAttribute('aria-valuetext', '-0.01em')
  await expect(headingLeading).toHaveAttribute('aria-valuetext', '1.2')
  await bodyTracking.press('ArrowRight')
  await bodyLeading.press('ArrowRight')
  await headingTracking.press('ArrowLeft')
  await headingLeading.press('ArrowRight')
  await expect(bodyTracking).toHaveAttribute('aria-valuetext', '0.005em')
  await expect(bodyLeading).toHaveAttribute('aria-valuetext', '1.55')
  await expect(headingTracking).toHaveAttribute('aria-valuetext', '-0.015em')
  await expect(headingLeading).toHaveAttribute('aria-valuetext', '1.25')
  await selectFieldOption(page, 'Terminal font', 'SFMono Regular · Mono')
  await expect
    .poll(() =>
      root.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ui-tracking-body').trim(),
      ),
    )
    .toBe('0.005em')
  const typographySpecimen = page.locator('[data-slot="theme-studio"]')
  const bodySpecimen = typographySpecimen.locator('[data-slot="theme-typography-body"]')
  const headingSpecimen = typographySpecimen.locator('[data-slot="card-title"]')
  const monoSpecimen = typographySpecimen.locator('[data-slot="theme-typography-mono"]')
  await expect
    .poll(() =>
      bodySpecimen.evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.fontFamily, style.fontWeight, style.letterSpacing, style.lineHeight]
      }),
    )
    .toEqual([expect.stringContaining('system-ui'), '500', '0.0624px', '19.344px'])
  await expect
    .poll(() =>
      headingSpecimen.evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.fontFamily, style.fontWeight, style.letterSpacing, style.lineHeight]
      }),
    )
    .toEqual([expect.stringContaining('Charter'), '700', '-0.24px', '20px'])
  await expect
    .poll(() => monoSpecimen.evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain('SFMono-Regular')

  await page.getByRole('tab', { name: 'Other' }).click()
  await page.getByRole('slider', { name: 'Corner radius' }).press('ArrowRight')
  await expect
    .poll(() =>
      root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-radius').trim()),
    )
    .toBe('0.75rem')

  const variation = studio.getByRole('button', { name: 'Variation' })
  await expect(variation).toBeDisabled()
  const typographyLock = studio.getByRole('button', { name: /^Typography /u })
  await typographyLock.click()
  await expect(typographyLock).toHaveAttribute('aria-pressed', 'true')
  await studio.getByRole('button', { name: 'New direction' }).click()
  await expect(variation).toBeEnabled()
  await expect(typographyLock).toContainText('Edited')
  await expect.poll(primaryValue).not.toBe('oklch(0.62 0.2 145)')
  const firstGeneratedPrimary = await primaryValue()
  const generatedButtonForeground = await page
    .getByRole('button', { name: 'Customize theme' })
    .evaluate((button) => {
      const root = button.closest('[data-slot="ui-playground"]')
      if (!root) throw new Error('Theme root is missing.')
      return {
        background: getComputedStyle(button).backgroundColor,
        backgroundToken: getComputedStyle(root).getPropertyValue('--ui-primary').trim(),
        rendered: getComputedStyle(button).color,
        token: getComputedStyle(root).getPropertyValue('--ui-primary-foreground').trim(),
      }
    })
  expect(generatedButtonForeground.token).toMatch(/^oklch\((?:0|1) 0 /u)
  expect(generatedButtonForeground.background).toBe(generatedButtonForeground.backgroundToken)
  expect(generatedButtonForeground.rendered).toBe(generatedButtonForeground.token)
  const generatedContrast = await new AxeBuilder({ page })
    .include('[data-slot="ui-playground"]')
    .withRules(['color-contrast'])
    .analyze()
  expect(generatedContrast.violations).toEqual([])
  await expect
    .poll(() =>
      root.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ui-font-body').trim(),
      ),
    )
    .toBe("system-ui, -apple-system, 'Segoe UI', sans-serif")

  await page.getByRole('tab', { name: 'Export' }).click()
  const generatedDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const generatedDocument = JSON.parse(await downloadText(await generatedDownloadPromise))
  expect(generatedDocument.generation).toMatchObject({
    kind: 'astrale.theme-generation',
    version: 1,
    engineVersion: 2,
    fontCatalogVersion: 1,
    locks: ['typography'],
    editedBranches: ['typography'],
    lineage: { kind: 'new-direction' },
  })
  expect(generatedDocument.generation.seed).toMatch(/^[0-9a-f]{32}$/u)
  expect(generatedDocument.generation.derivationSeeds).toEqual({
    palette: expect.stringMatching(/^[0-9a-f]{32}$/u),
    typography: expect.stringMatching(/^[0-9a-f]{32}$/u),
    geometry: expect.stringMatching(/^[0-9a-f]{32}$/u),
  })
  await variation.click()
  await expect.poll(primaryValue).not.toBe(firstGeneratedPrimary)
  await studio.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(primaryValue).toBe(firstGeneratedPrimary)
  await studio.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect(variation).toBeDisabled()

  await studio.getByRole('button', { name: 'Save theme' }).click()
  const savedToast = page.getByRole('dialog', { name: 'Observatory saved in this browser' })
  await expect(savedToast).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('astrale-ui-playground:themes:v2') ?? '[]')
        return {
          count: saved.length,
          name: saved[0]?.name,
          primary: saved[0]?.appearance?.dark?.primary,
          body: saved[0]?.typography?.body?.family,
          bodyWeight: saved[0]?.typography?.body?.weight,
          radius: saved[0]?.geometry?.radius,
        }
      }),
    )
    .toEqual({
      count: 1,
      name: 'observatory',
      primary: 'oklch(0.62 0.2 145)',
      body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      bodyWeight: 500,
      radius: '0.75rem',
    })

  await page.reload()
  await openThemeCustomizer(page)
  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'Observatory Saved' }).click()
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(root).toHaveAttribute('data-ui-theme', 'observatory')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect
    .poll(() =>
      root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-radius').trim()),
    )
    .toBe('0.75rem')

  await page.getByRole('tab', { name: 'Export' }).click()
  await expect(page.locator('[data-slot="theme-install-command"]')).toContainText(
    'astrale ui add ./observatory.css',
  )
  await page.getByRole('button', { name: 'Copy command' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('astrale ui add ./observatory.css')
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
  await page.mouse.move(1, 1)
  await expect(copyFailure.getByRole('button', { name: 'Close toast' })).toHaveCount(0)
  await expect(copyFailure).not.toBeVisible({ timeout: 10_000 })
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('observatory.astrale-theme.json')
  const exported = JSON.parse(await downloadText(download))
  expect(exported).toMatchObject({
    version: 5,
    name: 'observatory',
    appearance: { dark: { primary: 'oklch(0.62 0.2 145)' } },
    typography: {
      body: {
        family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        tracking: '0.005em',
        leading: '1.55',
        weight: 500,
      },
      heading: {
        family: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
        tracking: '-0.015em',
        leading: '1.25',
        weight: 700,
      },
      mono: expect.any(String),
    },
    geometry: { radius: '0.75rem' },
  })

  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'Observatory', exact: true }).click()
  await expect.poll(primaryValue).toBe('oklch(0.76 0.13 250)')
  const importInput = page.getByLabel('Import theme document')
  await importInput.setInputFiles({
    name: 'observatory.astrale-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  })
  const importedToast = page.getByRole('dialog', { name: 'Observatory imported' })
  await expect(importedToast).toBeVisible()
  await expect(importInput).toHaveValue('')
  await expect(root).toHaveAttribute('data-ui-theme', 'observatory')
  await expect.poll(primaryValue).toBe('oklch(0.62 0.2 145)')
  await expect
    .poll(() =>
      root.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ui-font-body').trim(),
      ),
    )
    .toContain('system-ui')
  await expect
    .poll(() =>
      root.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-radius').trim()),
    )
    .toBe('0.75rem')
  await page.mouse.move(0, 0)
  await expect(importedToast).toBeHidden({ timeout: 10_000 })

  const cssDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSS' }).click()
  const cssDownload = await cssDownloadPromise
  expect(cssDownload.suggestedFilename()).toBe('observatory.css')
  const css = await downloadText(cssDownload)
  expect(css).toContain('Consumer-owned after installation.')
  expect(css.match(/--ui-primary: oklch\(0\.62 0\.2 145\);/gu)).toHaveLength(1)
  expect(css).toContain("--ui-font-body: system-ui, -apple-system, 'Segoe UI', sans-serif;")
  expect(css).toContain('--ui-tracking-body: 0.005em;')
  expect(css).toContain('--ui-weight-body: 500;')
  expect(css).toContain('--ui-weight-heading: 700;')
  expect(css).toContain('--ui-radius: 0.75rem;')
  await expect(page.getByRole('button', { name: 'Close toast' })).toHaveCount(0)
  await testInfo.attach(`theme-studio-${testInfo.project.name}`, {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
  await page.waitForTimeout(100)
  expect(pageErrors).toEqual([])
})

test('generated provenance, locks, and edited branches survive save, reload, export, and import', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await openThemeCustomizer(page)
  const studio = page.getByLabel('Theme generator')
  await studio.getByRole('button', { name: /^Typography /u }).click()
  await studio.getByRole('button', { name: 'New direction' }).click()
  await expect(studio.getByRole('button', { name: 'Variation' })).toBeEnabled()

  const primary = page.getByLabel('Primary', { exact: true })
  await primary.fill('#123456')
  await primary.blur()
  await studio.getByRole('button', { name: 'Save theme' }).click()
  const storedGeneration = await page.evaluate(() => {
    const themes = JSON.parse(localStorage.getItem('astrale-ui-playground:themes:v2') ?? '[]')
    return themes[0]?.generation
  })
  expect(storedGeneration).toMatchObject({
    locks: ['typography'],
    editedBranches: ['palette', 'typography'],
    lineage: { kind: 'new-direction' },
  })

  await page.reload()
  await openThemeCustomizer(page)
  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'Observatory Saved' }).click()
  await expect(studio.getByRole('button', { name: 'Variation' })).toBeEnabled()
  await expect(studio.getByRole('button', { name: /^Typography /u })).toContainText(
    'Locked · Edited',
  )
  await expect(studio.getByRole('button', { name: /^Colors /u })).toContainText('Edited')

  await page.getByRole('tab', { name: 'Export' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const exported = await downloadText(await downloadPromise)
  expect(JSON.parse(exported).generation).toEqual(storedGeneration)

  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'Observatory', exact: true }).click()
  const rejected = JSON.parse(exported)
  rejected.generation.engineVersion = 1
  await page.getByLabel('Import theme document').setInputFiles({
    name: 'generated-engine-v1.astrale-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(rejected)),
  })
  const rejectedToast = page.getByRole('dialog', { name: 'Theme import rejected' })
  await expect(rejectedToast).toContainText('theme.generation.engineVersion is unsupported')
  await expect(page.getByLabel('Import theme document')).toHaveValue('')
  await expect(studio.getByRole('button', { name: 'Variation' })).toBeDisabled()
  await expect
    .poll(() =>
      page
        .locator('[data-slot="ui-playground"]')
        .evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-primary').trim()),
    )
    .toBe('oklch(0.36 0.14 251)')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const themes = JSON.parse(localStorage.getItem('astrale-ui-playground:themes:v2') ?? '[]')
        return themes[0]?.generation?.engineVersion
      }),
    )
    .toBe(2)
  await page.getByLabel('Import theme document').setInputFiles({
    name: 'generated.astrale-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported),
  })
  await expect(studio.getByRole('button', { name: 'Variation' })).toBeEnabled()
  await expect(studio.getByRole('button', { name: /^Typography /u })).toContainText(
    'Locked · Edited',
  )
  await expect(studio.getByRole('button', { name: /^Colors /u })).toContainText('Edited')
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
  await page.getByRole('tab', { name: 'Typography' }).click()
  await expect(page.locator('.theme-typography-section')).toHaveCount(3)
  await expect(page.getByRole('slider', { name: 'Body letter spacing' })).toBeVisible()
  await expect
    .poll(() =>
      page.getByLabel('Theme generator').evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
        columns: [...element.querySelectorAll('.theme-typography-controls')].map(
          (control) => getComputedStyle(control).gridTemplateColumns.split(' ').length,
        ),
      })),
    )
    .toEqual({ client: panelWidth, scroll: panelWidth, columns: [1, 1, 1] })
})

test('saved version 3 themes migrate to the complete typography model', async ({ page }) => {
  const legacy = structuredClone(starterThemeDocuments[0]!)
  legacy.version = 3
  legacy.name = 'legacy-observatory'
  legacy.label = 'Legacy Observatory'
  delete legacy.typography.body.weight
  await page.addInitScript((theme) => {
    localStorage.setItem('astrale-ui-playground:themes:v2', JSON.stringify([theme]))
  }, legacy)
  await page.goto('/')
  await openThemeCustomizer(page)
  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'Legacy Observatory Saved' }).click()
  await page.getByRole('tab', { name: 'Typography' }).click()
  await expect(page.getByLabel('Body weight', { exact: true })).toContainText('400')
  await page.getByRole('button', { name: 'Save theme' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('astrale-ui-playground:themes:v2') ?? '[]')
        return [saved[0]?.version, saved[0]?.typography?.body?.weight]
      }),
    )
    .toEqual([5, 400])
})

test('invalid storage and save failures stay contained', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem('astrale-ui-playground:themes:v2', '{not-valid-json'),
  )
  await page.reload()
  await expect(page.locator('[data-slot="ui-playground"]')).toBeVisible()
  await openThemeCustomizer(page)
  await page.getByRole('combobox', { name: 'Theme' }).click()
  await expect(page.getByRole('option')).toHaveCount(1)
  await page.keyboard.press('Escape')

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
  await page.getByRole('combobox', { name: 'Theme' }).click()
  await expect(page.getByRole('option')).toHaveCount(1)
  await page.keyboard.press('Escape')
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
  const inspector = page.getByRole('dialog', { name: 'Theme customizer' })
  await expect(customizerTrigger).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(inspector.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Theme generator')).not.toBeVisible()
  await expect(customizerTrigger).toBeFocused()

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

test('all starter modes have no serious structural violations and Astrale presets meet contrast', async ({
  page,
}) => {
  test.setTimeout(180_000)
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
    .evaluate((element) => {
      const animation = element.getAnimations()[0]
      const style = getComputedStyle(element)
      return {
        duration: style.animationDuration,
        iterations: style.animationIterationCount,
        keyframeTransforms:
          (animation?.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : [])
            .map((keyframe) => keyframe.transform)
            .filter((transform): transform is string => typeof transform === 'string') ?? [],
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
  expect(new Set(reducedSpinner.keyframeTransforms).size).toBeGreaterThan(1)
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition-delay: 0s !important; transition-duration: 0s !important; }',
  })
  await openThemeCustomizer(page)
  const starters: Record<string, { slug: string; light: string; dark: string }> =
    Object.fromEntries(
      starterThemeDocuments.map((theme) => [
        theme.label,
        {
          slug: theme.name,
          light: theme.appearance.light.primary,
          dark: theme.appearance.dark.primary,
        },
      ]),
    )
  const root = page.locator('[data-slot="ui-playground"]')
  for (const [starter, expected] of Object.entries(starters)) {
    await page.getByRole('combobox', { name: 'Theme' }).click()
    await page.getByRole('option', { name: starter, exact: true }).click()
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
      const serious = results.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      )
      expect(serious, `${starter} ${mode}`).toEqual([])
    }
  }
  expect(consoleProblems).toEqual([])
})

test('every canonical family is serious-violation-free across representative theme characters', async ({
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

  for (const starter of ['Observatory']) {
    for (const mode of ['Light', 'Dark']) {
      await openThemeCustomizer(page)
      await page.getByRole('combobox', { name: 'Theme' }).click()
      await page.getByRole('option', { name: starter, exact: true }).click()
      await page.getByRole('button', { name: mode, exact: true }).click()
      await page.getByRole('button', { name: 'Close', exact: true }).click()

      for (const kind of ['Components', 'Patterns', 'Blocks'] as const) {
        await selectCatalogKind(page, kind)
        const previews = page.locator('[data-preview-address]')
        const count = await previews.count()
        expect(count, kind).toBe(expectedAddressesByKind[kind].length)
        for (let index = 0; index < count; index += 1) {
          const preview = previews.nth(index)
          await preview.scrollIntoViewIfNeeded()
          await expect(preview).toHaveAttribute('data-preview-status', 'ready', {
            timeout: 15_000,
          })
          await expect(preview.getByText('Preview unavailable')).toHaveCount(0)
        }
        const results = await new AxeBuilder({ page })
          .exclude('[data-preview-address="block/observability/log-viewer"]')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
        expect(
          results.violations.filter((violation) =>
            ['critical', 'serious'].includes(violation.impact ?? ''),
          ),
          `${starter} ${mode} ${kind}`,
        ).toEqual([])
      }
    }
  }
  expect(pageErrors).toEqual([])
  expect(consoleProblems).toEqual([])
})
