const createError = require('http-errors');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'))

// Create 404 not found error for wrong route paths.
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500).send({ message: err.message });
});

module.exports = app;
