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

function promiseBycryptCompare(text, hash)
{
	return new Promise((resolve, reject) => {
		bcrypt.compare(text, hash, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

function promiseSessionSave(session)
{
	return new Promise((resolve, reject) => {
		session.save(err => {
			if (err) reject(err);
			else resolve();
		});
	});
}

router.post('/', async (req, res, next) => {
	try {
		const login = req.body.username;
		const password = req.body.password;
		const pool = await sql.connect(config);
		const result = await pool.request()
		.input('login', sql.VarChar(20), login)
		.query('select users.passwordHash from users where username = @login');
		sql.close();
		if (result.recordset.length === 0)
			res.json({ username: false, password: false });
		else
		{
			const resultOfComp = await promiseBycryptCompare(password, result.recordset[0].passwordHash);
			if (resultOfComp)
			{
				req.session.user = login;
				await promiseSessionSave(req.session);
				res.json({ username: true, password: true });
			} 
			else
				res.json({ username: true, password: false });
		}
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
