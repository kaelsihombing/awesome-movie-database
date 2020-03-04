const isEmpty = require('./isEmpty.js')

function success(res, data, statusCode, message = undefined) {
    const response = {
        success: true,
        message: message,
        data
    }

    if (isEmpty(message)) delete response.message

    return res.status(statusCode).json(response)
}

function error(res, err, statusCode) {
    return res.status(statusCode).json({
        success: false,
        error: err
    })
}

module.exports = {
    success,
    error
}