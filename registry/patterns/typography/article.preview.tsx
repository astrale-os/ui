import { TypographyArticle } from './article.js'

export const preview = { canvas: 'wide' } as const

export default function TypographyArticlePreview() {
  return (
    <TypographyArticle title="Owned UI" byline="Astrale">
      <p>Components preserve exact behavior while themes change their character.</p>
      <h2>Portable by default</h2>
      <p>Patterns and blocks become consumer-owned source after installation.</p>
    </TypographyArticle>
  )
}
