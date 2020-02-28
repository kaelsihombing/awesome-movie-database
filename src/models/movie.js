const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const axios = require('axios');
const mongoosePaginate = require('mongoose-paginate-v2');

let Incumbent = require('./incumbent.js')

const movieSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  duration: {
    type: String
  },
  genres: [{
    type: String
    // type: Schema.Types.ObjectId,
    // ref: 'Incumbent',
  }],
  directors: [{
    type: String
    // type: Schema.Types.ObjectId,
    // ref: 'Incumbent',
  }],
  writers: [{
    type: String
    // type: Schema.Types.ObjectId,
    // ref: 'Incumbent',
  }],
  casts: [{
    type: String
    // type: Schema.Types.ObjectId,
    // ref: 'Incumbent',
  }],
  synopsis: {
    type: String,
    default: '-'
  },
  poster: {
    type: String,
    default: '-'
  },
  trailer: {
    type: String,
    default: '-'
  },
  review: [{
    type: Schema.Types.ObjectId,
    ref: 'Review',
  }],
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
},
  {
    versionKey: false,
    timestamps: true,
  }
)

movieSchema.plugin(mongoosePaginate)

class Movie extends mongoose.model('Movie', movieSchema) {
  static register(creator, role, bodyParams) {
    return new Promise((resolve, reject) => {
      if (role != 'ADMIN') return reject("You're not allowed to add movie entry")

      let params = {
        title: bodyParams.title,
        year: bodyParams.year,
        synopsis: bodyParams.synopsis,
        genres:  bodyParams.genre,
        casts: bodyParams.casts,
        directors: bodyParams.directors,
        writers: bodyParams.writers,
        poster: bodyParams.poster,
        trailer: bodyParams.trailer,
        addedBy: creator,
        lastUpdatedBy: creator,
      }
      for (let prop in params) if (!params[prop]) delete params[prop]

      this.create(params)
        .then(data => {
          resolve(data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }


  static show(pagination, page, movieId) {
    return new Promise((resolve, reject) => {
      let options = {
        page: page,
        limit: 10,
        pagination: JSON.parse(pagination),
        sort: '-updatedAt',
        collation: { locale: 'en' }
      }

      if (movieId) {
        this.findById(movieId)
          .then(data => {
            resolve(data)
          })
          .catch(err => {
            reject(err)
          })
      }

      else if (!movieId) {
        this.find({})
          .then(data => {
            let lastPage = Math.ceil(data.length / 10)
            if (lastPage == 0) lastPage = 1
            if (options.page > lastPage || options.page < 0) options.page = 1

            this.paginate({}, options)
              .then(data => {
                resolve(data)
              })
          })
      }
    })
  }

  static update(movieId, editor, role, bodyParams) {
    return new Promise((resolve, reject) => {
      if (role != 'ADMIN') return reject("You're not allowed to edit movie information")

      let params = {
        title: bodyParams.title,
        year: bodyParams.year,
        synopsis: bodyParams.synopsis,
        lastUpdatedBy: editor,
      }
      for (let prop in params) if (!params[prop]) delete params[prop]

      this.findByIdAndUpdate(movieId, params, { new: true })
        .then(data => {
          resolve(data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  static addIncumbent(movieId, editor, role, bodyParams) {
    return new Promise((resolve, reject) => {
      if (role != 'ADMIN') return reject("You're not allowed to edit movie information")

      let movieTitle

      this.findById(movieId)
        .then(movie => {
          if (!movie._id) return reject(`There is no movie with given _id`)
          movieTitle = movie.title
        })

      let pushData

      Incumbent.findOne({ 'name': bodyParams.name })
        .then(incumbent => {
          if (!incumbent) return reject(`There is no incumbent with name '${bodyParams.name}' in the database`)
          pushData = incumbent.name
          incumbent.movie.push(movieTitle)
          incumbent.save()
        })

      this.findById(movieId)
        .then(movie => {
          movie[`${bodyParams.occupation}`].push(pushData)
          movie.save()
          movie.lastUpdatedBy = editor
          resolve(movie)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  static copyMovie(movieId) {
    return new Promise((resolve, reject) => {
      axios.get(`http://www.omdbapi.com/?apikey=4a5e611c&i=` + movieId)
        .then(data => {
          this.findOne({ title: data.data.Title })
            .then(foundData => {

              if (foundData) return reject('Movie already exist in the database!')

              let movieData = data.data;

              let movie = {
                title: movieData.Title,
                year: movieData.Year,
                duration: movieData.Runtime,
                genres: [],
                directors: [],
                writers: [],
                casts: [],
                synopsis: movieData.Plot,
                poster: movieData.Poster,
              }

              var directorSplit = movieData.Director.split(',')
              for (let i = 0; i <= directorSplit.length - 1; i++) {
                movie.directors.push(directorSplit[i])
              }
              var genreSplit = movieData.Genre.split(',')
              console.log('Genre Split', genreSplit)
              for (let i = 0; i <= genreSplit.length - 1; i++) {
                movie.genres.push(genreSplit[i])
              }
              var writerSplit = movieData.Writer.split(',')
              for (let i = 0; i <= writerSplit.length - 1; i++) {
                movie.writers.push(writerSplit[i])
              }
              var castSplit = movieData.Actors.split(',')
              for (let i = 0; i <= castSplit.length - 1; i++) {
                movie.casts.push(castSplit[i])
              }

              this.create(movie).then(data => {
                resolve(data)
              })
            })
        })
        .catch(err => {
          reject(err)
        })
    })
  }
}

module.exports = Movie