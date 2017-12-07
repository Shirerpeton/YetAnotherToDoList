const express = require('express')
	, router = express.Router()
	, bcrypt = require('bcrypt')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const saltRounds = 10;

const signupValidation = ajv.compile(schemas.signup);
	
router.get('/', function(req, res, next) {
	if (req.session.user === undefined)
		res.render('signup', { title: 'Sign-Up', profile: null, signUp: true });
	else
		res.redirect('/');
});

router.post('/', async (req, res, next) => {
	try {
		if (!signupValidation(req.body))
			res.status(400).json({"error": "Invalid request!", "errorDetails": signupValidation.errors});
		else {
			const login = req.body.username;
			const password = req.body.password;
			const repPassword = req.body.repeatPassword;
			if (login.length < 2)
				res.status(400).json({error: "Username must be no less than 2 characters long!"});
			else if (login.length > 20)
				res.status(400).json({error: "Username must be no more than 20 characters long!"});
			else if (password.length < 6)
				res.status(400).json({error: "Password must be at least 6 characters long!"});
			else if (password !== repPassword)
				res.status(400).json({error: "Passwords must match!"});
			else  {
				const result = await db.getUserByUsername(login);
				if (result)
					res.status(400).json({error: "That username is already taken!"});
				else {
					const hash = await bcrypt.hash(password, saltRounds);
					const client = await db.pool.connect();
					try {
						const query = {
							text: 'insert into users ("username", "passwordHash", "dateOfRegistration") values ($1, $2, $3)',
							values: [login, hash, (new Date()).toISOString()]
						}
						await client.query(query);
						res.status(201).json({error: null});
					} catch (err) {
						throw err;
					} finally {
						client.release();
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
