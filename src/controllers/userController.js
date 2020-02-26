const User = require('../models/user.js');
const mailer = require('../helpers/nodeMailer');
const bcrypt = require('bcryptjs');
const {
    success,
    error,
} = require('../helpers/response.js')

exports.create = async (req, res) => {
    try {
        let result = await User.register(req.body, req)
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
    catch(err) {
        error(res, err, 422)
    }
}

exports.recover = async (req, res) => {
    try {
        let result = await User.recover(req)
        success(res, result, 201)
    }
    catch(err) {
        error(res, err, 422)
    }
}

exports.reset = (req, res) => {

    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
        .then(user => {
            if (!user) return res.render('expiredToken');

            //Redirect user to form with the email address
            res.render('reset', { user });
        })
        .catch(err => res.status(500).json({ message: err.message }));
};

exports.resetPassword = (req, res) => {

    User.findOne({ resetPasswordToken: req.params.token })
        .then(async user => {
            if (!user) return res.status(401).json({ message: 'Password reset token is invalid or has expired.' });

            //Set the new password
            user.encrypted_password = await bcrypt.hashSync(req.body.password, 10);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // Save
            user.save((err) => {

                if (err !== null) return res.status(500).json({ message: 'Error brooo' });

                // send email
                const mailOptions = {
                    to: user.email,
                    from: process.env.FROM_EMAIL,
                    subject: "Your password has been changed",
                    text: `Hi ${user.fullname} \n 
                    This is a confirmation that the password for your account ${user.email} has just been changed.\n`
                };

                mailer.send(mailOptions, (error) => {
                    if (error) return res.status(500).json({ message: error.message });
                    res.render('done')
                    // res.status(200).json({ message: 'Your password has been updated.' });
                });
            });
        });
};