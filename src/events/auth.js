const EventEmitter = require('events')
const mailer = require('../helpers/nodeMailer')
const Auth = new EventEmitter()
process.log = {}
process.log.users = {}

//  listener
Auth.on('unauthorized', ({ _id, email, source }) => {
  console.log('It\'s running')
  if (!process.log.users[_id]) {
    process.log.users[_id] = {
      email,
      source,
      loginCount: 1
    } 
    return
  }
    
  process.log.users[_id].loginCount++

  if (process.log.users[_id].loginCount > 5) {
    mailer.send({
        to: email,
        from: process.env.FROM_EMAIL,
        subject: "Allert!",
        text: `Hi,\n
        Someone is trying to login into your account! \n\n`
    })
    return
  }
})

Auth.on('authorized', _id => {
  delete process.log.users[_id] 
})

module.exports = Auth;