const TestSequencer = require('@jest/test-sequencer').default
const path = require('path')

class CustomSequencer extends TestSequencer {
  sort (tests) {
    const user = path.join(__dirname, '/user.spec.js')
    const movie = path.join(__dirname, '/movie.spec.js')
    const review = path.join(__dirname, '/review.spec.js')
    const orderPath = [user, review]

    return tests.sort((testA, testB) => {
      const indexA = orderPath.indexOf(testA.path)
      const indexB = orderPath.indexOf(testB.path)

      if (indexA === indexB) return 0 // do not swap when tests both not specify in order.

      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA < indexB ? -1 : 1
    })
  }
}

module.exports = CustomSequencer
