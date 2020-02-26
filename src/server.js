const express = require('express')

const morgan = require('morgan')
const dotenv = require('dotenv')
const swaggerUi = require('swagger-ui-express')
const documentation = require('../swagger.json')
const cors = require('cors')
var cons = require('consolidate');
var swig = require('swig');
const app = express();
dotenv.config()
var path = require("path");
process.log = {}

// database
require('./database.js')

// view engine setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors())

app.use(morgan('tiny'))
const router = require('./router')
app.use('/api/v1', router)
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(documentation))

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