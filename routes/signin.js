const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('../bin/bcryptPromise.js');
const db = require('../bin/db.js');


const chai = require('chai')
	, expect = chai.expect
const chaiHttp = require('chai-http');
const app = require('../app.js');

router.get('/', function(req, res, next) {
	if(req.session.user !== undefined)
		res.redirect('/');
	else
	{
		res.render('signin', { title: 'Sign-In', profile: null, signIn: true });
	}
});

router.post('/', async (req, res, next) => {
	try {
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
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
