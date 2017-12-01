const express = require('express')
	, router = express.Router()
	, bcrypt = require('../bin/bcryptPromise.js')
	, sql = require('mssql')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const changePasswordValidation = ajv.compile(schemas.changePassword);
	
router.get('/', function(req, res, next) {
	const login = req.session.user;
	res.render('change-password', { title: 'Change passoword', profile: login });
});

router.post('/', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (!changePasswordValidation(req.body))
			res.status(400).json({"error": "Invalid request!", "errorDetails": changePasswordValidation.errors});
		else
		{
			const password = req.body.password;
			const newPassword = req.body.newPassword;
			const repNewPassword = req.body.repeatNewPassword;
			if (newPassword.length < 6)
				res.status(400).json({error: "Password must be at least 6 characters long!"});
			else if (newPassword.length > 20)
				res.status(400).json({error: "Password must be no more than 20 characters long!"});
			else if (newPassword !== repNewPassword)
				res.status(400).json({error: 'Passwords must match!'});
			else
			{
				const result = await db.getUserByUsername(login);
				const resultOfComp = await bcrypt.promiseCompare(password, result.passwordHash);
				if (!resultOfComp)
					res.status(400).json({error: 'Invalid password!'});
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
		res.status(500).json({error: 'Iternal error!'});
	}
});

module.exports = router;