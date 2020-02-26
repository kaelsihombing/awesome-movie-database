const User = require('../models/user.js')
const {
    success,
    error,
} = require('../helpers/response.js')

const translator = require('../helpers/translate.js').translator

exports.create = async (req, res) => {
    try {
        let result = await User.register(req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}