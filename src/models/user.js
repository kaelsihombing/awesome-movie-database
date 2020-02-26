const mongoose = require('mongoose')
const Schema = mongoose.Schema
// const bcrypt = require('bcryptjs')
// const jwt = require('jsonwebtoken')
// const crypto = require('crypto')
// const axios = require('axios')
// const Imagekit = require('imagekit')
// const imagekit = new Imagekit({
//     publicKey: process.env.publicKey,
//     privateKey: process.env.privateKey,
//     urlEndpoint: process.env.urlEndpoint
// })
// const isEmpty = require('../helpers/isEmpty')
// const Auth = require('../events/auth')

// require('mongoose-type-email')
// mongoose.SchemaTypes.Email.defaults.message = 'Email address is invalid'

const defaultImage = 'https://ik.imagekit.io/m1ke1magek1t/default_image/seal-face-in-flat-design-vector-17125367_P7kNTkQZV.jpg';

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true,
        minlength: 4
    },

    email: {
        type: mongoose.SchemaTypes.Email,
        required: true,
        unique: true
    },

    image: {
        type: String,
        default: defaultImage
    },

    encrypted_password: {
        type: String
    },

    language: {
        type: String,
        required: true,
        default: 'en'
    },

    resetPasswordToken: {
        type: String,
        required: false
    },

    resetPasswordExpires: {
        type: Date,
        required: false
    }
}, {
    versionKey: false,
    timestamps: true,
}
)

class User extends mongoose.model('User', userSchema) {

}

module.exports = User;