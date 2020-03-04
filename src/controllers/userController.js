const User = require('../models/user.js');
// const mailer = require('../helpers/nodeMailer');
// const bcrypt = require('bcryptjs');
const {
    success,
    error,
} = require('../helpers/response.js')

exports.create = async (req, res) => {
    try {
        let result = await User.register(req.body, req)

        success(res, result.data, 201, result.message)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.deleteAccount = async (req, res) => {
    try {
        console.log('here');
        let result = await User.deleteAccount(req.user._id)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.createAdmin = async (req, res) => {
    try {
        let result = await User.registerAdmin(req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.auth = async (req, res) => {
    try {
        let result = await User.auth(req)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.update = async (req, res) => {
    try {
        let result = await User.dataUpdate(req.user, req)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.recover = async (req, res) => {
    try {
        let result = await User.recover(req)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.reset = async (req, res) => {
    try {
        await User.reset(req)
        res.render('reset');
    }
    catch (err) {
        error(res, err, 422)
    }
};

exports.resetPassword = async (req, res) => {
    try {
        await User.resetPassword(req)
        res.render('done');
    }
    catch (err) {
        error(res, err, 422)
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        let result = await User.verifyEmail(req)
        success(res, result, 422)
    }
    catch (err) {
        error(res, err, 422)
    }
};

exports.resentEmailVerification = async (req, res) => {
    try {
        let result = await User.resendEmail(req)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}