var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')

// ================ validasi flash ================
var flash = require('connect-flash');

// ================ File Upload ================
const fileUpload = require('express-fileupload');

//models engine setup
const { Pool, Client } = require('pg')
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pms',
  password: 'janibahri31',
  port: 5432,
})

var indexRouter = require('./routes/index')(pool);
var profileRouter = require('./routes/profile')(pool);
var membersRouter = require('./routes/members')(pool);
var projectRouter = require('./routes/projects')(pool);
var usersRouter = require('./routes/users')(pool);

var bodyParser = require('body-parser')

var app = express();

var sess = {
  secret: 'keyboard cat',
  cookie: {},
  resave: false,
  saveUninitialized: true
}

app.use(flash());

app.use(bodyParser.json())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'keyboard cat',
  cookie: {},
  resave: true,
  saveUninitialized: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(fileUpload());


app.use('/', indexRouter);
app.use('/projects', projectRouter);
app.use('/profile', profileRouter);
app.use('/members', membersRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
