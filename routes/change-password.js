const express = require('express')
	, router = express.Router()
	, bcrypt = require('bcrypt')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const changePasswordValidation = ajv.compile(schemas.changePassword);

const saltRounds = 10;

router.get('/', function(req, res, next) {
	const login = req.session.user;
	if (login === undefined)
		res.status(401).json({error: 'You are not logged!'});
	else
		res.render('change-password', { title: 'Change passoword', profile: login });
});

router.post('/', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			if (!changePasswordValidation(req.body))
				res.status(400).json({"error": "Invalid request!", "errorDetails": changePasswordValidation.errors});
			else {
				const password = req.body.password;
				const newPassword = req.body.newPassword;
				const repNewPassword = req.body.repeatNewPassword;
				if (newPassword !== repNewPassword)
					res.status(400).json({error: 'Passwords must match!'});
				else {
					const result = await db.getUserByUsername(login);
					const resultOfComp = await bcrypt.compare(password, result.passwordHash);
					if (!resultOfComp)
						res.status(400).json({error: 'Invalid password!'});
					else {
						const hash = await bcrypt.hash(newPassword, saltRounds);
						const client = await db.pool.connect();
						try {
							const query = {
								text: 'update users set "passwordHash" = $1 where "username" = $2',
								values: [hash, login]
							}
							await client.query(query);
							res.json({error: null});
						} catch (err) {
							throw err;
						} finally {
							client.release();
						}	
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