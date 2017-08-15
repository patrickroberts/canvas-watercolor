import Color from './color'
import Pixel from './pixel'
import { select, weights, compare } from './utils'

const { OffscreenCanvas, performance } = global

class Watercolor {
  constructor ({
    canvas,
    width = canvas.width,
    height = canvas.height,
    depth = Math.round(Math.log2(width * height) / 3),
    priority = 0,
    select = Watercolor.select.min,
    weights = Watercolor.weights.default,
    focus = [50, 50],
    interval = 1000,
    sort,
    shuffle = false
  } = {}) {
    if (!(canvas instanceof OffscreenCanvas)) {
      throw new TypeError('canvas must be instance of OffscreenCanvas')
    }

    this.width = canvas.width = width
    this.height = canvas.height = height
    this.priority = priority
    this.select = typeof select === 'function' ? select : Watercolor.select[select]
    this.weights = Array.isArray(weights) ? weights : Watercolor.weights[weights]

    const x = Math.min(Math.max(Math.round(focus[0] * (width - 1) / 100), 0), width - 1)
    const y = Math.min(Math.max(Math.round(focus[1] * (height - 1) / 100), 0), height - 1)

    this.focus = [x, y]
    this.interval = interval

    this.context = canvas.getContext('2d')
    this.colors = []

    this.process = this.process.bind(this, Pixel, compare, performance, Math.random)

    const bitsPerChannel = depth
    const colorsPerChannel = 1 << bitsPerChannel

    for (let b = 0; b < colorsPerChannel; b++) {
      for (let g = 0; g < colorsPerChannel; g++) {
        for (let r = 0; r < colorsPerChannel; r++) {
          this.colors[this.colors.length] = new Color(r, g, b, bitsPerChannel)
        }
      }
    }

    if (typeof sort === 'function') {
      this.colors.sort(sort).reverse()
    } else if (shuffle) {
      for (let i = this.colors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[this.colors[i], this.colors[j]] = [this.colors[j], this.colors[i]]
      }
    }
  }

  calculate (weights, select, data, color, neighbors) {
    const distances = []

    for (const { index } of neighbors) {
      if (data[index + 3] === 255) {
        distances[distances.length] = color.compare([data[index], data[index + 1], data[index + 2]], weights)
      }
    }

    return {
      /* unavailable neighbor count, including out-of-bounds */
      count: distances.length - neighbors.length + 8,
      distance: select(distances)
    }
  }

  async process (Pixel, compare, performance, random) {
    const { colors, context, interval, select } = this

    const available = [{
      pixel: Pixel.memoized(this.focus[0], this.focus[1], this.width, this.height),
      count: 0,
      distance: 0
    }]

    const pixels = context.createImageData(this.width, this.height)
    const { data } = pixels

    const calculate = this.calculate.bind(this, this.weights, this.select, data)

    const filterCallback = function (available, data, someCallback, neighbor) {
      return data[neighbor.index + 3] === 0 && !available.some(someCallback, neighbor)
    }.bind(this, available, data, function someCallback (candidate) {
      return this === candidate.pixel
    })

    let last = performance.now()

    while (colors.length > 0 && available.length > 0) {
      const color = colors.pop()

      let neighbors = 0

      for (const candidate of available) {
        const calculation = calculate(color, candidate.pixel.neighbors)

        neighbors += candidate.count = calculation.count
        candidate.distance = calculation.distance
      }

      const priority = this.priority || neighbors / available.length

      available.sort(compare.bind(null, priority))

      let bestIndex = 0
      let best = available[0]
      let swaps = 1

      for (const [index, candidate] of available.entries()) {
        if (best.count < priority) {
          break
        }

        if (best.count <= candidate.count && best.distance >= candidate.distance && random() * swaps < 1) {
          best = candidate
          bestIndex = index
          swaps++
        }
      }

      const { index, x, y } = best.pixel

      data[index] = color.r
      data[index + 1] = color.g
      data[index + 2] = color.b
      data[index + 3] = 255

      const empty = best.pixel.neighbors.filter(filterCallback)

      available.splice(bestIndex, 1)

      for (const pixel of empty) {
        available[available.length] = {
          pixel,
          count: 0,
          distance: 0
        }
      }

      context.putImageData(pixels, 0, 0, x, y, 1, 1)

      if (performance.now() - last >= interval) {
        await context.commit()

        last = performance.now()
      }
    }
  }
}

Object.defineProperties(Watercolor, {
  select: {
    configurable: true,
    value: select,
    writable: true
  },
  weights: {
    configurable: true,
    value: weights,
    writable: true
  }
})

export default Watercolor
