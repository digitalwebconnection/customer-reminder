export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
