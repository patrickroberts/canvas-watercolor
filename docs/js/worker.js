'use strict'

this.importScripts(/* '{{url}}' */)

const { OffscreenCanvas, Watercolor, close, performance, postMessage } = this

/* polyfill for `toBlob()` from Chrome-specific non-standard `convertToBlob()` */
Object.defineProperty(OffscreenCanvas.prototype, 'toBlob', {
  configurable: true,
  value: OffscreenCanvas.prototype.toBlob || OffscreenCanvas.prototype.convertToBlob,
  writable: true
})

this.addEventListener('message', async function (event) {
  const canvas = event.data.canvas
  const context = canvas.getContext('2d')
  const config = Object.assign(/* {{config}}, */{ context })

  postMessage({ type: 'size', width: config.width, height: config.height })

  function * generator (now, interval = 30, last = now()) {
    while (true) {
      while (now() - last < interval) {
        yield false
      }

      yield true
      last = now()
    }
  }

  const iterator = generator(performance.now.bind(performance), config.interval)
  const shouldCommit = function shouldCommit () {
    return this().value
  }.bind(iterator.next.bind(iterator))

  await new Watercolor(config).process(shouldCommit)

  const blob = await canvas.toBlob()

  postMessage({ type: 'data', blob })

  close()
})
