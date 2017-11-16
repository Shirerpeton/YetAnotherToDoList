var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var db = require('../bin/db.js');

const saltRounds = 10;

router.get('/', function(req, res, next) {
	var login = req.session.user;
	if (login)
		res.render('change-password', { profile: login });
	else
		res.redirect('/');
});

router.post('/', function(req, res, next){
	var login = req.session.user;
	var password = req.body.password;
	var newPassword = req.body.newPassword;
	var repNewPassword = req.body.repNewPassword;
	db.query('select * from users where login = ?', [login], function(err, result) {
		if (result)
			bcrypt.compare(password, result[0].passwordHash, function(err, result){
				if (err) throw err;
				if (result)
				{
					 if (newPassword !== repNewPassword)
						res.json({password: true, newPassword: "diff"});
					else if (newPassword.length < 6)
						res.json({password: true, newPassword: "short"});
					else
					{
						res.json({password: true, newPassword: true});
						bcrypt.hash(newPassword, saltRounds, function(err, hash) {
							db.query('update users set passwordHash = ?	where login = ?', [hash, login], function(err){
								if (err) throw err;
							});
						});
					}
				}
				else
					res.json({ password: false, newPassword: false });
					
			});
	});
});

module.exports = router;