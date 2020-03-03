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

const Movie = require('../models/movie.js')
const movieFixtures = require('../fixtures/movieFixture.js')
const staticMovie = movieFixtures.create()

const Incumbent = require('../models/incumbent.js')
const incumbentFixtures = require('../fixtures/incumbentFixture.js')
const staticIncumbent = incumbentFixtures.create()

describe('MOVIE API TESTING', () => {
    before(function () {
        staticAdmin.password_confirmation = staticAdmin.password
        User.registerAdmin(staticAdmin)

        staticUser.password_confirmation = staticUser.password
        chai.request(server)
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .end((err, res) => { })

        chai.request(server)
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .end((err, res) => {
                let token = res.body.data.token
                chai.request(server)
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticMovie))
                    .end(() => { })
            })

        chai.request(server)
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .end((err, res) => {
                let token = res.body.data.token
                chai.request(server)
                    .post('/api/v1/incumbents')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticIncumbent))
                    .end((err, res) => { })
            })
    })

    context('POST /api/v1/movies', () => {
        it('Should add new movie', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    let movieSample = movieFixtures.create()
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

        it('Should add new movie with only required information', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    let movieSample = movieFixtures.create()
                    delete movieSample.genres
                    delete movieSample.directors
                    delete movieSample.writers
                    delete movieSample.casts
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

        it('Should not add new movie due to missing required information', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    let movieSample = movieFixtures.create()
                    delete movieSample.title
                    delete movieSample.year
                    chai.request(server)
                        .post('/api/v1/movies')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .send(JSON.stringify(movieSample))
                        .end((err, res) => {
                            expect(res.status).to.equal(422)
                            let { success, error } = res.body
                            expect(success).to.eq(false)
                        })
                })
        })

        it('Should not add new movie due to unauthorized user', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    let movieSample = movieFixtures.create()
                    chai.request(server)
                        .post('/api/v1/movies')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .send(JSON.stringify(movieSample))
                        .end((err, res) => {
                            expect(res.status).to.equal(422)
                            let { success, error } = res.body
                            expect(success).to.eq(false)
                            expect(error).to.eq("You're not Authorized!")
                        })
                })
        })
    })

    context('GET /api/v1/movies/all', () => {
        it('Should show page 1 of all movies', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = Math.ceil(Math.random() * (lastPage))
                            chai.request(server)
                                .get('/api/v1/movies/all')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ page: page })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object');
                                })
                        })
                })
        })

        it('Should show page 1 of all movies due to invalid positive page number', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = lastPage + 1
                            chai.request(server)
                                .get('/api/v1/movies/all')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ page: page })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object');
                                })
                        })
                })
        })
    })

    context('GET /api/v1/movies', () => {
        it('Should show specific movies', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i]._id
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = Math.ceil(Math.random() * (lastPage))
                            chai.request(server)
                                .get('/api/v1/movies')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ page: page, movieId: movieId })
                                .end((err, res) => {
                                    expect(res.status).to.equal(200)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object');
                                })
                        })
                })
        })

        it('Should not show specific movies due to invalid movieId', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let movieId = 'randomId'
                            let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                            let page = Math.ceil(Math.random() * (lastPage))
                            chai.request(server)
                                .get('/api/v1/movies')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ page: page, movieId: movieId })
                                .end((err, res) => {
                                    expect(res.status).to.equal(422)
                                    let { success, error } = res.body
                                    expect(success).to.eq(false)
                                    expect(error.message).to.eq('Cast to ObjectId failed for value "randomId" at path "_id" for model "Movie"')
                                })
                        })
                })
        })
    })

    context('PUT /api/v1/movies', () => {
        it('Should update movie information', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i]._id
                            let update = movieFixtures.create()
                            delete update.year
                            chai.request(server)
                                .put('/api/v1/movies')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ movieId: movieId })
                                .send(JSON.stringify(update))
                                .end((err, res) => {
                                    expect(res.status).to.equal(201)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object');
                                })
                        })
                })
        })

        it('Should not update movie information due to lack of authority', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i]._id
                            let update = movieFixtures.create()
                            delete update.year
                            chai.request(server)
                                .put('/api/v1/movies')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ movieId: movieId })
                                .send(JSON.stringify(update))
                                .end((err, res) => {
                                    expect(res.status).to.equal(422)
                                    let { success, error } = res.body
                                    expect(success).to.eq(false)
                                    expect(error).to.eq("You're not allowed to edit movie information")
                                })
                        })

                })
        })


        it('Should not update movie information due to invalid movieId', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let movieId = 'randomId'
                            let update = movieFixtures.create()
                            delete update.year
                            chai.request(server)
                                .put('/api/v1/movies')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ movieId: movieId })
                                .send(JSON.stringify(update))
                                .end((err, res) => {
                                    expect(res.status).to.equal(422)
                                    let { success, data } = res.body
                                    expect(success).to.eq(false)
                                })
                        })

                })
        })
    })

    context('PUT /api/v1/movies/incumbent', () => {
        it('Should add movie incumbent (casts/writers/directors)', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticAdmin))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i]._id
                            let occupationEnum = ['casts', 'directors', 'writers']
                            let occupation = occupationEnum[Math.floor(Math.random() * occupationEnum.length)]
                            let incumbent = {
                                name: staticIncumbent.name,
                                occupation: occupation
                            }
                            chai.request(server)
                                .put('/api/v1/movies/incumbent')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ movieId: movieId })
                                .send(JSON.stringify(incumbent))
                                .end((err, res) => {
                                    expect(res.status).to.equal(201)
                                    let { success, data } = res.body
                                    expect(success).to.eq(true)
                                    expect(data).to.be.an('object');
                                })
                        })
                })
        })

        it('Should not add movie incumbent (casts/writers/directors) due to lack of authority', () => {
            chai.request(server)
                .post('/api/v1/auth')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(staticUser))
                .end((err, res) => {
                    let token = res.body.data.token
                    chai.request(server)
                        .get('/api/v1/movies/all')
                        .set('Content-Type', 'application/json')
                        .set('Authorization', token)
                        .query({ pagination: false })
                        .end((err, res) => {
                            let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                            let movieId = res.body.data.docs[i]._id
                            let occupationEnum = ['casts', 'directors', 'writers']
                            let occupation = occupationEnum[Math.floor(Math.random() * occupationEnum.length)]
                            let incumbent = {
                                name: staticIncumbent.name,
                                occupation: occupation
                            }
                            chai.request(server)
                                .put('/api/v1/movies/incumbent')
                                .set('Content-Type', 'application/json')
                                .set('Authorization', token)
                                .query({ movieId: movieId })
                                .send(JSON.stringify(incumbent))
                                .end((err, res) => {
                                    expect(res.status).to.equal(422)
                                    let { success, error } = res.body
                                    expect(success).to.eq(false)
                                    expect(error).to.eq("You're not allowed to edit movie information");
                                })
                        })

                })
        })

        // it('Should not add movie incumbent (casts/writers/directors) due to invalid movieId', () => {
        //     chai.request(server)
        //         .post('/api/v1/auth')
        //         .set('Content-Type', 'application/json')
        //         .send(JSON.stringify(staticAdmin))
        //         .end((err, res) => {
        //             let token = res.body.data.token
        //             chai.request(server)
        //                 .get('/api/v1/movies/all')
        //                 .set('Content-Type', 'application/json')
        //                 .set('Authorization', token)
        //                 .query({ pagination: false })
        //                 .end((err, res) => {
        //                     let movieId = 'movieId'
        //                     let occupationEnum = ['casts', 'directors', 'writers']
        //                     let occupation = occupationEnum[Math.floor(Math.random() * occupationEnum.length)]
        //                     let incumbent = {
        //                         name: staticIncumbent.name,
        //                         occupation: occupation
        //                     }
        //                     chai.request(server)
        //                         .put('/api/v1/movies/incumbent')
        //                         .set('Content-Type', 'application/json')
        //                         .set('Authorization', token)
        //                         .query({ movieId: movieId })
        //                         .send(JSON.stringify(incumbent))
        //                         .end((err, res) => {
        //                             expect(res.status).to.equal(422)
        //                             let { success, error } = res.body
        //                             expect(success).to.eq(false)
        //                             expect(error.message).to.eq('Cast to ObjectId failed for value "movieId" at path "_id" for model "Movie"')
        //                         })
        //                 })

        //         })
        // })

        // it('Should not add movie incumbent (casts/writers/directors) due to duplicate incumbent in same occupation', () => {
        //     chai.request(server)
        //         .post('/api/v1/auth')
        //         .set('Content-Type', 'application/json')
        //         .send(JSON.stringify(staticAdmin))
        //         .end((err, res) => {
        //             let token = res.body.data.token
        //             chai.request(server)
        //                 .get('/api/v1/movies/all')
        //                 .set('Content-Type', 'application/json')
        //                 .set('Authorization', token)
        //                 .query({ pagination: false })
        //                 .end((err, res) => {
        //                     let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
        //                     let movieId = res.body.data.docs[i]._id
        //                     let occupationEnum = ['casts', 'directors', 'writers']
        //                     let occupation = occupationEnum[Math.floor(Math.random() * occupationEnum.length)]
        //                     let incumbent = {
        //                         name: staticIncumbent.name,
        //                         occupation: occupation
        //                     }
        //                     chai.request(server)
        //                         .put('/api/v1/movies/incumbent')
        //                         .set('Content-Type', 'application/json')
        //                         .set('Authorization', token)
        //                         .query({ movieId: movieId })
        //                         .send(JSON.stringify(incumbent))
        //                         .end((err, res) => {
        //                             chai.request(server)
        //                                 .put('/api/v1/movies/incumbent')
        //                                 .set('Content-Type', 'application/json')
        //                                 .set('Authorization', token)
        //                                 .query({ movieId: movieId })
        //                                 .send(JSON.stringify(incumbent))
        //                                 .end((err, res) => {
        //                                     expect(res.status).to.equal(422)
        //                                     let { success, error } = res.body
        //                                     expect(success).to.eq(false)
        //                                 })
        //                         })
        //                 })

        //         })
        // })
    })
})