'use strict'

export default class Color {
  constructor (r, g, b, bitsPerChannel) {
    const shift = 8 - bitsPerChannel
    const offset = Math.max(0, 1 << shift - 1)

    this.r = (r << shift) + offset
    this.g = (g << shift) + offset
    this.b = (b << shift) + offset
  }

  compare ([r2, g2, b2], [rw, gw, bw] = [1, 1, 1]) {
    const { r: r1, g: g1, b: b1 } = this

    const dr = (r1 - r2) * rw
    const dg = (g1 - g2) * gw
    const db = (b1 - b2) * bw

    return dr * dr + dg * dg + db * db
  }
}
