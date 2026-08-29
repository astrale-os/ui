const seedPattern = /^[0-9a-f]{32}$/u

function rotl(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift))
}

function xmur3(source: string): () => number {
  let hash = 1_779_033_703 ^ source.length
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 3_432_918_353)
    hash = (hash << 13) | (hash >>> 19)
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2_246_822_507)
    hash = Math.imul(hash ^ (hash >>> 13), 3_266_489_909)
    return (hash ^= hash >>> 16) >>> 0
  }
}

function hex(value: number): string {
  return value.toString(16).padStart(8, '0')
}

export function assertGeneratorSeed(seed: string): string {
  if (!seedPattern.test(seed))
    throw new Error('Theme generator seed must be 32 lowercase hex characters.')
  return seed
}

export function deriveSeed(seed: string, scope: string): string {
  const hash = xmur3(`${assertGeneratorSeed(seed)}:${scope}`)
  return `${hex(hash())}${hex(hash())}${hex(hash())}${hex(hash())}`
}

export function seedFromBytes(bytes: Uint8Array): string {
  if (bytes.length !== 16) throw new Error('A theme generator seed requires exactly 16 bytes.')
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export class SeededRandom {
  private readonly state: Uint32Array
  private spareNormal: number | undefined

  constructor(seed: string) {
    assertGeneratorSeed(seed)
    this.state = new Uint32Array([
      Number.parseInt(seed.slice(0, 8), 16),
      Number.parseInt(seed.slice(8, 16), 16),
      Number.parseInt(seed.slice(16, 24), 16),
      Number.parseInt(seed.slice(24, 32), 16),
    ])
    if (this.state.every((value) => value === 0)) this.state[0] = 1
  }

  next(): number {
    const result = Math.imul(rotl(Math.imul(this.state[1] ?? 0, 5), 7), 9) >>> 0
    const temporary = ((this.state[1] ?? 0) << 9) >>> 0
    this.state[2] = ((this.state[2] ?? 0) ^ (this.state[0] ?? 0)) >>> 0
    this.state[3] = ((this.state[3] ?? 0) ^ (this.state[1] ?? 0)) >>> 0
    this.state[1] = ((this.state[1] ?? 0) ^ (this.state[2] ?? 0)) >>> 0
    this.state[0] = ((this.state[0] ?? 0) ^ (this.state[3] ?? 0)) >>> 0
    this.state[2] = ((this.state[2] ?? 0) ^ temporary) >>> 0
    this.state[3] = rotl(this.state[3] ?? 0, 11) >>> 0
    return result / 4_294_967_296
  }

  uniform(minimum = 0, maximum = 1): number {
    return minimum + this.next() * (maximum - minimum)
  }

  integer(minimum: number, maximumInclusive: number): number {
    return Math.floor(this.uniform(minimum, maximumInclusive + 1))
  }

  normal(mean = 0, standardDeviation = 1): number {
    if (this.spareNormal !== undefined) {
      const value = this.spareNormal
      this.spareNormal = undefined
      return mean + value * standardDeviation
    }
    const first = Math.max(Number.EPSILON, this.next())
    const second = this.next()
    const magnitude = Math.sqrt(-2 * Math.log(first))
    this.spareNormal = magnitude * Math.sin(2 * Math.PI * second)
    return mean + magnitude * Math.cos(2 * Math.PI * second) * standardDeviation
  }

  private gamma(shape: number): number {
    if (shape < 1) return this.gamma(shape + 1) * this.next() ** (1 / shape)
    const delta = shape - 1 / 3
    const constant = 1 / Math.sqrt(9 * delta)
    for (;;) {
      let normal: number
      let volume: number
      do {
        normal = this.normal()
        volume = 1 + constant * normal
      } while (volume <= 0)
      volume **= 3
      const draw = this.next()
      if (
        draw < 1 - 0.0331 * normal ** 4 ||
        Math.log(draw) < 0.5 * normal ** 2 + delta * (1 - volume + Math.log(volume))
      ) {
        return delta * volume
      }
    }
  }

  beta(alpha: number, beta: number): number {
    const left = this.gamma(alpha)
    const right = this.gamma(beta)
    return left / (left + right)
  }

  choose<Value>(values: readonly Value[]): Value {
    if (values.length === 0) throw new Error('Cannot choose from an empty collection.')
    return values[this.integer(0, values.length - 1)] as Value
  }

  weighted<Value>(choices: readonly { readonly value: Value; readonly weight: number }[]): Value {
    const total = choices.reduce((sum, choice) => sum + choice.weight, 0)
    if (!(total > 0)) throw new Error('Weighted choices require a positive total weight.')
    let draw = this.uniform(0, total)
    for (const choice of choices) {
      draw -= choice.weight
      if (draw <= 0) return choice.value
    }
    return choices.at(-1)?.value as Value
  }
}

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function lerp(minimum: number, maximum: number, progress: number): number {
  return minimum + (maximum - minimum) * progress
}

export function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
