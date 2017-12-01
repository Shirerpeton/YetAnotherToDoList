const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const db = require('./bin/db.js');
const session = require('express-session');
const index = require('./routes/index');
const logout = require('./routes/logout');
const users = require('./routes/users');
const changePassword = require('./routes/change-password');
const signIn = require('./routes/signin');
const signUp = require('./routes/signup');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

app.use(session({
    secret: 'someSecret',
    resave: true,
    saveUninitialized: true,
	//cookie: { secure: true }
}));

app.use('/users/sign-in', signIn);
app.use('/users/sign-up', signUp);
app.use('/change-password', changePassword);
app.use('/users', users);
app.use('/', index);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');//{ profile: req.session.user });
});

module.exports = app;