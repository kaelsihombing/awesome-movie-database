const chai = require('chai')
const chaiHttp = require('chai-http')
const {
    expect
} = chai
chai.use(chaiHttp)
const server = require('../server.js')

const User = require('../models/user.js')
const userFixtures = require('../fixtures/userFixture.js')
const staticUser = userFixtures.create()
const staticAdmin = userFixtures.create()

const Incumbent = require('../models/incumbent.js')
const incumbentFixtures = require('../fixtures/incumbentFixture.js')
const staticIncumbent = incumbentFixtures.create()

const Movie = require('../models/movie.js')

const Review = require('../models/review.js')

describe('INCUMBENT API TESTING', () => {
    before(function () {
        staticAdmin.password_confirmation = staticAdmin.password
        User.registerAdmin(staticAdmin)
    })

    context('POST /api/v1/incumbents', () => {
        it('Should add new incumbent to collection', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    let incumbentSample = incumbentFixtures.create()
                    chai.request(server)
                        .post('/api/v1/incumbents')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .send(JSON.stringify(incumbentSample))
                        .end((err, res) => {
                            expect(res.status).to.equal(201)
                            let { success, data } = res.body
                            expect(success).to.eq(true)
                            expect(data).to.be.an('object');
                        })
                })
        })
    })
})