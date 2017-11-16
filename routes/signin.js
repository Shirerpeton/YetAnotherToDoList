var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var bcrypt = require('bcrypt');
var db = require('../bin/db.js');

const saltRounds = 10;

router.get('/', function(req, res, next) {
	if(req.session.user !== undefined)
		res.redirect('/');
	else
		res.render('signin', { profile: null, signIn: true });
});

router.post('/', function(req, res, next){
	var login = req.body.username;
	var password = req.body.password;
	db.query('select * from users where username = ?', [login], function(err, result){
		if (err) throw err;
		if (result.length === 0)
			res.json({ username: false });
		else
			{
				bcrypt.compare(password, result[0].passwordHash, function(err, result){
					if (err) throw err;
					if (result)
					{
						req.session.user = login;
						req.session.save(function(err) {
							if (err) throw err;
						});
						res.json({ username: true, password: true });
					}
					else 
						res.json({ username: true, password: false });	
				});
			}
	});
});

module.exports = router;
