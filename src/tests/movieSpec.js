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

const Movie = require('../models/movie.js')
const movieFixtures = require('../fixtures/movieFixture.js')
const staticMovie = movieFixtures.create()

describe('MOVIE API TESTING', () => {
    before(function () {
        staticUser.password_confirmation = staticUser.password
        User.registerAdmin(staticUser)
    })

    context('POST /api/v1/movies', () => {
        it('Should add new movie', () => {
            let movieSample = movieFixtures.create()
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token                  
                    chai.request(server)
                        .post('/api/v1/movies')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .send(JSON.stringify(movieSample))
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