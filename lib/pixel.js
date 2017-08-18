'use strict'

export default class AbstractPixel {
  /* extends class with memoization and returns instance for coordinates x,y */
  static create (x, y, width, height) {
    class Pixel extends AbstractPixel {
      constructor (x, y) {
        super(x, y)

        /* if coordinates in valid range */
        if (this.index >= 0) {
          /* check cache */
          if (this.cache.has(this.index)) {
            return this.cache.get(this.index)
          }

          /* add to cache */
          this.cache.set(this.index, this)
        }
      }
    }

    Object.defineProperties(Pixel.prototype, {
      cache: {
        configurable: true,
        value: new Map(),
        writable: true
      },
      width: {
        configurable: true,
        value: width,
        writable: true
      },
      height: {
        configurable: true,
        value: height,
        writable: true
      }
    })

    return new Pixel(x, y)
  }

  constructor (x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      this.x = -1
      this.y = -1

      this.index = -1

      return
    }

    this.x = x
    this.y = y

    this.index = (y * this.width + x) << 2
  }

  get neighbors () {
    const { x, y, constructor: Pixel } = this

    const neighbors = [
      new Pixel(x - 1, y - 1),
      new Pixel(x, y - 1),
      new Pixel(x + 1, y - 1),
      new Pixel(x - 1, y),
      new Pixel(x + 1, y),
      new Pixel(x - 1, y + 1),
      new Pixel(x, y + 1),
      new Pixel(x + 1, y + 1)
    ].filter(p => p.index >= 0)

    Object.defineProperty(this, 'neighbors', {
      configurable: true,
      value: neighbors,
      writable: true
    })

    return neighbors
  }
}
