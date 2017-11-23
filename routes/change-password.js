const express = require('express');
const router = express.Router();
const bcrypt = require('../bin/bcryptPromise.js');
const sql = require('mssql');
const db = require('../bin/db.js');

router.get('/', function(req, res, next) {
	let login = req.session.user;
	if (login)
		res.render('change-password', { title: 'Change assoword', profile: login });
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

router.post('/', async (req, res, next) => {
	try {
		const login = req.session.user;
		const password = req.body.password;
		const newPassword = req.body.newPassword;
		const repNewPassword = req.body.repNewPassword;
		let pool = new sql.ConnectionPool(db.config);
		await pool.connect();
		const result = await pool.request()
		.input('login', sql.VarChar(20), login)
		.query('select users.passwordHash from users where username = @login');
		pool.close();
		const resultOfComp = await bcrypt.promiseCompare(password, result.recordset[0].passwordHash);
		if (resultOfComp)
		{
			if (newPassword !== repNewPassword)
				res.json({password: true, newPassword: "diff"});
			else if (newPassword.length < 6)
				res.json({password: true, newPassword: "short"});
			else
			{
				const hash = await bcrypt.promiseHash(newPassword);
				pool = new sql.ConnectionPool(db.config);
				await pool.connect();
				await pool.request()
				.input('login', sql.VarChar(20), login)
				.input('passwordHash', sql.VarChar(60), login)
				.query('update users set passwordHash = @passwordHash where username = @login');
				pool.close();
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