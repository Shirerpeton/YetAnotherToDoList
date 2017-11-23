var express = require('express');
var router = express.Router();
var Request = require('tedious').Request;
var bcrypt = require('../bin/bcryptPromise.js');
var sql = require('mssql');
var db = require('../bin/db.js');

router.get('/', function(req, res, next) {
	if (req.session.user === undefined)
		res.render('signup', { title: 'Sign-Up', profile: null, signUp: true });
	else
		res.redirect('/');
});


router.get('/info', (req, res, next) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			pool.request().query('select * from users', (err, result) => {
				if (err) throw err;
				console.log(result.recordset);
			});
		});
});

router.post('/', async (req, res, next) => {
	try {
		const login = req.body.username;
		const password = req.body.password;
		const repPassword = req.body.repPassword;
		if (login.length > 20)
			res.json({ username: 'long', password: false });
		else
		{
			let pool = new sql.ConnectionPool(db.config);
			await pool.connect();
			let result = await pool.request()
			.input('login', sql.VarChar(20), login)
			.query('select * from users where username = @login');
			pool.close();
			if (result.recordset.length !== 0)
				res.json({username: false, password: false});
			else if (password.length < 6)
				res.json({username: true, password: "short"});
			else if (password.length > 20)
				res.json({username: true, password: "long"});
			else if (password !== repPassword)
				res.json({username: true, password: "diff"});
			else
			{
				const hash = await bcrypt.promiseHash(password);
				pool = new sql.ConnectionPool(db.config);
				await pool.connect();
				await pool.request()
				.input('login', sql.VarChar(20), login)
				.input('pswHash', sql.VarChar(60), hash)
				.input('regDate', sql.Date, new Date().toISOString().slice(0, 19).replace('T', ' '))
				.query('insert into users (username, passwordHash, registration) values (@login, @pswHash, @regDate)');
				pool.close();
				res.json({username: true, password: true});				
			}
		}
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
