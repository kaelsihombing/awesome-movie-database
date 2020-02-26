// const translator = require('./helpers/translate').translator

/* istanbul ignore next */
exports.serverError = (err, req, res) => {
	res.status(500).json({
		status: false,
		errors: err
	})
}

/* istanbul ignore next */
exports.notFound = async (err, req, res) => {	
	res.status(404).json({
		status: false,
		errors: err
	})
}