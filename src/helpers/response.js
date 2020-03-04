const isEmpty = require('./isEmpty.js')

function success(res, data, statusCode, message = undefined) {
    const response = {
        success: true,
        message: message,
        data: data
    }
    if (isEmpty(data)) delete response.data
    if (isEmpty(message)) delete response.message

    return res.status(statusCode).json(response)
}

function error(res, err, statusCode, message = undefined) {
    const response = {
        success: false,
        message: message,
        error: err
    }
    if (isEmpty(err)) delete response.error
    if (isEmpty(message)) delete response.message
    return res.status(statusCode).json(response)
}

module.exports = {
    success,
    error
}