const express = require('express')
	, bodyParser = require('body-parser')
	, router = express.Router()
	, sql = require('mssql')
	, bcrypt = require('../bin/bcryptPromise.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js')
	, db = require('../bin/db.js');

const signinValidation = ajv.compile(schemas.signin);

router.get('/', function(req, res, next) {
	if(req.session.user !== undefined)
		res.redirect('/');
	else
		res.render('signin', { title: 'Sign-In', profile: null, signIn: true });
});

router.post('/', async (req, res, next) => {
	try {
		if (!signinValidation(req.body))
			res.json({"error": "Invalid request!", "errorDetails": signinValidation.errors});
		else
		{
			const login = req.body.username;
			const password = req.body.password;
			const result = await db.getUserByUsername(login);
			if (!result)
				res.json({ error: 'That user do not exist!' });
			else
			{
				const resultOfComp = await bcrypt.promiseCompare(password, result.passwordHash);
				if (resultOfComp)
				{
					req.session.user = login;
					res.json({ error: null });
				} 
				else
					res.json({ error: 'Invalid password!' });
			}
		}
	} catch (err) {
		console.log(err);
	}
});
	
module.exports = router;
