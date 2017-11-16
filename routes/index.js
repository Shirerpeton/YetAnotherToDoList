var express = require('express');
var router = express.Router();
var db = require('../bin/db.js');

/* GET home page. */
router.get('/', function(req, res, next) {
	var login = req.session.user;
	if (login !== undefined)
	{
		db.query('select * from projects join usersProjects using (projectId) where username = ?', [login], function(err, result) {
			if (err) throw err;
			var projs = [];
			for (var i = 0; i < result.length; i++)
			{
				var proj = { name: result[i]['projectName'], id: result[i]['projectId'] };
				projs.push(proj);
			}
			res.render('index', { profile: login, projs: projs});
		});
	}
	else
		res.render('layout');
});

router.post('/projects/:projId/users', function(req, res, next){
	var login = req.session.user;
	if (login !== undefined)
	{
		var projId = req.params.projId;
		var username = req.body.username;
		db.query('select * from projects join usersProjects using (projectId) where (username = ? and projectId = ?)', [login, projId], function(err, result) {
			if (err) throw err;
			if (result.length !== 0)
			{
				db.query('select * from users where username = ?', [username], function(err, result){
					if (result.length === 0)
						res.json({ user: 'does not exist' });
					else
						db.query('select * from projects join usersProjects using (projectId) where (projectId = ? and username = ?)', [projId, username], function(err, result){
							if (err) throw err;
							if (result.length !== 0)
								res.json({ user: 'already in proj' });
							else
							{
								db.query('insert into usersProjects (username, projectId) values (?, ?)', [username, projId], function(err){
									if (err) throw err;
								});
								res.json({ user: true });
							}
						});
				});
			}
			else
				res.redirect('/');
		});
	}
	else
		res.redirect('/');
});

router.delete('/projects/:projId/users/:username', function(req, res, next){
	var login = req.session.user;
	if (login !== undefined)
	{
		var projId = req.params.projId;
		var username = req.params.username;
		db.query('select * from projects join usersProjects using (projectId) where (username = ? and projectId = ?)', [username, projId], function(err, result){
			if (result.length === 0)
				res.json({ user: false });
			else
				db.beginTransaction(function(err){
					db.query('delete from usersProjects where (projectId = ? and username = ?)', [projId, username], function(err) {
						if (err)
							db.rollback(function(){
								throw err;
							});
						else
						{
							db.query('select * from usersProjects where projectId = ?', [projId], function(err, result){
								if (err)
									db.rollback(function(){
										throw err;
									});
								else
									if (result.length === 0)
										db.query('delete from projects where projectId = ?', [projId], function(err){
											if (err)
												db.rollback(function(){
													throw err;
												});
											else
												db.commit(function(err){
													if (err)
														db.rollback(function(){
															throw err;
														});
													else
														res.json({ user: true, reload: login === username });
												});
										});
									else
										db.commit(function(err){
											if (err)
												db.rollback(function(){
													throw err;
												});
											else
												res.json({ user: true, reload: login === username });
										});
							});
						}
					});
				});
		});
	}
	else
		res.redirect('/');
});

router.get('/projects/:projId', function(req, res, next){
	var login = req.session.user;
	if (login !== undefined)
	{
		var projId = req.params.projId;
		db.query('select * from projects join usersProjects using (projectId) where username = ?', [login], function(err, result) {
			if (err) throw err;
			var projs = [];
			var projExist = false;
			for (var i = 0; i < result.length; i++)
			{
				var proj = { name: result[i]['projectName'], id: result[i]['projectId'] };
				projs.push(proj);
				if (proj.id == projId)
					projExist = true;
			}
			console.log(projExist);
			if (projExist)
				db.query('select * from projects join usersProjects using (projectId) where (projectId = ?)', [projId], function(err, result) {
					if (err) throw err;
					if (result.length)
					{
						var projUsers = [login];
						for(var j = 0; j < result.length; j++)
						{
							if (result[j]['username'] !== login)
								projUsers.push(result[j]['username']);
						}
						res.render('index', { profile: login, projs: projs, projUsers: projUsers });
					}
					else
						res.redirect('/');
				});
			else
				res.redirect('/');
		});
	}
	else
		res.redirect('/');
});

router.post('/projects', function(req, res, next){
	var login = req.session.user;
	if (login !== undefined)
	{
		var projName = req.body.projName;
		db.beginTransaction(function(err) {
			if (err) throw err;
				db.query('insert into projects (projectName) values(?)', [projName] , function(err, result) {
					if (err)
						db.rollback(function() {
							throw err;
						});
						db.query('insert into usersProjects (username, projectId) values (?, ?)', [login, result.insertId], function(err){
							if (err)
								db.rollback(function() {
									throw err;
								});
							db.commit(function(err) {
								if (err)
									db.rollback(function() {
										throw err;
									});
								else
									res.json({ projId: result.insertId });
							});
						});
					});
		});
	}
	else
		res.redirect('/');
});

router.delete('/projects/:projId', function(req, res, next){
	var login = req.session.user;
	if (login !== undefined)
	{
		var projId = req.params.projId;
		db.query('select * from projects join usersProjects using (projectId) where (username = ? and projectId = ?)', [login, projId], function(err, result){
			if (err) throw err;
			if (!result.length)
				res.json({ proj: false });
			else
			{
				db.beginTransaction(function(err) {
					if (err) throw err;
					db.query('delete from projects where projectId = ?', [projId] , function(err) {
						if (err)
							db.rollback(function(){
								throw err;
							});
						db.query('delete from usersProjects where projectId = ?', [projId], function(err){
							if (err)
								db.rollback(function(){
									throw err;
								});
							else
								db.commit(function(err) {
									if (err)
										db.rollback(function() {
											throw err;
										});
									else
										res.json({ proj: true });
								});
						});
					});
				});
			}
		});
	}
	else
		res.redirect('/');
});

module.exports = router;