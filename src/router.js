const express = require('express')
const router = express.Router()

const user = require('./controllers/userController.js')
const movie = require('./controllers/movieController.js')

const authenticate = require('./middlewares/authenticate')
// const multer = require('./middlewares/multer')

const validateForm = require('./middlewares/validateForm')

// User endpoint
router.post('/users', validateForm, user.create)
router.put('/users', authenticate, user.update)
router.post('/auth', validateForm, user.auth)

// Movie endpoint
router.post('/movies', authenticate, movie.add)

module.exports = router