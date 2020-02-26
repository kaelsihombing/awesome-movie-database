const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const axios = require('axios')
const Imagekit = require('imagekit')
const imagekit = new Imagekit({
    publicKey: process.env.publicKey,
    privateKey: process.env.privateKey,
    urlEndpoint: process.env.urlEndpoint
})
const isEmpty = require('../helpers/isEmpty')
const Auth = require('../events/auth')

require('mongoose-type-email')
mongoose.SchemaTypes.Email.defaults.message = 'Email address is invalid'

const defaultImage = require('../fixtures/profileImage').profileImage;

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

    verified: {
        type: Boolean,
        default: false
    },

    role: {
        type: String,
        enum: ['ADMIN', 'USER'],
        default: 'USER'
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
    static generatePasswordReset(id) {
        var resetPasswordToken = crypto.randomBytes(20).toString('hex');
        var resetPasswordExpires = Date.now() + 360000; // 6 minutes expired

        let properties = {
            resetPasswordToken: resetPasswordToken,
            resetPasswordExpires: resetPasswordExpires
        }

        return new Promise((resolve, reject) => {
            this.findByIdAndUpdate(id, properties, { new: true })
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static register({ fullname, email, password, password_confirmation }) {
        return new Promise((resolve, reject) => {

            if (password !== password_confirmation) return reject('Password and Password Confirmation doesn\'t match')

            let encrypted_password = bcrypt.hashSync(password, 10)

            this.create({
                fullname, email, encrypted_password
            })
                .then(data => {
                    let token = jwt.sign({ _id: data._id, role: data.role }, process.env.JWT_SIGNATURE_KEY)
                    resolve({
                        id: data._id,
                        fullname: data.fullname,
                        email: data.email,
                        language: data.language,
                        verified: data.verified,
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

    static registerAdmin({ fullname, email, password, password_confirmation }) {
        return new Promise((resolve, reject) => {

            if (password !== password_confirmation) return reject('Password and Password Confirmation doesn\'t match')

            let encrypted_password = bcrypt.hashSync(password, 10)
            let role = 'ADMIN'

            this.create({
                fullname, email, encrypted_password, role
            })
                .then(data => {                  
                    let token = jwt.sign({ _id: data._id, role: data.role }, process.env.JWT_SIGNATURE_KEY)
                    resolve({
                        id: data._id,
                        fullname: data.fullname,
                        email: data.email,
                        role: data.role,
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

    static auth(req) {
        return new Promise((resolve, reject) => {
            this.findOne({ email: req.body.email })
                .then(async data => {
                    if (isEmpty(data)) return reject('Email does not exist, please input a valid email')
                    if (bcrypt.compareSync(req.body.password, data.encrypted_password)) {
                        let token = jwt.sign({ _id: data._id, language: data.language, role: data.role }, process.env.JWT_SIGNATURE_KEY)
                        Auth.emit('authorized', data._id)

                        return resolve({
                            id: data._id,
                            fullname: data.fullname,
                            email: data.email,
                            role: data.role,
                            image: data.image,
                            verified: data.verified,
                            token: token
                        })
                    } else {
                        Auth.emit('unauthorized', {
                            _id: data._id,
                            email: req.body.email,
                            source: req.headers['who?']
                        })
                        return reject({
                            errors: 'Email or Password is wrong, please fill valid data.'
                        })
                    }
                })
        })
    }

    static async updateData(id, req) {
        let params = {
            fullname: req.body.fullname,
            email: req.body.email,
            language: req.body.language
        }

        for (let prop in params) if (!params[prop]) delete params[prop];
        if (req.file) {
            let url = await imagekit.upload({ file: req.file.buffer.toString('base64'), fileName: `IMG-${Date.now()}` })
            params.image = url.url
        } else {
            params.image = defaultImage
        }

        return new Promise((resolve, reject) => {
            this.findByIdAndUpdate(id, params, { new: true })
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static OAuthGoogle(token) {

        return new Promise((resolve, reject) => {
            axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': token
                }
            })
                .then(data => {
                    // console.log(data)
                    resolve(data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    static findOrRegister(result) {
        return new Promise((resolve, reject) => {
            this.findOne({ email: result.data.email })
                .then(data => {
                    if (!data) {
                        this.collection.insert({
                            fullname: result.data.name,
                            email: result.data.email,
                            image: result.data.picture,
                            language: process.env.language
                        })
                            .then(user => {
                                let newUser = user.ops[0]
                                
                                let token = jwt.sign({ _id: newUser._id }, process.env.JWT_SIGNATURE_KEY)

                                return resolve({
                                    _id: newUser._id,
                                    fullname: newUser.fullname,
                                    image: newUser.image,
                                    email: newUser.email,
                                    token: token
                                })
                            })
                    } else {
                        let token = jwt.sign({ _id: data._id }, process.env.JWT_SIGNATURE_KEY)

                        return resolve({
                            _id: data._id,
                            fullname: data.fullname,
                            image: data.image,
                            email: data.email,
                            token: token
                        })
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

module.exports = User;