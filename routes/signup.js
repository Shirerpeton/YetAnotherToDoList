var express = require('express');
var router = express.Router();
var Request = require('tedious').Request;
var bcrypt = require('bcrypt');
var sql = require('mssql');
var config = require('../bin/db.js');

const saltRounds = 10;

router.get('/', function(req, res, next) {
	if (req.session.user === undefined)
		res.render('signup', { profile: null, signUp: true });
	else
		res.redirect('/');
});

router.get('/info', (req, res, next) => {
	const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			pool.request().query('select * from users', (err, result) => {
				if (err) throw err;
				console.log(result.recordset);
			});
		});
});

router.post('/', function(req, res, next){
	var login = req.body.username;
	var password = req.body.password;
	var repPassword = req.body.repPassword;
	if (login.length > 20)
		res.json({ username: 'long', password: false });
	else
	{
		const pool = new sql.ConnectionPool(config);
		pool.connect(err =>
		{
			if (err) throw err;
			const ps = new sql.PreparedStatement(pool);
			ps.input('login', sql.VarChar(20));
			ps.prepare('select * from users where username = @login', err => {
				if (err) throw err;
				ps.execute({ login: login }, (err, result) => {
					if (err) throw err;
					ps.unprepare(err => {
						console.log(password.length);
						if (err) throw err;
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
							bcrypt.hash(password, saltRounds, function(err, hash) {
								if (err) throw err;
								const ps = new sql.PreparedStatement(pool);
								ps.input('login', sql.VarChar(20));
								ps.input('pswHash', sql.VarChar(60));
								ps.input('regDate', sql.Date);
								ps.prepare('insert into users (username, passwordHash, registration) values (@login, @pswHash, @regDate)', err => {
									if (err) throw err;
									ps.execute({ login: login, pswHash: hash, regDate: new Date().toISOString().slice(0, 19).replace('T', ' ') }, err => {
										if (err) throw err;
										res.json({username: true, password: true});
										ps.unprepare(err => {
											if (err) throw err;
										});
									});
								});
							});
						}
					});
				});
			});
		});
	}
});

module.exports = router;
