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

    const { Blob, Image, URL, Worker } = window

    const canvas = document.createElement('canvas')
    const offscreen = canvas.transferControlToOffscreen()

    canvas.width = onscreen.width
    canvas.height = onscreen.height

    const blob = new Blob([script.replace(/\{\{config\}\}/g, config.value)], { type: 'application/javascript' })
    const oUrl = URL.createObjectURL(blob)

    worker = new Worker(oUrl)

    URL.revokeObjectURL(oUrl)

    worker.postMessage({ canvas: offscreen }, [offscreen])
    worker.addEventListener('message', function (event) {
      const { type, width, height, blob } = event.data

      switch (type) {
        case 'size':
          canvas.width = width
          canvas.height = height

          onscreen.parentNode.replaceChild(canvas, onscreen)
          onscreen = canvas
          break
        case 'data':
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
      }
    })
  })
})()
