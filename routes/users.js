const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../bin/db.js');

router.get('/:username', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === req.params.username)
		{
			const pool = new sql.ConnectionPool(db.config);
			await pool.connect();
			const result = await pool.request()
			.input('login', sql.VarChar(20), login)
			.query("select DATEDIFF(SECOND,{d '1970-01-01'}, users.registration) as regDate from users where username = @login");
			pool.close();
			const regDate = new Date (result.recordset[0].regDate * 1000);
			const daysSinceReg = Math.floor((new Date() - regDate) / 1000 / 64 / 64 / 24);
			res.render('profile', { title: login, profile: login, regDate: regDate.toDateString(), daysSinceReg: daysSinceReg });
		}
		else
			res.redirect('/');
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
