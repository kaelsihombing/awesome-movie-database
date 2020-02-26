const express = require('express')
const router = express.Router()

const user = require('./controllers/userController.js')
const movie = require('./controllers/movieController.js')

// middleware
const authenticate = require('./middlewares/authenticate')
const multer = require('./middlewares/multer')

const validateForm = require('./middlewares/validateForm')
const {check} = require('express-validator');

// User endpoint
router.post('/users', validateForm, user.create)
router.put('/users', multer, authenticate, user.update)
router.post('/auth', validateForm, user.auth)

// Admin endpoint
router.post('/admins', validateForm, user.createAdmin)

// Movie endpoint
router.post('/movies', authenticate, movie.add)

// Password reset endpoint
router.post('/recover', [check('email').isEmail().withMessage('Enter a valid email address'),], user.recover);

router.get('/reset/:token', user.reset);

router.post('/reset/:token', [check('password').not().isEmpty().isLength({ min: 6 }).withMessage('Must be at least 6 chars long'),check('confirmPassword', 'Passwords do not match').custom((value, { req }) => (value === req.body.password)),], user.resetPassword);


module.exports = router;