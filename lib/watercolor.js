'use strict'

import Color from './color'
import Pixel from './pixel'
import random from './random'

const select = {
  min: Function.prototype.apply.bind(Math.min, Math),
  max: Function.prototype.apply.bind(Math.max, Math),
  average (distances) {
    let sum = 0

    for (let index = distances.length - 1; index >= 0; index--) {
      sum += distances[index]
    }

    return sum / distances.length
  },
  median (distances) {
    distances.sort((a, b) => a - b)

    const middle = distances.length >> 1

    if (distances.length % 2 === 1) {
      return distances[middle]
    } else {
      return (distances[middle] + distances[middle - 1]) / 2
    }
  }
}

const weights = {
  default: [1, 1, 1],
  natural: [2126, 7152, 722]
}

class Watercolor {
  /* validate with duck-typing */
  static validateImageData (
    imageData,
    name = 'imageData',
    error = new TypeError(`${name} must be an instance of ImageData`)
  ) {
    if (!imageData) {
      throw error
    }

    const { width, height, data } = Object(imageData)

    /* `this` refers to class, not instance */
    this.validateDimension(width, 'imageData.width')
    this.validateDimension(height, 'imageData.height')
    this.validateData(data, 'imageData.data')
  }

  static validateDimension (
    dimension,
    name = 'dimension',
    error = new TypeError(`${name} must be a positive integer`)
  ) {
    if (dimension <= 0 || Math.floor(dimension) !== dimension) {
      throw error
    }
  }

  static validateData (
    data,
    name = 'data',
    error = new TypeError(`${name} must be an unsigned 8-bit integer array with a 4-byte alignment`)
  ) {
    if (data.length !== data.byteLength || data.length % 4 !== 0 || !/^Uint8/.test(data.constructor.name)) {
      throw error
    }
  }

  static validateSeed (
    seed,
    name = 'seed',
    error = new TypeError(`${name} must be a non-negative number`)
  ) {
    if (!(seed >= 0)) {
      throw error
    }
  }

  constructor (
    {
      canvas,
      context = canvas.getContext('2d'),
      width = context.canvas.width,
      height = context.canvas.height,
      imageData = context.getImageData(0, 0, width, height),
      depth = Math.round(Math.log2(width * height) / 3),
      priority = 0,
      select = 'min',
      weights = 'default',
      focus = [50, 50],
      seed = Date.now(),
      sort,
      shuffle = false
    } = {}
  ) {
    /* avoid scoped reference to `Watercolor` by using `this.constructor` instead */
    const Watercolor = this.constructor

    Watercolor.validateImageData(imageData)
    Watercolor.validateSeed(seed)

    this.context = context
    this.imageData = imageData
    this.width = width
    this.height = height
    this.depth = depth
    this.priority = priority
    this.select = typeof select === 'function' ? select : Watercolor.select[select]
    this.weights = Array.isArray(weights) ? weights : Watercolor.weights[weights]

    /* convert % to px */
    const x = Math.min(Math.max(Math.round(focus[0] * (width - 1) / 100), 0), width - 1)
    const y = Math.min(Math.max(Math.round(focus[1] * (height - 1) / 100), 0), height - 1)

    this.focus = [x, y]
    this.seed = seed
    this.sort = sort
    this.shuffle = shuffle
  }

  get colors () {
    /* avoid scoped reference to `Watercolor` by using `this.constructor` instead */
    const { Color } = this.constructor
    const { depth, random, shuffle, sort } = this

    const colors = []
    const colorsPerChannel = 1 << depth

    for (let b = 0; b < colorsPerChannel; b++) {
      for (let g = 0; g < colorsPerChannel; g++) {
        for (let r = 0; r < colorsPerChannel; r++) {
          colors[colors.length] = new Color(r, g, b, depth)
        }
      }
    }

    if (typeof sort === 'function') {
      /* reverse() because pop() is more efficient than shift() */
      colors.sort(sort).reverse()
    } else if (shuffle) {
      /* Fisher-Yates shuffle */
      for (let i = colors.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[colors[i], colors[j]] = [colors[j], colors[i]]
      }
    }

    return colors
  }

  /* will be bound to `priority` */
  compare (a, b) {
    return (b.count >= this) - (a.count >= this) || a.distance - b.distance
  }

  calculate (data, select, weights, color, candidate) {
    const neighbors = candidate.pixel.neighbors
    const distances = []

    for (const { index } of neighbors) {
      if (data[index + 3] === 255) {
        distances[distances.length] = color.compare([data[index], data[index + 1], data[index + 2]], weights)
      }
    }

    /* unavailable neighbors count, including out-of-bound pixels */
    candidate.count = distances.length - neighbors.length + 8
    candidate.distance = select(distances)
  }

  async process (shouldCommit = () => false) {
    /* avoid scoped reference to `Watercolor` */
    const Watercolor = this.constructor

    /* seed lcg before accessing `colors` from getter */
    const random = this.random = Watercolor.random(this.seed)

    const { colors, compare, context, imageData } = this
    const { data } = imageData

    const calculate = this.calculate.bind(null, data, this.select, this.weights)

    const candidates = [
      {
        pixel: Watercolor.Pixel.create(this.focus[0], this.focus[1], this.width, this.height),
        count: 0,
        distance: 0
      }
    ]

    const filterCallback = function (candidates, data, someCallback, neighbor) {
      return data[neighbor.index + 3] === 0 && !candidates.some(someCallback, neighbor)
    }.bind(null, candidates, data, function (candidate) {
      return this === candidate.pixel
    })

    while (colors.length > 0 && candidates.length > 0) {
      const color = colors.pop()
      let total = 0

      for (const candidate of candidates) {
        calculate(color, candidate)
        total += candidate.count
      }

      /* logical short-circuiting to conditionally use adaptive prioritization */
      const priority = this.priority || total / candidates.length

      candidates.sort(compare.bind(priority))

      let bestIndex = 0
      let bestCandidate = candidates[bestIndex]
      let sample = 1

      /* pseudo-randomly choose candidate pixel using weighted sampling of qualified candidates */
      for (const [index, candidate] of candidates.entries()) {
        /* no more candidates will qualify */
        if (candidate.count < priority || candidate.distance > bestCandidate.distance) {
          break
        }

        if (bestCandidate.count <= candidate.count && bestCandidate.distance >= candidate.distance && random() * sample < 1) {
          bestIndex = index
          bestCandidate = candidate
          sample++
        }
      }

      const { index, x, y, neighbors } = bestCandidate.pixel

      data[index] = color.r
      data[index + 1] = color.g
      data[index + 2] = color.b
      data[index + 3] = 255

      candidates.splice(bestIndex, 1)

      for (const pixel of neighbors.filter(filterCallback)) {
        candidates[candidates.length] = { pixel, count: 0, distance: 0 }
      }

      context.putImageData(imageData, 0, 0, x, y, 1, 1)

      if (shouldCommit()) {
        await new Promise(requestAnimationFrame)
      }
    }
  }
}

Object.defineProperties(Watercolor, {
  Color: {
    configurable: true,
    value: Color,
    writable: true
  },
  Pixel: {
    configurable: true,
    value: Pixel,
    writable: true
  },
  random: {
    configurable: true,
    value: random,
    writable: true
  },
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
