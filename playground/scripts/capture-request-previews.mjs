#!/usr/bin/env node

import { mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function argument(name) {
  const index = process.argv.indexOf(name)
  if (index === -1 || !process.argv[index + 1]) throw new TypeError(`${name} is required`)
  return process.argv[index + 1]
}

const manifestPath = path.resolve(argument('--manifest'))
const require = createRequire(pathToFileURL(path.join(process.cwd(), 'playground/package.json')))
const playwrightModule = await import(pathToFileURL(require.resolve('@playwright/test')).href)
const { chromium } = playwrightModule.default ?? playwrightModule
const origin = new URL(argument('--origin'))
if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) {
  throw new TypeError('Capture origin is invalid')
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
if (
  manifest?.version !== 1 ||
  !Array.isArray(manifest.previews) ||
  manifest.previews.length === 0
) {
  throw new TypeError('Preview manifest is malformed')
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
try {
  for (const preview of manifest.previews) {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    const url = new URL(origin)
    url.searchParams.set('preview', preview.id)
    await page.goto(url.href, { waitUntil: 'networkidle' })
    const specimen = page.locator(
      `[data-preview-address=${JSON.stringify(preview.address)}][data-preview-scene=${JSON.stringify(preview.scene)}]`,
    )
    await specimen.waitFor({ state: 'visible' })
    await page.waitForFunction(
      ({ address, scene }) =>
        [...document.querySelectorAll('[data-preview-address]')].some(
          (element) =>
            element.getAttribute('data-preview-address') === address &&
            element.getAttribute('data-preview-scene') === scene &&
            element.getAttribute('data-preview-status') === 'ready',
        ),
      { address: preview.address, scene: preview.scene },
    )
    await page.evaluate(() => document.fonts.ready)
    await mkdir(path.dirname(path.resolve(path.dirname(manifestPath), preview.screenshot)), {
      recursive: true,
    })
    await specimen.screenshot({
      path: path.resolve(path.dirname(manifestPath), preview.screenshot),
      animations: 'disabled',
    })
    if (errors.length > 0) throw new Error(`${preview.id}: ${errors.join('\n')}`)
    await page.close()
  }
} finally {
  await context.close()
  await browser.close()
}
