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
		let result = await db.getUserByUsername(login);
		if (result)
			res.json({error: "That username is already taken!"});
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
			res.json({error: null});				
		}
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
