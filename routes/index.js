'use strict';

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../bin/db.js');

router.get('/', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.render('index', {title: 'Yet Another ToDo List', profile: login});
		else
			res.render('layout', {title: 'Yet Another ToDo List'});
	} catch (err) {
		console.log(err);
	}
});

router.get('/projects', async(req, res, next) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.json({error: null, projects: await db.getProjectsOfUser(login)});
		else
			res.json({error: 'You are not logged!'});
	} catch (err) {
		console.log(err);
	}
});

router.get('/pinfo', (req, res, next) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('select * from projects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/pdel', (req, res, next) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('delete from projects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/upinfo', (req, res, next) => {
	const pool = new sql.ConnectionPool(db.config);
	pool.connect(err => {
		if (err) throw err;
		pool.request().query('select * from usersProjects', (err, result) => {
			if (err) throw err;
			else console.log(result.recordset);
		});
	});
});

router.get('/updel', (req, res, next) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('delete from usersProjects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/projects/:projId', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.redirect('/');
		else 
		{
			const projId = Number(req.params.projId);
			const projects = await db.getProjectsOfUser(login);
			let projExist = false;
			for (let i = 0; i < projects.length; i++)
			{
				if (projects[i].projectId === projId)
					projExist = true;
			}
			if (!projExist)
				res.redirect('/');
			else 
			{
				const users = await db.getUsersOfProject(projId);
				let projUsers = [login];
				for(let j = 0; j < users.length; j++)
				{
					if (users[j]['username'] !== login)
						projUsers.push(users[j]['username']);
				}
				res.render('index', { title: 'Yet Another ToDo List', profile: login, projs: projects, projUsers: projUsers });
			}
		}
	} catch (err) {
		console.log(err);
	}
});

router.get('/projects/:projId/users', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.redirect('/');
		else 
		{
			const projId = Number(req.params.projId);
			const projects = await db.getProjectsOfUser(login);
			let projExist = false;
			for (let i = 0; i < projects.length; i++)
			{
				if (projects[i].projectId === projId)
					projExist = true;
			}
			if (!projExist)
				res.redirect('/');
			else 
			{
				const users = await db.getUsersOfProject(projId);
				let projUsers = [login];
				for(let j = 0; j < users.length; j++)
				{
					if (users[j]['username'] !== login)
						projUsers.push(users[j]['username']);
				}
				res.json({error: null, users: projUsers});
			}
		}
	} catch (err) {
		console.log(err);
	}
});

router.post('/projects', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: 'You are not logged!'})
		else
		{
			const projName = req.body.projName;
			const pool = new sql.ConnectionPool(db.config);
			await pool.connect();
			let transaction = pool.transaction();
			let result;
			try {
				await transaction.begin();
				result = await transaction.request()
				.input('projName', sql.VarChar(50), projName)
				.query('insert into projects values (@projName); SELECT SCOPE_IDENTITY() AS id');
				await transaction.request()
				.input('login', sql.VarChar(20), login)
				.input('projId', sql.Int, result.recordset[0].id)
				.query('insert into usersProjects (username, projectId) values (@login, @projId)');
				await transaction.commit();
				res.json({ error: null, projectId: result.recordset[0].id , projectName: projName});
			} catch (err) {
				console.log(err);
				try {
					await transaction.rollback();
				} catch (err) {
					console.log(err);
				}
			}
			pool.close();
		}
	} catch (err) {
		console.log(err);
	}
});



router.post('/projects/:projId/users', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: "You are not logged!"});
		else
		{
			const projId = Number(req.params.projId);
			if (isNaN(projId))
			{
				res.json({user: false});
			}
			else
			{
				const username = req.body.username;
				const pool = new sql.ConnectionPool(db.config);
				await pool.connect();
				let result = await pool.request()
				.input('login', sql.VarChar(20), login)
				.input('projId', sql.Int, projId)
				.query('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)');
				console.log(result);
				if (result.recordset.length === 0)
				{
					res.json({error: "You are not in this project!"});
					pool.close();
				}
				else
				{
					result = await pool.request()
					.input('username', sql.VarChar(20), username)
					.query('select * from users where username = @username');
					if (result.recordset.length === 0)
					{
						res.json({error: "Such user do not exist!"});
						pool.close();
					}
					else
					{
						result = await pool.request()
						.input('username', sql.VarChar(20), username)
						.input('projId', sql.Int,projId)
						.query('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @username) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)');
						if (result.recordset.length !== 0)
						{
							res.json({error: "That user already in the project!"});
							pool.close();
						}
						else
						{
							await pool.request()
							.input('username', sql.VarChar(20), username)
							.input('projId', sql.Int, projId)
							.query('insert into usersProjects (username, projectId) values (@username, @projId)');
							pool.close();
							res.json({error: null, username: username});
						}
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
	}
});
/*
router.delete('/projects/:projId', (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: 'You are not logged!'});
		else
		{
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.json({error : 'Invalid Project ID!'});
			else
			{
				//const pool = new sql.ConnectionPool(db.config);
				//await pool.connect();
				
			}
		}
	} catch (err) {
		console.log(err);
	}
});*/

router.delete('/projects/:projId', function(req, res, next){
	const login = req.session.user;
	if (login !== undefined)
	{
		const projId = Number(req.params.projId);
		if (!isNaN(projId))
		{
			const pool = new sql.ConnectionPool(db.config);
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


router.delete('/projects/:projId/users/:username', function(req, res, next){
	const login = req.session.user;
	if (login !== undefined)
	{
		const projId = Number(req.params.projId);
		if (!isNaN(projId))
		{
			const username = req.params.username;
			const pool = new sql.ConnectionPool(db.config);
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

module.exports = router;