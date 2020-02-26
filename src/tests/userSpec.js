const chai = require('chai')
const chaiHttp = require('chai-http')
const {
    expect
} = chai
chai.use(chaiHttp)
const server = require('../server.js')

const User = require('../models/user.js')
const userFixtures = require('../fixtures/userFixture.js')
const staticSample = userFixtures.create()

const Movie = require('../models/movie.js')

describe('USER API TESTING', () => {
    before(function () {
        staticSample.password_confirmation = staticSample.password
        User.register(staticSample)
    })

    after(function () {
        Movie.deleteMany({}, () => { })
        User.deleteMany({}, () => { })
    })

    context('POST /api/v1/users', () => {
        // it('Should create new user', () => {
            // let userSample = userFixtures.create()
            // userSample.password_confirmation = userSample.password
            // chai.request(server)
            //     .post('/api/v1/users')
            //     .set('Content-Type', 'application/json')
            //     .send(JSON.stringify(userSample))
            //     .end((err, res) => {
            //         // expect(res.status).to.equal(201)
            //         // // expect(res.body).to.be.an('object')
            //         // expect(res.body).to.have.property('success')
            //         // expect(res.body).to.have.property('data')
            //         // let { success, data } = res.body
            //         // expect(success).to.eq(true)
            //         // expect(data).to.be.an('object');
            //         // expect(data).to.have.property('id')
            //         // expect(data).to.have.property('fullname')
            //         // expect(data).to.have.property('email')
            //     })
        // })

        // it('Should not create new user due to duplicate email', () => {
        //     chai.request(server)
        //         .post('/api/v1/users')
        //         .set('Content-Type', 'application/json')
        //         .send(JSON.stringify(staticSample))
        //         .end((err, res) => {
        //             expect(res.status).to.equal(422)
        //             let { success, error } = res.body
        //             expect(success).to.eq(false)
        //         })
        // })
    })

    // context('POST /api/v1/admins', () => {
    //     it('Should create new admin', () => {
    //         let userSample = userFixtures.create()
    //         userSample.password_confirmation = userSample.password
    //         chai.request(server)
    //             .post('/api/v1/admins')
    //             .set('Content-Type', 'application/json')
    //             .send(JSON.stringify(userSample))
    //             .end((err, res) => {
    //                 expect(res.status).to.equal(201)
    //                 expect(res.body).to.be.an('object')
    //                 expect(res.body).to.have.property('success')
    //                 expect(res.body).to.have.property('data')
    //                 let { success, data } = res.body
    //                 expect(success).to.eq(true)
    //                 expect(data).to.be.an('object');
    //                 expect(data).to.have.property('id')
    //                 expect(data).to.have.property('fullname')
    //                 expect(data).to.have.property('email')
    //                 expect(data.role).to.eq('ADMIN')
    //             })
    //     })

    //     it('Should not create new admin due to duplicate email', () => {
    //         chai.request(server)
    //             .post('/api/v1/admins')
    //             .set('Content-Type', 'application/json')
    //             .send(JSON.stringify(staticSample))
    //             .end((err, res) => {
    //                 expect(res.status).to.equal(422)
    //                 let { success, error } = res.body
    //                 expect(success).to.eq(false)
    //             })
    //     })
    // })
})