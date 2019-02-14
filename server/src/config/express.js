const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('../api/routes/index');
const { logs } = require('./vars');
const error = require('../api/middlewares/error');

const app = express();

app.use(morgan(logs));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// enable CORS - Cross Origin Resource Sharing
app.use(cors());
// mount api v1 routes
app.use('/api', routes);
app.use(error.converter);
// catch 404 and forward to error handler
app.use(error.notFound);
// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;
