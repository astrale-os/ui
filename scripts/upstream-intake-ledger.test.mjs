import Ajv2020 from 'ajv/dist/2020.js'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const ledgerPath = 'tooling/upstream/ledger.json'
const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
const schema = JSON.parse(await readFile('schemas/upstream-intake-ledger.schema.json', 'utf8'))

function digest(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

test('the upstream intake ledger is valid, unique, and deterministically ordered', () => {
  const validate = new Ajv2020({ strict: false }).compile(schema)
  assert.equal(validate(ledger), true, JSON.stringify(validate.errors, null, 2))
  const identities = ledger.entries.map((entry) => `${entry.provider}\0${entry.address}`)
  assert.equal(new Set(identities).size, identities.length)
  assert.deepEqual(identities, identities.toSorted())
})

test('every admitted intake is bound to exact provider proof and source bytes', async () => {
  for (const entry of ledger.entries.filter(
    (candidate) => candidate.decision.status === 'admitted',
  )) {
    assert.equal(path.isAbsolute(entry.proof), false)
    assert.equal(entry.proof.split('/').includes('..'), false)
    const proof = JSON.parse(await readFile(entry.proof, 'utf8'))
    assert.equal(proof.provider, entry.provider)
    assert.equal(proof.upstreamAddress, entry.address)
    assert.equal(proof.documentation, entry.documentation)
    assert.equal(proof.repository, entry.repository)
    assert.equal(proof.revision, entry.revision)
    assert.equal(proof.sourceDigest, entry.sourceDigest)
    assert.equal(proof.license, entry.license)
    assert.equal(proof.owner, entry.decision.owner)
    assert.equal(proof.adaptation, entry.adaptation.mode)
    const sourceFiles = Object.values(proof.files)
    assert.ok(sourceFiles.length >= 1)
    const physicalDigests = []
    for (const file of sourceFiles) {
      const physicalDigest = digest(await readFile(file.source))
      assert.equal(physicalDigest, file.sourceDigest)
      physicalDigests.push(physicalDigest)
    }
    assert.ok(
      physicalDigests.includes(proof.sourceDigest),
      `${entry.provider} top-level sourceDigest is not bound to a physical source file`,
    )
  }
})
