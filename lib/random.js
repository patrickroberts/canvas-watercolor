'use strict'

/* coefficients adapted from java.util.Random algorithm */
export function * lcg (seed, a = 25214903917, c = 11, m = 2 ** 48 - 1) {
  const d = 2 ** 32
  const t = 2 ** 16

  while (true) {
    seed = (a * seed + c) % m
    /* select bits 48...16 and normalize range to [0,1) */
    yield Math.floor(seed / t) / d
  }
}

/* seed initialization function returns bound iterator.next() */
export default function random (seed) {
  const iterator = lcg(seed)

  return function next () {
    return this().value
  }.bind(iterator.next.bind(iterator))
}
