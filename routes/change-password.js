const express = require('express');
const router = express.Router();
const bcrypt = require('../bin/bcryptPromise.js');
const sql = require('mssql');
const db = require('../bin/db.js');

router.get('/', function(req, res, next) {
	let login = req.session.user;
	if (login)
		res.render('change-password', { title: 'Change passoword', profile: login });
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
		if (login === undefined)
			res.json({error: "You are not logged!"});
		else
		{
			const password = req.body.password;
			const newPassword = req.body.newPassword;
			const repNewPassword = req.body.repNewPassword;
			if (newPassword.length < 6)
				res.json({error: "Password must be at least 6 characters long!"});
			else if (newPassword.length > 20)
				res.json({error: "Password must be no more than 20 characters long!"});
			else if (newPassword !== repNewPassword)
				res.json({error: 'Passwords must match!'});
			else
			{
				const result = await db.getUserByUsername(login);
				const resultOfComp = await bcrypt.promiseCompare(password, result.passwordHash);
				if (!resultOfComp)
					res.json({error: 'Invalid password!'});
				else
				{
					const hash = await bcrypt.promiseHash(newPassword);
					const pool = new sql.ConnectionPool(db.config);
					try {
						await pool.connect();
						await pool.request()
						.input('login', sql.VarChar(20), login)
						.input('passwordHash', sql.VarChar(60), login)
						.query('update users set passwordHash = @passwordHash where username = @login');
						pool.close();
						res.json({error: null});
					} catch (err) {
						pool.close();
						throw err;
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

module.exports = router;