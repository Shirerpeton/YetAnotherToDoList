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
			res.json({ username: false, password: false });
		else
		{
			const resultOfComp = await bcrypt.promiseCompare(password, result.passwordHash);
			if (resultOfComp)
			{
				req.session.user = login;
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
