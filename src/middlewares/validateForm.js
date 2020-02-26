const helper = require('../helpers/response')
const isEmpty = require('../helpers/isEmpty')
const validateForm = (req, res, next) => {
    if (isEmpty(req.body)) return helper.error(res, 'Please fill the form', 422)
    next()
}

module.exports = validateForm;