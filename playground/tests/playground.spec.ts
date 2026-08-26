import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Download, type Page } from '@playwright/test'

import registry from '../../registry/registry.json' with { type: 'json' }
import { componentNames } from '../src/catalog/inventory.js'

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
  await expect(page.getByLabel('Theme generator')).toHaveCount(0)

  const rendered = await page.locator('[data-component]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-component'))
      .filter(Boolean)
      .sort(),
  )
  expect(rendered).toEqual([...componentNames].sort())
  expect(new Set(rendered).size).toBe(componentNames.length)
  const viewport = await page.evaluate(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth)
  await expect(page.getByText('@astrale-os/ui/toggle', { exact: true })).toHaveCount(0)
  await expect(page.getByText('component/calendar', { exact: true })).toHaveCount(0)
  const cardSpecimen = page.locator('[data-component="card"]')
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
    borderToken: getComputedStyle(element.closest('[data-slot="ui-playground"]')!)
      .getPropertyValue('--ui-border')
      .trim(),
  }))
  expect(cardWidths.card?.width).toBeGreaterThan(cardWidths.specimen * 0.8)
  expect(cardWidths.outer.bottom - cardWidths.card!.bottom).toBeGreaterThan(1)
  expect(cardWidths.contentOverflow).toBe('visible')
  expect(cardWidths.specimenOverflow).toBe('visible')
  expect(cardWidths.footerBorder).toBe(cardWidths.borderToken)
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

  await page.getByRole('tab', { name: 'Complete inventory' }).click()
  const registryItems = await page.locator('[data-registry-item]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-registry-item'))
      .filter(Boolean)
      .sort(),
  )
  expect(registryItems).toEqual(registry.items.map((item) => item.name).sort())
  expect(new Set(registryItems).size).toBe(registry.items.length)
  await expect(page.locator('[data-registry-item="theme-observatory"]')).toBeVisible()
})

test('catalog specimens own their interaction without navigating the playground', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')

  const domainPath = page.getByRole('textbox', { name: 'Domain path' })
  await domainPath.fill('/:journal.astrale.ai')
  await expect(domainPath).toHaveValue('/:journal.astrale.ai')
  const graphPath = page.getByRole('textbox', { name: 'Graph path' })
  await graphPath.fill('domains/journal')
  await expect(graphPath).toHaveValue('domains/journal')

  const select = page.locator('[data-component="select"]')
  const selectTrigger = select.getByRole('combobox', { name: 'Environment' })
  await selectTrigger.click()
  await expect(page.locator('[data-slot="select-content"]')).toHaveAttribute(
    'data-align-trigger',
    'true',
  )
  await page.getByRole('option', { name: 'Staging' }).click()
  await expect(select.getByRole('combobox', { name: 'Environment' })).toContainText('Staging')

  const slider = page.getByRole('slider', { name: 'Retention' })
  await expect(slider).toHaveAttribute('aria-valuenow', '62')
  await slider.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '63')

  const otp = page.getByRole('textbox', { name: 'Verification code' })
  await otp.fill('805214')
  await expect(otp).toHaveValue('805214')

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

  await page.getByRole('button', { name: 'Thursday, August 27th, 2026' }).click()
  await expect(
    page.getByRole('gridcell', { name: /Thursday, August 27th, 2026/u }),
  ).toHaveAttribute('aria-selected', 'true')

  const carousel = page.getByRole('region', { name: 'Component families' })
  const previous = carousel.getByRole('button', { name: 'Previous slide' })
  await expect(previous).toBeDisabled()
  await carousel.getByRole('button', { name: 'Next slide' }).click()
  await expect(previous).toBeEnabled()

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

  const dialogTrigger = page.getByRole('button', { name: 'Open dialog' })
  await dialogTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Edit Domain label' })).toBeHidden()

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
