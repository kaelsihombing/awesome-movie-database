const chai = require('chai')
const chaiHttp = require('chai-http')
const {
    expect
} = chai
chai.use(chaiHttp)
const server = require('../index')

const User = require('../models/user')
const userFixtures = require('../fixtures/userFixtures.js')
const userSample = userFixtures.create()