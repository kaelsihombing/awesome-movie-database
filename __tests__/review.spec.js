const supertest = require('supertest')
const mongoose = require('mongoose')
require('dotenv').config()

const server = require('../src/server.js')
const request = supertest(server)

const User = require('../src/models/user.js')
const userFixtures = require('../src/fixtures/userFixture.js')
const staticUser = userFixtures.create()
const staticUser2 = userFixtures.create()
const staticAdmin = userFixtures.create()

const Movie = require('../src/models/movie.js')
const movieFixtures = require('../src/fixtures/movieFixture.js')
const staticMovie = movieFixtures.create()
const staticMovie2 = movieFixtures.create()

const Review = require('../src/models/review.js')
const reviewFixtures = require('../src/fixtures/reviewFixture.js')
const staticReview = reviewFixtures.create()

async function removeAllCollections() {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName]
        await collection.deleteMany()
    }
}

async function dropAllCollections() {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName]
        try {
            await collection.drop()
        } catch (error) {
            // Sometimes this error happens, but you can safely ignore it
            if (error.message === 'ns not found') return
            // This error occurs when you use it.todo. You can
            // safely ignore this error too
            if (error.message.includes('a background operation is currently running')) return
            console.log(error.message)
        }
    }
}

beforeAll(async (done) => {
    mongoose
        .connect(process.env.DB_CONNECTION_TEST, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        .then(() => {
            console.log('connected')
        })
        .catch(err => console.error(err))
    await removeAllCollections()

    done()
})

afterAll(async (done) => {
    await dropAllCollections()
    await mongoose.connection.close()
    done()
})

describe('Create admin', () => {
    it('Should create a new admin', async done => {
        staticAdmin.password_confirmation = staticAdmin.password
        request
            .post('/api/v1/admins')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})

describe('Create user', () => {
    it('Should create a new user', async done => {
        staticUser.password_confirmation = staticUser.password
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})

describe('Create 2nd user', () => {
    it('Should create a new user (2nd)', async done => {
        staticUser2.password_confirmation = staticUser2.password
        request
            .post('/api/v1/users')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser2))
            .then(res => {
                let { success, data } = res.body
                expect(success).toBe(true)
                done()
            })
    })
})

describe('Login admin and create movie', () => {
    it('Should login admin and successfully create movie', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send({ email: staticAdmin.email, password: staticAdmin.password })
            .then(res => {
                let token = res.body.data.token
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(staticMovie))
                    .then(res => {
                        let { success, data } = res.body
                        expect(success).toBe(true)
                        done()
                    })
            })
    })
})

describe('POST /api/v1/reviews', () => {
    it('Should create a new review', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i]._id
                        let reviewSample = reviewFixtures.create()
                        request
                            .post('/api/v1/reviews')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .send(JSON.stringify(reviewSample))
                            .then(res => {
                                expect(res.status).toBe(201)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not add new review due previously created preview', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticAdmin))
            .then(res => {
                let token = res.body.data.token
                let movieSample = movieFixtures.create()
                request
                    .post('/api/v1/movies')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', token)
                    .send(JSON.stringify(movieSample))
                    .then(res => {
                        let movieId = res.body.data._id
                        request
                            .post('/api/v1/auth')
                            .set('Content-Type', 'application/json')
                            .send(JSON.stringify(staticUser))
                            .then(res => {
                                token = res.body.data.token
                                request
                                    .post('/api/v1/reviews')
                                    .set('Content-Type', 'application/json')
                                    .set('Authorization', token)
                                    .query({ movieId: movieId })
                                    .send(JSON.stringify(staticReview))
                                    .then(res => {
                                        request
                                            .post('/api/v1/reviews')
                                            .set('Content-Type', 'application/json')
                                            .set('Authorization', token)
                                            .query({ movieId: movieId })
                                            .send(JSON.stringify(staticReview))
                                            .then(res => {
                                                expect(res.status).toBe(422)
                                                let { success, error } = res.body
                                                expect(success).toBe(false)
                                                done()
                                            })
                                    })
                            })
                    })
            })
    })

    it('Should not create a new review due to invalid movieId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let movieId = 'movieId'
                        let reviewSample = reviewFixtures.create()
                        request
                            .post('/api/v1/reviews')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ movieId: movieId })
                            .send(JSON.stringify(reviewSample))
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, data } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    })
})

describe('GET /api/v1/reviews', () => {
    it('Should show all review from one specific user', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                        let page = Math.ceil(Math.random() * (lastPage))
                        request
                            .get('/api/v1/reviews')
                            .set('Authorization', token)
                            .query({ page: page })
                            .then(res => {
                                expect(res.status).toBe(200)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should show first page of all review from one specific user due to invalid page', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                        let page = lastPage + 1
                        request
                            .get('/api/v1/reviews')
                            .set('Authorization', token)
                            .query({ page: page })
                            .then(res => {
                                expect(res.status).toBe(200)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })
})

describe('GET /api/v1/reviews/movie', () => {
    it('Should show all review from one specific movie', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i].movieId
                        let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                        let page = Math.ceil(Math.random() * (lastPage))
                        request
                            .get('/api/v1/reviews/movie')
                            .set('Authorization', token)
                            .query({ movieId: movieId, page: page })
                            .then(res => {
                                expect(res.status).toBe(200)
                                let { success, error } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should show first page of all review from one specific movie', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let movieId = res.body.data.docs[i].movieId
                        let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                        let page = lastPage + 1
                        request
                            .get('/api/v1/reviews/movie')
                            .set('Authorization', token)
                            .query({ movieId: movieId, page: page })
                            .then(res => {
                                expect(res.status).toBe(200)
                                let { success, error } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not show all review from one specific movie due to invalid movieId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/movies/all')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let movieId = 'movieId'
                        let lastPage = Math.ceil(res.body.data.totalDocs / 10)
                        let page = Math.ceil(Math.random() * (lastPage))
                        request
                            .get('/api/v1/reviews/movie')
                            .set('Authorization', token)
                            .query({ movieId: movieId, page: page })
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, error } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    })
})

describe('PUT /api/v1/reviews', () => {
    it('Should update a review from a user', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let reviewId = res.body.data.docs[i]._id
                        let reviewSample = reviewFixtures.create()
                        delete reviewSample.rating
                        request
                            .put('/api/v1/reviews')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ reviewId: reviewId })
                            .send(JSON.stringify(reviewSample))
                            .then(res => {
                                expect(res.status).toBe(201)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not update a review due to invalid reviewId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let reviewId = 'reviewId'
                        let reviewSample = reviewFixtures.create()
                        delete reviewSample.rating
                        request
                            .put('/api/v1/reviews')
                            .set('Content-Type', 'application/json')
                            .set('Authorization', token)
                            .query({ reviewId: reviewId })
                            .send(JSON.stringify(reviewSample))
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, data } = res.body
                                expect(success).toBe(false)
                                done()
                            })
                    })
            })
    })
})

describe('DELETE /api/v1/reviews', () => {
    it('Should delete a review and update rating to 0', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let reviewId = res.body.data.docs[i]._id
                        request
                            .delete('/api/v1/reviews')
                            .set('Authorization', token)
                            .query({ reviewId: reviewId })
                            .then(res => {
                                expect(res.status).toBe(200)
                                let { success, data } = res.body
                                expect(success).toBe(true)
                                done()
                            })
                    })
            })
    })

    it('Should not delete a review because the user and author is not matched', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let reviewId = res.body.data.docs[i]._id
                        request
                            .post('/api/v1/auth')
                            .set('Content-Type', 'application/json')
                            .send(JSON.stringify(staticUser2))
                            .then(res => {
                                token = res.body.data.token
                                request
                                    .delete('/api/v1/reviews')
                                    .set('Authorization', token)
                                    .query({ reviewId: reviewId })
                                    .then(res => {
                                        expect(res.status).toBe(422)
                                        let { success, data } = res.body
                                        expect(success).toBe(false)
                                        done()
                                    })
                            })
                    })
            })
    })

    it('Should delete a review and update rating', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let i = Math.floor(Math.random() * (res.body.data.docs.length - 1))
                        let reviewId = res.body.data.docs[i]._id
                        let movieId = res.body.data.docs[i].movieId
                        request
                            .post('/api/v1/auth')
                            .set('Content-Type', 'application/json')
                            .send(JSON.stringify(staticUser2))
                            .then(res => {
                                token = res.body.data.token
                                let reviewSample = reviewFixtures.create()
                                request
                                    .post('/api/v1/reviews')
                                    .set('Content-Type', 'application/json')
                                    .set('Authorization', token)
                                    .query({ movieId: movieId })
                                    .send(JSON.stringify(reviewSample))
                                    .then(res => {
                                        request
                                            .post('/api/v1/auth')
                                            .set('Content-Type', 'application/json')
                                            .send(JSON.stringify(staticUser))
                                            .then(res => {
                                                token = res.body.data.token
                                                request
                                                    .delete('/api/v1/reviews')
                                                    .set('Authorization', token)
                                                    .query({ reviewId: reviewId })
                                                    .then(res => {
                                                        expect(res.status).toBe(200)
                                                        let { success, data } = res.body
                                                        expect(success).toBe(true)
                                                        done()
                                                    })
                                            })
                                    })
                            })
                    })
            })
    })

    it('Should not delete a review because of invalid reviewId', async done => {
        request
            .post('/api/v1/auth')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(staticUser))
            .then(res => {
                let token = res.body.data.token
                request
                    .get('/api/v1/reviews')
                    .set('Authorization', token)
                    .query({ pagination: false })
                    .then(res => {
                        let reviewId = 'reviewId'
                        request
                            .delete('/api/v1/reviews')
                            .set('Authorization', token)
                            .query({ reviewId: reviewId })
                            .then(res => {
                                expect(res.status).toBe(422)
                                let { success, data } = res.body
                                expect(success).toBe(false)
                                done()
                            })

                    })
            })
    })
})