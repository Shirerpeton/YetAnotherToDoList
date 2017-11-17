var express = require('express');
var router = express.Router();
var sql = require('mssql');
var config = require('../bin/db.js');

router.get('/', (req, res, next) => {
	var login = req.session.user;
	if (login !== undefined)
	{
		const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			const ps = new sql.PreparedStatement(pool);
			ps.input('login', sql.VarChar(20));
			ps.prepare('select p.projectId, p.projectName from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId)', err => {
				if (err) throw err;
				ps.execute({ login: login }, (err, result) => {
					if (err) throw err;
					var projs = [];
					for (var i = 0; i < result.recordset.length; i++)
					{
						var proj = { name: result.recordset[i]['projectName'], id: result.recordset[i]['projectId'] };
						projs.push(proj);
					}
					res.render('index', { profile: login, projs: projs});
					ps.unprepare(err => {
						if (err) throw err;
						pool.close();
					});
				});
			});
		});
	}
	else
		res.render('layout');
});

router.get('/pinfo', (req, res, next) => {
	const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('select * from projects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/pdel', (req, res, next) => {
	const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('delete from projects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/upinfo', (req, res, next) => {
	const pool = new sql.ConnectionPool(config);
	pool.connect(err => {
		if (err) throw err;
		pool.request().query('select * from usersProjects', (err, result) => {
			if (err) throw err;
			else console.log(result.recordset);
		});
	});
});

router.get('/updel', (req, res, next) => {
	const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('delete from usersProjects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/projects/:projId', function(req, res, next){
	var login = req.session.user;
	if (login !== undefined)
	{
		const projId = Number(req.params.projId);
		const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			const ps = new sql.PreparedStatement(pool);
			ps.input('login', sql.VarChar(20));
			ps.prepare('select p.projectId, p.projectName from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId)', err => {
				if (err) throw err;
				ps.execute({ login: login }, (err, result) => {
					if (err) throw err;
					var projs = [];
					let projExist = false;
					for (var i = 0; i < result.recordset.length; i++) {
						var proj = { name: result.recordset[i]['projectName'], id: result.recordset[i]['projectId'] };
						projs.push(proj);
						if (proj.id == projId)
						projExist = true;
					}
					if (projExist)
					{
						ps.unprepare(err => {
							if (err) throw err;
							const ps = new sql.PreparedStatement(pool);
							ps.input('projId', sql.Int);
							ps.prepare('select u.username from usersProjects as up join users as u on (up.username = u.username) join projects as p on (up.projectId = p.projectId and p.projectId = @projId)', err => {
								if (err) throw err;
								ps.execute({ projId: projId }, (err, result) => {
									if (err) throw err;
									let projUsers = [login];
									for(let j = 0; j < result.recordset.length; j++)
									{
										if (result.recordset[j]['username'] !== login)
											projUsers.push(result.recordset[j]['username']);
									}
									res.render('index', { profile: login, projs: projs, projUsers: projUsers });
									ps.unprepare(err => {
										if (err) throw err;
										pool.close();
									});
								});
							});
						});
					}
					else
						res.redirect('/');
				});
			});
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
		const pool = new sql.ConnectionPool(config);
		pool.connect(err => {
			if (err) throw err;
			const transaction = new sql.Transaction(pool);
			transaction.begin(err => {
				if (err)
					transaction.rollback(() => {
						if (err) throw err;
				});
				const ps = new sql.PreparedStatement(transaction);
				ps.input('projName', sql.VarChar(50));
				ps.prepare('insert into projects values (@projName); SELECT SCOPE_IDENTITY() AS id', err => {
					if (err)
						transaction.rollback((er) => {
							if (err) throw err;
							if (er) throw er;
						});
					ps.execute({ projName: projName }, (err, result) => {
						if (err)
							transaction.rollback((er) => {
								if (err) throw err;
								if (er) throw er;
							});
						ps.unprepare(err => {
							if (err)
								transaction.rollback((er) => {
									if (err) throw err;
									if (er) throw er;
								});
							const ps = new sql.PreparedStatement(transaction);
							ps.input('login', sql.VarChar(20));
							ps.input('projId', sql.Int);
							ps.prepare('insert into usersProjects (username, projectId) values (@login, @projId)', err => {
								if (err)
									transaction.rollback((er) => {
										if (err) throw err;
										if (er) throw er;
									});
								ps.execute({login: login, projId: result.recordset[0].id}, err => {
									if (err)
										transaction.rollback((er) => {
											if (err) throw err;
											if (er) throw er;
										});
									ps.unprepare(err => {
										if (err)
											transaction.rollback((er) => {
												if (err) throw err;
												if (er) throw er;
											});
										transaction.commit(err => {
											if (err)
												transaction.rollback((er) => {
													if (err) throw err;
													if (er) throw er;
												});
											res.json({ projId: result.recordset[0].id });
											pool.close();
										});
									});
								});
							});
						});
					});
				});
						
			});
		});
	}
	else
		res.redirect('/');
});


router.delete('/projects/:projId/users/:username', function(req, res, next){
	const login = req.session.user;
	if (login !== undefined)
	{
		const projId = Number(req.params.projId);
		if (!isNaN(projId))
		{
			const username = req.params.username;
			const pool = new sql.ConnectionPool(config);
			pool.connect(err => {
				if (err) throw err;
				const ps = new sql.PreparedStatement(pool);
				ps.input('login', sql.VarChar(20));
				ps.input('projId', sql.Int);
				ps.prepare('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)', err => {
					if (err) throw err;
					ps.execute({login: login, projId: projId}, (err, result) => {
						if (err) throw err;
						ps.unprepare(err => {
							if (err) throw err;
							if (result.recordset.length !== 0)
							{
								const ps = new sql.PreparedStatement(pool);
								ps.input('username', sql.VarChar(20));
								ps.input('projId', sql.Int);
								ps.prepare('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @username) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)', err => {
									if (err) throw err;
									ps.execute({username: username, projId: projId}, (err, result) => {
										if (err) throw err;
										ps.unprepare(err => {
											if (err) throw err;
											if (result.recordset.length !== 0)
											{
												const transaction = new sql.Transaction(pool);
												transaction.begin(err => {
													if (err)
														transaction.rollback((er) => {
															if (err) throw err;
															if (er) throw er;
														});
													const ps = new sql.PreparedStatement(transaction);
													ps.input('username', sql.VarChar(20));
													ps.input('projId', sql.Int);
													ps.prepare('delete from usersProjects where (username = @username and projectId = @projId)', err => {
														if (err)
															transaction.rollback((er) => {
																if (err) throw err;
																if (er) throw er;
															});
														ps.execute({username: username, projId: projId}, err => {
															if (err)
																transaction.rollback((er) => {
																	if (err) throw err;
																	if (er) throw er;
																});
															ps.unprepare(err => {
																if (err)
																	transaction.rollback((er) => {
																		if (err) throw err;
																		if (er) throw er;
																	});
																const ps = new sql.PreparedStatement(transaction);
																ps.input('projId', sql.Int);
																ps.prepare('select * from usersProjects where projectId = @projId', err => {
																	if (err)
																		transaction.rollback((er) => {
																			if (err) throw err;
																			if (er) throw er;
																		});
																	ps.execute({projId: projId}, (err, result) => {
																		if (err)
																			transaction.rollback((er) => {
																				if (err) throw err;
																				if (er) throw er;
																			});
																		ps.unprepare(err => {
																			if (err)
																				transaction.rollback((er) => {
																					if (err) throw err;
																					if (er) throw er;
																				});
																				console.log(result.recordset);
																			if (result.recordset.length !== 0)
																				transaction.commit(err => {
																					if (err)
																						transaction.rollback((er) => {
																							if (err) throw err;
																							if (er) throw er;
																						});
																					res.json({ user: true, reload: login === username });
																					pool.close();
																				});
																			else
																			{
																				const ps = new sql.PreparedStatement(transaction);
																				ps.input('projId', sql.Int);
																				ps.prepare('delete from projects where projectId = @projId', err => {
																					if (err)
																					transaction.rollback((er) => {
																						if (err) throw err;
																						if (er) throw er;
																					});
																					ps.execute({projId: projId}, err => {
																						if (err)
																							transaction.rollback((er) => {
																								if (err) throw err;
																								if (er) throw er;
																							});
																						ps.unprepare(err => {
																							if (err)
																								transaction.rollback((er) => {
																									if (err) throw err;
																									if (er) throw er;
																								});
																							transaction.commit(err => {
																								if (err)
																									transaction.rollback((er) => {
																										if (err) throw err;
																										if (er) throw er;
																									});
																								res.json({ user: true, reload: login === username });
																								pool.close();
																							});
																						});
																					});
																				});
																			}
																		});
																	});
																});
															});
														});
													});
												});
											}
											else
											{
												res.json({ user: false });
												pool.close();
											}
										});
									});
								});
							}
							else
							{
								res.json({ user: false });
								pool.close();
							}
						});
					});
				});
			});
		}
		else
		{
			res.json({ user: false });
		}
	}
	else
	{
		res.json({ user: false });
	}
});


router.delete('/projects/:projId', function(req, res, next){
	const login = req.session.user;
	if (login !== undefined)
	{
		const projId = Number(req.params.projId);
		if (!isNaN(projId))
		{
			console.log(typeof projId);
			const pool = new sql.ConnectionPool(config);
			pool.connect(err => {
				if (err) throw err;
				const ps = new sql.PreparedStatement(pool);
				ps.input('login', sql.VarChar(20));
				ps.input('projId', sql.Int);
				ps.prepare('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)', err => {
					if (err) throw err;
					ps.execute({login: login, projId: projId}, (err, result) => {
							if (err) throw err;
							ps.unprepare(err => {
								if (err) throw err;
								if (!result.recordset.length)
									res.json({ proj: false });
								else
								{
									const transaction = new sql.Transaction(pool);
									transaction.begin(err => {
										if (err)
											transaction.rollback((er) => {
												if (err) throw err;
												if (er) throw er;
											});
										const ps = new sql.PreparedStatement(transaction);
										ps.input('projId', sql.Int);
										ps.prepare('delete from usersProjects where projectId = @projId', err => {
											if (err)
												transaction.rollback((er) => {
													if (err) throw err;
													if (er) throw er;
												});
											ps.execute({projId: projId}, err => {
												if (err)
													transaction.rollback((er) => {
														if (err) throw err;
														if (er) throw er;
													});
												ps.unprepare(err => {
													if (err)
														transaction.rollback((er) => {
															if (err) throw err;
															if (er) throw er;
														});
													transaction.commit(err => {
														if (err)
															transaction.rollback((er) => {
																if (err) throw err;
																if (er) throw er;
															});
														res.json({ proj: true });
														pool.close();
													});
												});
											});
										});
									});
								}
							});
						});
				});
			});
		}
		else res.json({ proj: false });
	}
	else
		res.json({ proj: false });
});

router.post('/projects/:projId/users', function(req, res, next){
	const login = req.session.user;
	if (login !== undefined)
	{
		const projId = Number(req.params.projId);
		if (!isNaN(projId))
		{
			const username = req.body.username;
			const pool = new sql.ConnectionPool(config);
			pool.connect(err => {
				if (err) throw err;
				const ps = new sql.PreparedStatement(pool);
				ps.input('login', sql.VarChar(20));
				ps.input('projId', sql.Int);
				ps.prepare('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)', err => {
					if (err) throw err;
					ps.execute({login: login, projId: projId}, (err, result) => {
						if (err) throw err;
						ps.unprepare(err => {
							if (err) throw err;
							if (result.recordset.length !== 0)
							{
								if (err) throw err;
								const ps = new sql.PreparedStatement(pool);
								ps.input('username', sql.VarChar(20));
								ps.prepare('select * from users where username = @username', err => {
									if (err) throw err;
									ps.execute({ username: username }, (err, result) => {
										if (err) throw err;
										ps.unprepare(err => {
											if (err) throw err;
											if (result.recordset.length === 0)
												res.json({user: 'does not exist'});
											else
											{
												const ps = new sql.PreparedStatement(pool);
												ps.input('username', sql.VarChar(20));
												ps.input('projId', sql.Int);
												ps.prepare('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @username) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)', err => {
													if (err) throw err;
													ps.execute({username: username, projId: projId}, (err, result) => {
														if (err) throw err;
														ps.unprepare(err => {
															if (err) throw err;
															if (result.recordset.length !== 0)
															{
																res.json({user: 'already in the proj'});
																pool.close();
															}
															else
															{
																const ps = new sql.PreparedStatement(pool);
																ps.input('username', sql.VarChar(20));
																ps.input('projId', sql.Int);
																ps.prepare('insert into usersProjects (username, projectId) values (@username, @projId)', err => {
																	if (err) throw err;
																	ps.execute({username: username, projId: projId}, err => {
																		if (err) throw err;
																		ps.unprepare(err => {
																			if (err) throw err;
																			res.json({ user: true });
																			pool.close()
																		});
																	});
																});
															}
														});
													});			
												});
											}
										});	
									});
								});
							}
							else
							{
								res.json({user: false});
								pool.close()
							}
						});
					});
				});
			});
		}
		else
			res.json({user: false});
	}
	else
		res.json({user: false});
});
module.exports = router;