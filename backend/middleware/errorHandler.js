// Centralized error handler to ensure friendly messages and no exposed raw stack traces
const errorHandler = (err, req, res, next) => {
  console.error('Server error intercepted:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation error occurred.',
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `An account with that ${field} already exists.`,
    });
  }

  // CastError (invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID provided.',
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server. Please try again.',
  });
};

module.exports = { errorHandler };
