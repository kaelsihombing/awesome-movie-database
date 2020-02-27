const Incumbent = require('../models/incumbent.js');
const {
    success,
    error,
} = require('../helpers/response.js')

exports.add = async (req, res) => {
    try{
        let result = await Incumbent.register(req.user.role, req.body)
        success(res, result, 201)
    }
    catch (err){
        error(res, err, 422)
    }
}