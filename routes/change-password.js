var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
<<<<<<< HEAD
var sql = require('mssql');
var config = require('../bin/db.js');
=======
var db = require('../bin/db.js');
>>>>>>> 00fdd42f8974f6701d5ba99fdbb4b0b648e22aa7

const saltRounds = 10;

router.get('/', function(req, res, next) {
	var login = req.session.user;
	if (login)
		res.render('change-password', { profile: login });
	else
		res.redirect('/');
});

function promiseBycryptCompare(text, hash)
{
	return new Promise((resolve, reject) => {
		bcrypt.compare(text, hash, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

function promiseBycryptHash(text, saltRounds)
{
	return new Promise((resolve, reject) => {
		bcrypt.hash(text, saltRounds, (err, hash) => {
			if (err) reject(err);
			else resolve(hash);
		});
	});
}

router.post('/', async (req, res, next) => {
	try {
		const login = req.session.user;
		const password = req.body.password;
		const newPassword = req.body.newPassword;
		const repNewPassword = req.body.repNewPassword;
		let pool = await sql.connect(config);
		const result = await pool.request()
		.input('login', sql.VarChar(20), login)
		.query('select users.passwordHash from users where username = @login');
		sql.close();
		const resultOfComp = await promiseBycryptCompare(password, result.recordset[0].passwordHash);
		if (resultOfComp)
		{
			if (newPassword !== repNewPassword)
				res.json({password: true, newPassword: "diff"});
			else if (newPassword.length < 6)
				res.json({password: true, newPassword: "short"});
			else
			{
				const hash = await promiseBycryptHash(newPassword, saltRounds);
				pool = await sql.connect(config);
				await pool.request()
				.input('login', sql.VarChar(20), login)
				.input('passwordHash', sql.VarChar(60), login)
				.query('update users set passwordHash = @passwordHash where username = @login');
				sql.close();
				res.json({password: true, newPassword: true});
			}
		}
		else
			res.json({ password: false, newPassword: false });
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;