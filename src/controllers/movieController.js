const Movie = require('../models/movie.js')
const {
    success,
    error,
} = require('../helpers/response.js')

// const translator = require('../helpers/translate.js').translator

exports.add = async (req, res) => {
    try {
        let result = await Movie.register(req.user._id, req.user.role, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.edit = async (req,res) => {
    try{
        let result = await Movie.update(req.query.id, req.user._id, req.user.role, req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}