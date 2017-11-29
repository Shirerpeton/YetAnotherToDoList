const express = require('express')
	, router = express.Router()
	, Request = require('tedious').Request
	, bcrypt = require('../bin/bcryptPromise.js')
	, sql = require('mssql')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const signupValidation = ajv.compile(schemas.signup);
	
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
		if (!signupValidation(req.body))
			res.json({"error": "Invalid request!", "errorDetails": signupValidation.errors});
		else
		{
			const login = req.body.username;
			const password = req.body.password;
			const repPassword = req.body.repeatPassword;
			if (login.length < 4)
				res.json({error: "Username must be no less than 4 characters long!"});
			else if (login.length > 20)
				res.json({error: "Username must be no more than 20 characters long!"});
			else if (password.length < 6)
				res.json({error: "Password must be at least 6 characters long!"});
			else if (password.length > 20)
				res.json({error: "Password must be no more than 20 characters long!"});
			else if (password !== repPassword)
				res.json({error: "Passwords must match!"});
			else 
			{
				let result = await db.getUserByUsername(login);
				if (result)
					res.json({error: "That username is already taken!"});
				else
				{
					const hash = await bcrypt.promiseHash(password);
					pool = new sql.ConnectionPool(db.config);
					try {
						await pool.connect();
						await pool.request()
						.input('login', sql.VarChar(20), login)
						.input('pswHash', sql.VarChar(60), hash)
						.input('regDate', sql.Date, new Date().toISOString().slice(0, 19).replace('T', ' '))
						.query('insert into users (username, passwordHash, registration) values (@login, @pswHash, @regDate)');
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
	}
});

module.exports = router;
