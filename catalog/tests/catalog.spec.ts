import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('catalog exposes the full inventory and preset behavior without serious accessibility defects', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /one behavior system/i })).toBeVisible()
  await expect(page.locator('.inventory-grid li')).toHaveCount(49)

  const signatures = new Set<string>()
  for (const preset of ['astrale', 'compact', 'expressive']) {
    await page.getByLabel('Character').selectOption(preset)
    await expect(page.locator('.catalog-root')).toHaveAttribute('data-ui-preset', preset)
    for (const dark of [false, true]) {
      const mode = page.getByRole('switch', { name: 'Dark' })
      if ((await mode.isChecked()) !== dark) await mode.click()
      await expect(page.locator('.catalog-root')).toHaveClass(dark ? /dark/ : /catalog-root/)
      await page.waitForTimeout(10)
      signatures.add(
        await page.locator('.catalog-root').evaluate((root) => {
          const styles = getComputedStyle(root)
          return [
            styles.getPropertyValue('--ui-primary'),
            styles.getPropertyValue('--ui-radius'),
            styles.getPropertyValue('--ui-control-height'),
            styles.getPropertyValue('--ui-shadow-panel'),
          ].join('|')
        }),
      )
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(
        results.violations.filter((violation) =>
          ['critical', 'serious'].includes(violation.impact ?? ''),
        ),
        `${preset} ${dark ? 'dark' : 'light'}`,
      ).toEqual([])
    }
  }
  expect(signatures.size).toBe(6)
})

test('component keyboard journeys and responsive catalog navigation work', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Components' }).click()
  await page.getByRole('button', { name: 'Public contract' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Root and flat subpaths are both supported.')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Catalog navigation' })).toBeVisible()
})

test('chart color paints from the preset and remains host-overridable', async ({ page }) => {
  await page.goto('/')
  const chart = page.locator('[data-slot="pattern-chart-line-basic"]')
  const line = chart.locator('[data-slot="patterns-chart-line-basic-polyline"]')

  const presetStroke = await line.evaluate((element) => getComputedStyle(element).stroke)
  expect(presetStroke).not.toBe('')
  expect(presetStroke).not.toBe('none')
  expect(presetStroke).not.toBe('rgba(0, 0, 0, 0)')

  await chart.evaluate((element) => element.style.setProperty('--color-chart-1', 'rgb(1, 2, 3)'))
  await expect
    .poll(() => line.evaluate((element) => getComputedStyle(element).stroke))
    .toBe('rgb(1, 2, 3)')
  expect(await line.evaluate((element) => getComputedStyle(element).stroke)).not.toBe(presetStroke)
})
