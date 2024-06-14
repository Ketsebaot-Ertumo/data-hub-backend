const ErrorResponse = require('../utilis/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    if (err.name === "CastError") {
        const message = `Resourse Not Found ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    if (err.code === 11000) {
        const message = "Duplicate field value entered";
        error = new ErrorResponse(message, 400);
    }

    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(val => ' ' + val.message);
        error = new ErrorResponse(message, 401);
    }
    res.status(error.codeStatus || 500).json({
        success: false,
        error: error.message || "server error"
    })
}

module.exports = errorHandler;