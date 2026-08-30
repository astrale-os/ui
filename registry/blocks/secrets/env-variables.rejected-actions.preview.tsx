import { EnvVariables } from './env-variables.js'
import { secretManagerRejectedActions } from './secrets.fixture.js'

export default function EnvVariablesRejectedActionsPreview() {
  return <EnvVariables {...secretManagerRejectedActions} />
}

export const preview = {
  canvas: 'wide' as const,
  source:
    'https://raw.githubusercontent.com/durgeshityaar/chadcn-ui/9f92a7134a2df98b249f455104137780ebf958a0/apps/web/content/blocks/cloud/env-variables/feature-rich.tsx',
}
