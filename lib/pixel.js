export default class AbstractPixel {
  static memoized (x, y, width, height) {
    class Pixel extends AbstractPixel {
      constructor (x, y) {
        super(x, y)

        if (this.index >= 0) {
          if (this.cache.has(this.index)) {
            return this.cache.get(this.index)
          }

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

  equals (that) {
    return this.x === that.x && this.y === that.y
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
