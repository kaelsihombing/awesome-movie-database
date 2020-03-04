const Movie = require('../models/movie.js')
const {
    success,
    error,
} = require('../helpers/response.js')


exports.add = async (req, res) => {
    try {
        let result = await Movie.register(req.user._id, req.user.role, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.deleteMovie = async (req, res) => {
    try {
        let result = await Movie.deleteMovie(req.user.role, req.query.movieId)
        success(res, result.id, 201, result.message)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.view = async (req, res) => {
    try {
        let result = await Movie.show(false, 1, req.query.movieId)
        success(res, result, 200)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.all = async (req, res) => {
    let result = await Movie.show(req.query.pagination || true, req.query.page || 1, null)
    success(res, result, 200)
}

exports.edit = async (req, res) => {
    try {
        let result = await Movie.update(req.query.movieId, req.user._id, req.user.role, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.incumbent = async (req, res) => {
    try {
        let result = await Movie.addIncumbent(req.query.movieId, req.user._id, req.user.role, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.copyMovie = async (req, res) => {
    try {
        let result = await Movie.copyMovie(req.query.i, req.user._id, req.user.role)

        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.findTitle = async (req, res) => {
    try {
        let result = await Movie.findByTitle(req.query.title)
        success(res, result, 200)
    }
    catch (err) {
        error(res, err, 422)
    }
}
