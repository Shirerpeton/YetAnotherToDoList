var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var bcrypt = require('bcrypt');
var sql = require('mssql');
var config = require('../bin/db.js');

const saltRounds = 10;

router.get('/', function(req, res, next) {
	if(req.session.user !== undefined)
		res.redirect('/');
	else
		res.render('signin', { profile: null, signIn: true });
});

router.post('/', function(req, res, next){
	var login = req.body.username;
	var password = req.body.password;
	const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			const ps = new sql.PreparedStatement(pool);
			ps.input('login', sql.VarChar(20));
			ps.prepare('select * from users where username = @login', err => {
				if (err) throw err;
				ps.execute({ login: login }, (err, result) => {
					if (err) throw err;
					if (result.recordset.length === 0)
						res.json({ username: false, password: false });
					else
					{
						bcrypt.compare(password, result.recordset[0].passwordHash, function(err, result){
							if (err) throw err;
							if (result)
							{
								req.session.user = login;
								req.session.save(function(err) {
									if (err) throw err;
									res.json({ username: true, password: true });
									ps.unprepare(err => {
											if (err) throw err;
											pool.close();
										});
								});
							}
							else
							{
								res.json({ username: true, password: false });
								ps.unprepare(err => {
											if (err) throw err;
											pool.close();
										});
							}								
						});
					}
				});
			});
		});
});

module.exports = router;
