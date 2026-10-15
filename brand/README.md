# Brand generator

Generates Astrale logo files from the geometry and colors in
`packages/ui/src/brand/geometry.ts`, the same source the `@astrale-os/ui/brand` components draw from.
This folder is repository tooling: it is not published, only what it generates is.

## One file, on demand

```bash
pnpm brand --lockup horizontal --color white --background black --format png --size 800,1600
pnpm brand --lockup tile --color white --background blue --format icns
pnpm brand --help
```

| Option         | Values                                                     |
| -------------- | ---------------------------------------------------------- |
| `--lockup`     | `symbol`, `wordmark`, `horizontal`, `stacked`, `tile`      |
| `--color`      | `blue` (`#003B82`), `black`, `white`                       |
| `--background` | `transparent`, `blue`, `black`, `white`                    |
| `--format`     | `svg`, `png`, `ico` and `icns` (the last two with `tile`)  |
| `--size`       | PNG width, or a comma-separated list; the side of a tile   |
| `--padding`    | Space around a lockup; defaults to its clear space on a background |
| `--radius`     | Tile corner radius over its side (`0.225`)                 |
| `--glyph`      | Symbol width over the tile side (`0.68`)                   |
| `--out`        | Output directory, relative to where the command runs       |

Colors are limited to the brand palette, and a logo cannot share its background's color. The
playground's **Logo** sheet does the same in the browser, for SVG and PNG.

## The icon set

`pnpm brand:build` writes the icons applications serve to `packages/ui/src/brand/icons/`, published
as `@astrale-os/ui/brand/icons/`. `pnpm brand:check` (part of `pnpm check`) fails when the committed
set no longer matches the geometry, the colors or the renderer, or when a file was edited by hand.
Change the set in `icons.mjs`, then run `pnpm brand:build` and commit the result.

PNG rendering uses `@resvg/resvg-js`; ICO and ICNS files are assembled in `raster.mjs`, so the
generator runs the same on Linux CI and macOS.

## brand.astrale.ai

`pnpm brand:site` builds the public brand site into `brand/dist/`: every lockup in every allowed
color and background (SVG, and PNG at the usual widths), social profile formats, the app icon set,
a zip of everything and an index page with the usage rules. Files live under `/v1/`; bump
`VERSION` in `site.mjs` whenever a published file changes, so links already shared keep working.

`.github/workflows/brand.yml` deploys the site (`brand/wrangler.jsonc`, Worker `astrale-brand`)
when the brand changes on main. Its Cloudflare token is the `CLOUDFLARE_API_TOKEN` secret of the
`brand` environment, which only main can deploy to, and `CLOUDFLARE_ACCOUNT_ID` is a variable of
the same environment. Without the token, the workflow builds the site and skips the deployment.
