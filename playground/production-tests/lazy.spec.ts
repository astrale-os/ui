import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<
  string,
  { file: string }
>
const operationsChunk = Object.entries(manifest).find(([source]) =>
  source.endsWith('/registry/blocks/dashboard/operations.preview.tsx'),
)?.[1].file
const buttonChunk = Object.entries(manifest).find(([source]) =>
  source.endsWith('/packages/ui/previews/button/button.preview.tsx'),
)?.[1].file
const generatorChunk = Object.entries(manifest).find(([source]) =>
  source.endsWith('/tooling/theme-generator/index.ts'),
)?.[1].file

test('theme generation loads only when a generation action requests it', async ({ page }) => {
  expect(generatorChunk).toBeTruthy()
  const requests: string[] = []
  page.on('request', (request) => requests.push(new URL(request.url()).pathname.slice(1)))
  await page.goto('/')
  await page.waitForTimeout(500)
  expect(requests).not.toContain(generatorChunk)

  await page.getByRole('button', { name: 'Customize theme' }).click()
  await expect(page.locator('[data-slot="theme-studio"]')).toBeVisible()
  expect(requests).not.toContain(generatorChunk)

  await page.getByRole('button', { name: 'New direction' }).click()
  await expect(page.getByRole('button', { name: 'Variation' })).toBeEnabled()
  expect(requests).toContain(generatorChunk)
})

test('production chunks stay isolated, load near the viewport once, and preserve scroll geometry', async ({
  browser,
  page,
}) => {
  test.setTimeout(60_000)
  expect(operationsChunk).toBeTruthy()
  expect(buttonChunk).toBeTruthy()
  const requests: string[] = []
  let releaseOperations: (() => void) | undefined
  let operationsWasRequested = false
  const operationsRelease = new Promise<void>((resolve) => {
    releaseOperations = resolve
  })
  await page.route('**/*', async (route) => {
    const requested = new URL(route.request().url()).pathname.slice(1)
    if (requested === operationsChunk) {
      operationsWasRequested = true
      await operationsRelease
    }
    await route.continue()
  })
  page.on('request', (request) => requests.push(new URL(request.url()).pathname.slice(1)))

  await page.goto('/')
  const catalogSections = page.getByLabel('Catalog sections')
  await catalogSections.getByRole('tab', { name: 'Blocks' }).click()
  await expect(catalogSections.getByRole('tab', { name: 'Blocks' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const distant = page.locator('[data-preview-address="block/dashboard/operations"]')
  await expect(distant).toHaveAttribute('data-preview-status', 'idle')
  expect(requests).not.toContain(operationsChunk)
  const reservedHeight = await distant.evaluate((element) => element.getBoundingClientRect().height)
  expect(reservedHeight).toBeGreaterThan(100)

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })
  for (let step = 0; step < 200 && !operationsWasRequested; step += 1) {
    await page.evaluate(() => scrollBy({ top: innerHeight / 4, behavior: 'auto' }))
    await page.waitForTimeout(16)
  }
  const approached = await distant.evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    status: element.getAttribute('data-preview-status'),
    scroll: scrollY,
    scrollMax: document.documentElement.scrollHeight - innerHeight,
    viewport: innerHeight,
  }))
  expect(operationsWasRequested, JSON.stringify(approached)).toBe(true)
  await expect(distant).toHaveAttribute('data-preview-status', 'loading')
  const loadingGeometry = await distant.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    top: element.getBoundingClientRect().top,
    viewport: innerHeight,
  }))
  expect(loadingGeometry.top).toBeGreaterThan(loadingGeometry.viewport)
  const loadingScroll = await page.evaluate(() => scrollY)
  releaseOperations?.()
  await expect(distant).toHaveAttribute('data-preview-status', 'ready', { timeout: 15_000 })
  expect(requests.filter((request) => request === operationsChunk)).toHaveLength(1)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(loadingScroll, 0)
  const readyHeight = await distant.evaluate((element) => element.getBoundingClientRect().height)
  expect(Math.abs(readyHeight - loadingGeometry.height)).toBeLessThan(64)
  await page
    .locator('[data-preview-address="block/authentication/sign-in-card"]')
    .scrollIntoViewIfNeeded()
  await distant.scrollIntoViewIfNeeded()
  expect(requests.filter((request) => request === operationsChunk)).toHaveLength(1)

  const isolatedContext = await browser.newContext()
  const isolatedPage = await isolatedContext.newPage()
  const isolatedRequests: string[] = []
  isolatedPage.on('request', (request) =>
    isolatedRequests.push(new URL(request.url()).pathname.slice(1)),
  )
  const origin = new URL(page.url()).origin
  await isolatedPage.goto(`${origin}/?preview=component%2Fbutton%23default`)
  await expect(isolatedPage.locator('[data-preview-address="component/button"]')).toHaveAttribute(
    'data-preview-status',
    'ready',
  )
  expect(isolatedRequests).toContain(buttonChunk)
  expect(isolatedRequests).not.toContain(operationsChunk)
  await isolatedContext.close()
})
