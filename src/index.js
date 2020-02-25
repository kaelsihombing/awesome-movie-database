const express = require('express')
const app = express()
const morgan = require('morgan')
const dotenv = require('dotenv')
// const swaggerUi = require('swagger-ui-express')
// const documentation = require('../swagger.json')
const cors = require('cors')
dotenv.config()

require('./database.js')

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: false}))


app.use(morgan('tiny'))
const router = require('./router')
app.use('/api/v1', router)
// app.use('/documentation', swaggerUi.serve, swaggerUi.setup(documentation))

/* istanbul ignore next */
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        data: 'Welcome to api'
    })
})

const {
    notFound,
    serverError
} = require('./exceptionHandler.js')

app.use(serverError)
app.use(notFound)

module.exports = app