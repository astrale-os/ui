import { describe, expect, it } from 'vitest'

import project from '../../astrale.config.js'

describe('deployment environments', () => {
  it('keeps shared publications independent of a consumer Kernel', () => {
    expect(Object.keys(project.environments)).toEqual(['development', 'prod'])
    for (const environment of Object.values(project.environments)) {
      expect(environment).not.toHaveProperty('installation')
      expect(environment.deployment.adapter.name).toBe('cloudflare')
      expect(environment.deployment.parameters).not.toHaveProperty('instance')
    }
  })

  it('preserves production addressing and signing while separating development', () => {
    expect(project.environments.prod.deployment.parameters).toMatchObject({
      route: 'ui.astrale.ai',
      signingIdentity: '.astrale/identity.json',
    })
    expect(project.environments.development.deployment.parameters).not.toHaveProperty('route')
    expect(project).not.toHaveProperty('entrypoints')
  })
})
