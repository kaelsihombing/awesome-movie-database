const Genre = require('../models/genre')
const {
    success,
    error,
} = require('../helpers/response.js')

exports.filter = async (req, res) => {
    try {
        let result = await Genre.filterByGenre(req.query.genre)
        success(res, result, 200)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.all = async (req, res) => {
    let result = await Genre.allGenre()
    success(res, result, 200)
}