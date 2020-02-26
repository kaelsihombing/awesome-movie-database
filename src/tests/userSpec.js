const chai = require('chai')
const chaiHttp = require('chai-http')
const {
    expect
} = chai
chai.use(chaiHttp)
const server = require('../server.js/index.js')

const User = require('../models/user')
const userFixtures = require('../fixtures/userFixture.js')
const firstSample = userFixtures.create()

describe('USER API TESTING', () => {
    before(function () {
        User.deleteMany({}, () => { })
        firstSample.password_confirmation = firstSample.password
        User.register(firstSample)
    })

    after(function () {
        User.deleteMany({}, () => { })
    })

    context('POST /api/v1/users', () => {
        it('Should create new user', () => {
            let userSample = userFixtures.create()
            userSample.password_confirmation = userSample.password
            chai.request(server)
                .post('/api/v1/users')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(userSample))
                .end((err, res) => {
                    expect(res.status).to.equal(201)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property('success')
                    expect(res.body).to.have.property('data')
                    let { success, data } = res.body
                    expect(success).to.eq(true)
                    // expect(data).to.be.an('object');
                    // expect(data).to.have.property('id')
                    // expect(data).to.have.property('fullname')
                    // expect(data).to.have.property('email')

                })
        })
    })
})