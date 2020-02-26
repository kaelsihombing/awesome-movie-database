const express = require('express')
const router = express.Router()

const user = require('../src/controllers/userController.js')

// const authenticate = require('./middlewares/authenticate')
// const multer = require('./middlewares/multer')

const validateForm = require('./middlewares/validateForm')

// User endpoint
router.post('/users', validateForm, user.create)

module.exports = router