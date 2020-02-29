
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const axios = require('axios');
const Imagekit = require('imagekit');
const imagekit = new Imagekit({
  publicKey: process.env.publicKey,
  privateKey: process.env.privateKey,
  urlEndpoint: process.env.urlEndpoint
});
const mailer = require('../helpers/nodeMailer');
const isEmpty = require('../helpers/isEmpty');
const Auth = require('../events/auth');

require('mongoose-type-email');
mongoose.SchemaTypes.Email.defaults.message = 'Email address is invalid';

const randomImage = [
  "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__5___gVErlfkr.jpeg",
  "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__4__bcJrAnNDS.jpeg",
  "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__3__G3mwd4sOJt.jpeg",
  "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__2__rzdmaMNz8e.jpeg",
  "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM__1__IrwwDBdiP.jpeg",
  "https://ik.imagekit.io/m1ke1magek1t/default_image/WhatsApp_Image_2020-02-26_at_5.42.11_PM_QsD9fMMl-.jpeg"
]

function defaultImage() {
  return randomImage[Math.floor(Math.random() * randomImage.length)]
}

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
    default: defaultImage()
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

  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }],

  language: {
    type: String,
    required: true,
    default: 'en'
  },

  sessionToken: {
    type: String,
    required: false
  },

  sessionTokenExpires: {
    type: Date,
    required: false
  }
}, {
  versionKey: false,
  timestamps: true,
}
)

class User extends mongoose.model('User', userSchema) {

  static generateSessionToken(id) {
    var sessionToken = crypto.randomBytes(20).toString('hex');
    var sessionTokenExpires = Date.now() + 86400000; // 1 dayexpired

    let properties = {
      sessionToken: sessionToken,
      sessionTokenExpires: sessionTokenExpires
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

  static register(data, req) {
    return new Promise((resolve, reject) => {

      if (data.password !== data.password_confirmation) return reject('Password and Password Confirmation doesn\'t match')

      let encrypted_password = bcrypt.hashSync(data.password, 10)

      this.create({
        fullname: data.fullname,
        email: data.email,
        encrypted_password: encrypted_password
      })
        .then(async data => {
          let token = jwt.sign({ _id: data._id, role: data.role, verified: data.verified }, process.env.JWT_SIGNATURE_KEY)

          await this.generateSessionToken(data._id)

            .then(user => {

              let link = "http://" + req.headers.host + "/api/v1/verified/" + user.sessionToken;

              const mailOptions = {
                to: data.email,
                from: process.env.FROM_EMAIL,
                subject: "Verify your account",
                text: `Hi ${data.fullname} \n 
                                    Please click on the following link below to verify your account.
                                    if you did not request this, you can't change any information in your profile and give a review or even rating.
                                    the link will be valid for 1 day
                                    Regards How Movie Team
                                    ${link}
                                    `
              };

              mailer.send(mailOptions, (error) => {
                if (error) return reject({ message: error.message });

                // resolve({ message: 'A reset email has been sent to ' + data.email + ', please check your email.' });
              });

              resolve([
                {
                  message: 'A reset email has been sent to ' + data.email + ', please check your email.'
                },
                {
                  id: data._id,
                  fullname: data.fullname,
                  email: data.email,
                  language: data.language,
                  verified: data.verified,
                  image: data.image,
                  token: token
                }
              ])
            })
            .catch(err => {
              reject(err)
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

  static async dataUpdate(user, req) {

    let params = {
      fullname: req.body.fullname,
      language: req.body.language
    }

    for (let prop in params) if (!params[prop]) delete params[prop];

    if (req.file) {
      let url = await imagekit.upload({ file: req.file.buffer.toString('base64'), fileName: `IMG-${Date.now()}` })
      params.image = url.url
    } else {
      params.image = defaultImage();
    }

    return new Promise((resolve, reject) => {
      if (user.verified === false) return reject('Please verified your account first before change your profile')

      this.findByIdAndUpdate(user._id, params, { new: true })
        .then(data => {
          resolve(data)
          // .select('-encrypted_password')
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  // static OAuthGoogle(token) {

  //     return new Promise((resolve, reject) => {
  //         axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
  //             headers: {
  //                 'Authorization': token
  //             }
  //         })
  //             .then(data => {
  //                 // console.log(data)
  //                 resolve(data)
  //             })
  //             .catch(err => {
  //                 reject(err)
  //             })
  //     })
  // }

  // static findOrRegister(result) {
  //     return new Promise((resolve, reject) => {
  //         this.findOne({ email: result.data.email })
  //             .then(data => {
  //                 if (!data) {
  //                     this.collection.insert({
  //                         fullname: result.data.name,
  //                         email: result.data.email,
  //                         image: result.data.picture,
  //                         language: process.env.language
  //                     })
  //                         .then(user => {
  //                             let newUser = user.ops[0]

  //                             let token = jwt.sign({ _id: newUser._id }, process.env.JWT_SIGNATURE_KEY)

  //                             return resolve({
  //                                 _id: newUser._id,
  //                                 fullname: newUser.fullname,
  //                                 image: newUser.image,
  //                                 email: newUser.email,
  //                                 token: token
  //                             })
  //                         })
  //                 } else {
  //                     let token = jwt.sign({ _id: data._id }, process.env.JWT_SIGNATURE_KEY)

  //                     return resolve({
  //                         _id: data._id,
  //                         fullname: data.fullname,
  //                         image: data.image,
  //                         email: data.email,
  //                         token: token
  //                     })
  //                 }
  //             })
  //             .catch(err => {
  //                 reject(err)
  //             })
  //     })
  // }

  static recover(req) {
    return new Promise((resolve, reject) => {
      this.findOne({ email: req.body.email })
        .then(async user => {
          if (!user) return reject({ message: 'The email address ' + req.body.email + ' is not associated with any account. Double-check your email address and try again.' });
          //Generate and set password reset token
          await this.generateSessionToken(user._id)
            .then(user => {
              // send email
              let link = "http://" + req.headers.host + "/api/v1/reset/" + user.sessionToken;
              const mailOptions = {
                to: user.email,
                from: process.env.FROM_EMAIL,
                subject: "Password change request",
                text: `Hi ${user.fullname} \n 
                      Please click on the following link below to reset your account password.
                      the link will be valid for 1 day
                      Regards How Movie Team
                      ${link}
                      `
              };

              mailer.send(mailOptions, (error) => {
                if (error) return reject({ message: error.message });

                resolve({ message: 'A reset email has been sent to ' + user.email + ', please check your email.' });
              });
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    })
  }

  static reset(req) {
    return new Promise((resolve, reject) => {
      this.findOne({ sessionToken: req.params.token, sessionTokenExpires: { $gt: Date.now() } })
        .then(user => {
          if (!user) return reject('expiredToken');
          //Redirect user to form with the email address
          return resolve(user)
        })
        .catch(err => reject({ message: err.message }));
    })
  }

  static resetPassword(req) {
    return new Promise((resolve, reject) => {
      this.findOne({ sessionToken: req.params.token })
        .then(async user => {
          if (!user) return reject('Password reset token is invalid or has expired.');

          //Set the new password
          user.encrypted_password = await bcrypt.hashSync(req.body.password, 10);
          user.sessionToken = undefined;
          user.sessionTokenExpires = undefined;

          // Save
          user.save((err) => {

            if (err !== null) return reject('Error brooo');

            // send email
            const mailOptions = {
              to: user.email,
              from: process.env.FROM_EMAIL,
              subject: "Your password has been changed",
              text: `Hi ${user.fullname} \n 
                    his is a confirmation that the password for your account ${user.email} has just been changed.\n`
            };

            mailer.send(mailOptions, (error) => {
              if (error) return reject({ message: error.message });

              return resolve(user)
            });
          });
        });
    })
  }

  static verifyEmail(req) {
    return new Promise((resolve, reject) => {
      console.log(req.params.token);
      User.findOne({ sessionToken: req.params.token, sessionTokenExpires: { $gt: Date.now() } })
        .then(user => {
          console.log('USER: ', user);
          if (!user) return reject('expiredToken');

          user.verified = true;
          user.sessionToken = undefined;
          user.sessionTokenExpires = undefined;

          user.save(err => {
            if (err !== null) return reject(err);
            return resolve('Your account has been verified!')
          })
        })
        .catch(err => reject({ message: err.message }));
    })
  }

  static resendEmail(req) {
    return new Promise((resolve, reject) => {

      this.findById(req.user._id)

        .then(async data => {

          if (!data) return reject('your email doesn\'t exist in our database')

          this.generateSessionToken(req.user._id)

            .then(user => {

              let link = "http://" + req.headers.host + "/api/v1/verified/" + user.sessionToken;

              const mailOptions = {
                to: data.email,
                from: process.env.FROM_EMAIL,
                subject: "Verify your account",
                text: `Hi ${data.fullname} \n 
                      Please click on the following link below to verify your account.
                      If you did not request this, you can't change any information in your profile and give a review or even rating.\n
                      the link will be valid for 1 day
                      Regards How Movie Team
                      ${link}
                      `
              };

              mailer.send(mailOptions, (error) => {

                if (error) return reject({ message: error.message });

              });

              resolve({

                message: 'verification email has been sent to ' + data.email + ', please check your email.'

              })
            })
        })
    })
  }

}

module.exports = User;