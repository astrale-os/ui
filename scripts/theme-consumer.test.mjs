/* eslint-disable no-console -- contract test output. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

// Compiles the published theme the way `pnpm build` does, then compiles a Tailwind consumer
// stylesheet on top of it, and asserts the contract a consumer relies on: semantic utilities resolve
// to the `--ui-*` tokens, the class-based dark variant applies, and the package's compiled rules sit
// in `@layer components`, below the consumer's `utilities` layer.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageRoot = path.join(root, 'packages/ui')
const tailwind = path.join(packageRoot, 'node_modules/.bin/tailwindcss')
const tailwindEntry = path.join(packageRoot, 'node_modules/tailwindcss/index.css')

function compile(input, output) {
  const result = spawnSync(tailwind, ['-i', input, '-o', output], {
    cwd: packageRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  return readFileSync(output, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

/** Every `{…}` block whose selector list starts with `selector`, with the enclosing `@layer` name. */
function rules(css, selector) {
  const layers = []
  const layerPattern = /@layer ([a-z]+)\s*\{/gu
  let match
  while ((match = layerPattern.exec(css))) {
    let depth = 0
    for (let index = match.index + match[0].length - 1; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1
      if (css[index] === '}') depth -= 1
      if (depth === 0) {
        layers.push({ name: match[1], start: match.index, end: index })
        break
      }
    }
  }
  const found = []
  const pattern = new RegExp(`(^|[\\s}])${escapeRegExp(selector)}([^{]*)\\{([^}]*)\\}`, 'gu')
  while ((match = pattern.exec(css))) {
    const layer = layers.find((entry) => match.index > entry.start && match.index < entry.end)
    found.push({ selector: selector + match[2].trim(), body: match[3], layer: layer?.name ?? null })
  }
  return found
}

test('a Tailwind consumer gets the semantic contract and wins the cascade over compiled component rules', () => {
  const workspace = mkdtempSync(path.join(packageRoot, '.theme-consumer-'))
  try {
    const compiledTheme = compile(
      path.join(packageRoot, 'src/theme/theme.css'),
      path.join(workspace, 'theme.compiled.css'),
    )
    assert.doesNotMatch(compiledTheme, /@theme/u, 'published theme.css must stay precompiled')
    assert.equal(rules(compiledTheme, '.bg-card')[0]?.layer, 'components')
    assert.equal(rules(compiledTheme, ':where([data-slot])')[0]?.layer, 'components')
    const tokens = rules(compiledTheme, ':root').find((rule) => /--ui-background/u.test(rule.body))
    assert.equal(tokens?.layer, null, 'preset tokens must stay outside every layer')

    const consumer = path.join(workspace, 'consumer.css')
    writeFileSync(
      consumer,
      [
        `@import '${tailwindEntry}' source(none);`,
        `@import './theme.compiled.css';`,
        `@import '${path.join(packageRoot, 'src/theme/presets/astrale.css')}';`,
        `@import '${path.join(packageRoot, 'src/theme/tailwind.css')}';`,
        `@source inline("bg-background/90 font-serif font-heading border-border basis-full sm:basis-auto dark:bg-card");`,
        '',
      ].join('\n'),
    )
    const css = compile(consumer, path.join(workspace, 'consumer.out.css'))

    assert.match(css, /@layer theme, base, components, utilities;/u)

    const background = rules(css, '.bg-background\\/90')
    assert.equal(background.length, 1)
    assert.equal(background[0].layer, 'utilities')
    assert.match(background[0].body, /var\(--ui-background\)/u)

    for (const font of ['.font-serif', '.font-heading']) {
      const [rule] = rules(css, font)
      assert.ok(rule, `${font} must be generated for consumers`)
      assert.equal(rule.layer, 'utilities')
      assert.match(rule.body, /var\(--ui-font-heading\)/u)
    }

    assert.match(rules(css, '.border-border')[0]?.body ?? '', /var\(--ui-border\)/u)

    const [dark] = rules(css, '.dark\\:bg-card')
    assert.ok(dark, 'class-based dark variant must be generated')
    assert.match(dark.selector, /:where\(\.dark, \.dark \*\)/u)
    assert.match(dark.body, /var\(--ui-card\)/u)

    const basis = rules(css, '.basis-full').map((rule) => rule.layer)
    assert.deepEqual(basis.toSorted(), ['components', 'utilities'])
    assert.equal(rules(css, '.sm\\:basis-auto')[0]?.layer, 'utilities')
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('every preset scopes its dark tokens like the dark variant does', () => {
  for (const name of ['astrale', 'compact', 'expressive']) {
    const preset = readFileSync(path.join(packageRoot, `src/theme/presets/${name}.css`), 'utf8')
    assert.match(
      preset,
      new RegExp(
        `^\\.dark,\\n\\.dark \\[data-ui-preset='${name}'\\],\\n\\[data-ui-preset='${name}'\\]\\.dark \\{`,
        'mu',
      ),
    )
    assert.doesNotMatch(preset, /:root\.dark/u)
  }
})
