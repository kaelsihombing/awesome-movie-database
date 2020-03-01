const express = require('express')
const router = express.Router()

const user = require('./controllers/userController.js')
const incumbent = require('./controllers/incumbentController.js')
const movie = require('./controllers/movieController.js')
const review = require('./controllers/reviewController.js')

// middleware
const authenticate = require('./middlewares/authenticate')
const multer = require('./middlewares/multer')
const validateForm = require('./middlewares/validateForm')
const { check } = require('express-validator');

// User endpoint
router.post('/users', validateForm, user.create)
router.put('/users', multer, authenticate, user.update)
router.post('/auth', validateForm, user.auth)

// Admin endpoint
router.post('/admins', validateForm, user.createAdmin)

// Incumbent endpoint
router.post('/incumbents', authenticate, incumbent.add)
router.get('/incumbents', authenticate, incumbent.view)

// Movie endpoint
router.post('/movies', authenticate, movie.add)
router.get('/movies', movie.view)
router.get('/movies/all', movie.all)
router.put('/movies', authenticate, movie.edit)
router.put('/movies/incumbent', authenticate, movie.incumbent)

// Review endpoint
router.post('/reviews', authenticate, review.add)
router.get('/reviews', authenticate, review.mine)
router.get('/reviews/movie', review.reviews)
router.put('/reviews', authenticate, review.edit)

// Verify email endpoint
router.get('/verified/:token', user.verifyEmail)
router.post('/resend-email', authenticate, user.resentEmailVerification)

// Recovery password endpoint
router.post('/recover', [check('email').isEmail().withMessage('Enter a valid email address'),], user.recover);
router.get('/reset/:token', user.reset);
router.post('/reset/:token', [check('password').not().isEmpty().isLength({ min: 6 }).withMessage('Must be at least 6 chars long'), check('confirmPassword', 'Passwords do not match').custom((value, { req }) => (value === req.body.password)),], user.resetPassword);

//=======================
router.get('/movie', authenticate, movie.copyMovie)
module.exports = router;