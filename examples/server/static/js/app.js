(function () {
  const script = document.getElementById('worker').textContent
  const config = document.getElementById('configuration')
  const generate = document.getElementById('generate')

  let onscreen = document.getElementById('watercolor')
  let worker = null

  generate.addEventListener('click', function () {
    if (worker !== null) {
      worker.terminate()
    }

    const { Blob, URL, Worker } = window

    const canvas = document.createElement('canvas')
    const offscreen = canvas.transferControlToOffscreen()

    canvas.width = onscreen.width
    canvas.height = onscreen.height

    onscreen.parentNode.replaceChild(canvas, onscreen)
    onscreen = canvas

    const blob = new Blob([script.replace(/\{\{config\}\}/g, config.value)], { type: 'text/javascript' })
    const oUrl = URL.createObjectURL(blob)

    worker = new Worker(oUrl)

    URL.revokeObjectURL(oUrl)

    worker.postMessage({ canvas: offscreen }, [offscreen])
    worker.addEventListener('message', function (event) {
      const { width, height } = event.data

      onscreen.width = width
      onscreen.height = height
    })
  })
})()
