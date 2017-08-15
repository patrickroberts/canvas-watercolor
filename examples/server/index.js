const path = require('path')
const express = require('express')
const app = express()

const staticDirectory = path.resolve(__dirname, 'static')
const umdDirectory = path.resolve(__dirname, '../../umd')

app.use(express.static(staticDirectory))
app.use('/js', express.static(umdDirectory))

app.listen(process.env.PORT || 8000)
