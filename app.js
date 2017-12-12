const express = require('express')
	, path = require('path')
	, favicon = require('serve-favicon')
	, logger = require('morgan')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser')
	, db = require('./bin/db.js')
	, session = require('express-session')
	, pgSession = require('connect-pg-simple')(session)
	, index = require('./routes/index')
	, logout = require('./routes/logout')
	, users = require('./routes/users')
	, changePassword = require('./routes/change-password')
	, signIn = require('./routes/signin')
	, signUp = require('./routes/signup');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

app.use(session({
	//store: new pgSession({
	//	pool : db.pool
	//}),
    secret: 'someSecret',
    resave: true,
    saveUninitialized: true,
	//cookie: { secure: true }
}));

app.use('/sign-in', signIn);
app.use('/sign-up', signUp);
app.use('/users', users);
app.use('/', index);
app.use('/change-password', changePassword);
app.use('/logout', logout);

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