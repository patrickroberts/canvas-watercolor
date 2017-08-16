export function * lcg (seed, a = 25214903917, c = 11, m = 2 ** 48 - 1) {
  const d = 2 ** 32
  const t = 2 ** 16

  while (true) {
    seed = (a * seed + c) % m
    yield Math.floor(seed / t) / d
  }
}

export default function seed (input) {
  const generator = lcg(input)

  return function random () {
    return this().value
  }.bind(generator.next.bind(generator))
}
