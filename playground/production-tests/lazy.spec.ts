import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<
  string,
  { file: string }
>
const teamChunk = Object.entries(manifest).find(([source]) =>
  source.endsWith('/registry/blocks/settings/team.preview.tsx'),
)?.[1].file
const buttonChunk = Object.entries(manifest).find(([source]) =>
  source.endsWith('/packages/ui/previews/button/button.preview.tsx'),
)?.[1].file

test('production chunks stay isolated, load near the viewport once, and preserve scroll geometry', async ({
  page,
}) => {
  test.setTimeout(60_000)
  expect(teamChunk).toBeTruthy()
  expect(buttonChunk).toBeTruthy()
  const requests: string[] = []
  let releaseTeam: (() => void) | undefined
  let teamWasRequested = false
  const teamRelease = new Promise<void>((resolve) => {
    releaseTeam = resolve
  })
  await page.route('**/*', async (route) => {
    const requested = new URL(route.request().url()).pathname.slice(1)
    if (requested === teamChunk) {
      teamWasRequested = true
      await teamRelease
    }
    await route.continue()
  })
  page.on('request', (request) => requests.push(new URL(request.url()).pathname.slice(1)))

  await page.goto('/')
  const distant = page.locator('[data-preview-address="block/settings/team"]')
  await expect(distant).toHaveAttribute('data-preview-status', 'idle')
  expect(requests).not.toContain(teamChunk)
  const reservedHeight = await distant.evaluate((element) => element.getBoundingClientRect().height)
  expect(reservedHeight).toBeGreaterThan(100)

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
  })
  for (let step = 0; step < 200 && !teamWasRequested; step += 1) {
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
  expect(teamWasRequested, JSON.stringify(approached)).toBe(true)
  await expect(distant).toHaveAttribute('data-preview-status', 'loading')
  const loadingGeometry = await distant.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    top: element.getBoundingClientRect().top,
    viewport: innerHeight,
  }))
  expect(loadingGeometry.top).toBeGreaterThan(loadingGeometry.viewport)
  const loadingScroll = await page.evaluate(() => scrollY)
  releaseTeam?.()
  await expect(distant).toHaveAttribute('data-preview-status', 'ready', { timeout: 15_000 })
  expect(requests.filter((request) => request === teamChunk)).toHaveLength(1)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(loadingScroll, 0)
  const readyHeight = await distant.evaluate((element) => element.getBoundingClientRect().height)
  expect(Math.abs(readyHeight - loadingGeometry.height)).toBeLessThan(64)
  await page.locator('[data-preview-address="component/button"]').scrollIntoViewIfNeeded()
  await distant.scrollIntoViewIfNeeded()
  expect(requests.filter((request) => request === teamChunk)).toHaveLength(1)

  requests.length = 0
  await page.goto('/?preview=component%2Fbutton%23default')
  await expect(page.locator('[data-preview-address="component/button"]')).toHaveAttribute(
    'data-preview-status',
    'ready',
  )
  expect(requests).toContain(buttonChunk)
  expect(requests).not.toContain(teamChunk)
})
