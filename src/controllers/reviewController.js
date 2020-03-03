const Review = require('../models/review.js')
const {
    success,
    error,
} = require('../helpers/response')

// const translator = require('../helpers/translate').translator

exports.add = async (req, res) => {
    try {
        let result = await Review.register(req.user._id, req.query.movieId, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.mine = async (req, res) => {
    try{
    let result = await Review.myReview(req.user._id, req.query.pagination || true, req.query.page || 1)
    success(res, result, 200)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.reviews = async (req, res) => {
    try {
        let result = await Review.movieReview(req.query.movieId, req.query.pagination || true, req.query.page || 1)
        success(res, result, 200)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.edit = async (req, res) => {
    try {
        let result = await Review.editReview(req.user._id, req.query.reviewId, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.delete = async (req, res) => {
    try {
        let result = await Review.destroy(req.user._id, req.query.reviewId)
        success(res, result, 200)
    }
    catch (err) {
        error(res, err, 422)
    }
}