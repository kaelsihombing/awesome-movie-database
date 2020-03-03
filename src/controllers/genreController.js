const Genre = require('../models/genre')
const {
    success,
    error,
} = require('../helpers/response.js')

exports.filter = async (req, res) => {
    try {
        let result = await Genre.filterByGenre(req.query.genre)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}