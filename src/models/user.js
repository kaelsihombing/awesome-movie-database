const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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

    role: {
        type: String,
        enum: ['ADMIN', 'USER'],
    },

    watchList: [{
        type: Schema.Types.ObjectId,
        ref: 'Movie',
    }],

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
    static register({ fullname, email, password, password_confirmation }) {
        return new Promise((resolve, reject) => {

            if (password !== password_confirmation) return reject('Password and Password Confirmation doesn\'t match')

            let encrypted_password = bcrypt.hashSync(password, 10)

            this.create({
                fullname, email, encrypted_password
            })
                .then(data => {
                    let token = jwt.sign({ _id: data.id }, process.env.JWT_SIGNATURE_KEY)
                    resolve({
                        id: data._id,
                        fullname: data.fullname,
                        email: data.email,
                        language: data.language,
                        image: data.image,
                        token: token
                    })
                })
                .catch(err => {
                    reject({
                        message: err.message
                    })
                })
        })
    }
}

module.exports = User;