var express = require('express');
var router = express.Router();
var db = require('../bin/db.js');

router.get('/:username', function(req, res, next) {
	var login = req.session.user;
	if (login === req.params.username)
		db.query('select UNIX_TIMESTAMP(registration) from users where username = ?', [login], function(err, result) {
			if (err) throw err;
			var regDate = new Date(result[0]['UNIX_TIMESTAMP(registration)']*1000);
			var daysSinceReg = Math.floor((new Date() - regDate) / 1000 / 64 / 64 / 24);
			res.render('profile', { profile: login, regDate: regDate.toDateString(), daysSinceReg: daysSinceReg });
		});
	else
		res.redirect('/');
});

module.exports = router;
