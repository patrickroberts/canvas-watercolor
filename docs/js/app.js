(async function () {
  'use strict'

  const { Blob, HTMLCanvasElement, Image, URL, Worker, document, fetch } = window

  /* resolves URLs relative to document using <a>.href */
  function resolve (relative) {
    const anchor = document.createElement('a')

    anchor.href = relative

    return anchor.href
  }

  /* get worker script as text template */
  const script = await fetch(resolve('js/worker.js')).then(body => body.text())
  const config = document.getElementById('configuration')
  const generate = document.getElementById('generate')

  let onscreen = document.getElementById('watercolor')
  let worker = null

  generate.addEventListener('click', function () {
    if (worker !== null) {
      worker.terminate()
    }

    const canvas = document.createElement('canvas')
    const { width, height } = eval(`(${config.value})`)

    canvas.width = width
    canvas.height = height

    onscreen.parentNode.replaceChild(canvas, onscreen)
    onscreen = canvas

    const offscreen = canvas.transferControlToOffscreen()

    const blob = new Blob([
      script
        .replace(/\/\*(.*?)\{\{config\}\}(.*?)\*\//g, (match, before, after) => before + config.value + after)
        .replace(/\/\*(.*?)\{\{url\}\}(.*?)\*\//g, (match, before, after) => before + resolve('js/watercolor.min.js') + after)
    ], { type: 'application/javascript' })
    const oUrl = URL.createObjectURL(blob)

    worker = new Worker(oUrl)

    URL.revokeObjectURL(oUrl)

    worker.postMessage({ canvas: offscreen }, [offscreen])
    worker.addEventListener('message', function (event) {
      const blob = event.data
      const oUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const img = new Image()

      anchor.appendChild(img)

      img.addEventListener('load', () => {
        onscreen.parentNode.replaceChild(anchor, onscreen)
        onscreen = anchor
      })

      anchor.setAttribute('href', oUrl)
      anchor.setAttribute('download', 'watercolor.png')
      img.src = oUrl
    })
  })
})()
