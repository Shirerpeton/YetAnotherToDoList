'use strict';

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../bin/db.js');

router.get('/', async (req, res) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.render('index', {title: 'Yet Another ToDo List', profile: login});
		else
			res.render('layout', {title: 'Yet Another ToDo List'});
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

router.get('/projects', async(req, res) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.json({error: null, projects: await db.getProjectsOfUser(login)});
		else
			res.json({error: 'You are not logged!'});
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

router.get('/pinfo', (req, res) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('select * from projects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/pdel', (req, res) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('delete from projects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/upinfo', (req, res) => {
	const pool = new sql.ConnectionPool(db.config);
	pool.connect(err => {
		if (err) throw err;
		pool.request().query('select * from usersProjects', (err, result) => {
			if (err) throw err;
			else console.log(result.recordset);
		});
	});
});

router.get('/updel', (req, res) => {
	const pool = new sql.ConnectionPool(db.config);
		pool.connect(err => {
			if (err) throw err;
			pool.request().query('delete from usersProjects', (err, result) => {
				if (err) throw err;
				else console.log(result.recordset);
			});
		});
});

router.get('/projects/:projId', async (req, res) => {
		try {
		const login = req.session.user;
		if (login !== undefined)
			res.render('index', {title: 'Yet Another ToDo List', profile: login});
		else
			res.redirect('/');
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

router.get('/projects/:projId/users', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: "You are not logged!"});
		else 
		{
			const projId = Number(req.params.projId);
			const users = await db.getUsersOfProject(projId);
			let projUsers = [{username: login}];
			let isUserPresentInProj = false;
			for (let i = 0; i < users.length; i++)
				if (users[i].username !== login)
						projUsers.push({username: users[i].username});
				else
					isUserPresentInProj = true;
			if (!isUserPresentInProj)
				res.json({error: "You are not in that project!"});
			else
				res.json({error: null, users: projUsers});
		}
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

router.post('/projects', async (req, res) => {
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
				res.json({error: null, projectId: result.recordset[0].id , projectName: projName});
			} catch (err) {
				console.log(err);
				try {
					await transaction.rollback();
					res.json({error: 'Iternal error!'});
				} catch (err) {
					console.log(err);
				}
			}
			pool.close();
		}
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});



router.post('/projects/:projId/users', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: "You are not logged!"});
		else
		{
			const projId = Number(req.params.projId);
			if (isNaN(projId))
			{
				res.json({error: "Invalid project ID!"});
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
						res.json({error: "Such user does not exist!"});
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
							res.json({error: "That user already in this project!"});
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
		res.json({error: 'Iternal error!'});
	}
});

router.delete('/projects/:projId', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: 'You are not logged!'});
		else
		{
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.json({error : 'Invalid project ID!'});
			else
			{
				const pool = new sql.ConnectionPool(db.config);
				try {
					await pool.connect();
					const result = await pool.request()
					.input('login', sql.VarChar(20), login)
					.input('projId', sql.Int, projId)
					.query('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)')
					if (!result.recordset.length)
					{
						res.json({ error: "You are not in this project!" });
						pool.close();
					}
					else
					{
						let transaction = pool.transaction();
						try {
							await transaction.begin();
							await transaction.request()
							.input('projId', sql.Int, projId)
							.query('delete from usersProjects where projectId = @projId');
							await transaction.request()
							.input('projId', sql.Int, projId)
							.query('delete from projects where projectId = @projId');
							await transaction.commit();
							res.json({error: null});
							pool.close();
						} catch (err) {
							try {
								await transaction.rollback();
							} catch (err) {
								console.log(err);
							}
							throw (err);
						}
					}
				} catch (err) {
					pool.close();
					throw(err);
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

router.delete('/projects/:projId/users/:username', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.json({error: 'You are not logged!'});
		else
		{
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.json({error : 'Invalid project ID!'});
			else
			{
				const username = req.params.username;
				const pool = new sql.ConnectionPool(db.config);
				try {
					await pool.connect();
					let result = await pool.request()
					.input('login', sql.VarChar(20), login)
					.input('projId', sql.Int, projId)
					.query('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)');
					if (result.recordset.length === 0)
					{
						res.json({error: "You are not in this project!"});
						pool.close();
					} 
					else 
					{
						result = await pool.request()
						.input('username', sql.VarChar(20), username)
						.input('projId', sql.Int, projId)
						.query('select * from usersProjects as up inner join users as u on (u.username = up.username and u.username = @login) inner join projects as p on (p.projectId = up.projectId and p.projectId = @projId)');
						if (result.recordset.length === 0)
						{
							res.json({error: "That user not in this project!"});
							pool.close();
						}
						else
						{
							let transaction = pool.transaction();
							try {
								await transaction.begin();
								await transaction.request()
								.input('username', sql.VarChar(20), username)
								.input('projId', sql.Int, projId)
								.query('delete from usersProjects where (username = @username and projectId = @projId)');
								result = await transaction.request()
								.input('projId', sql.Int, projId)
								.query('select * from usersProjects where projectId = @projId');
								if (result.recordset.length !== 0)
								{
									await transaction.commit();
									res.json({error: null, reload: login === username});
									pool.close();
								}
								else
								{
									await transaction.request()
									.input('projId', sql.Int, projId)
									.query('delete from projects where projectId = @projId');
									await transaction.commit();
									res.json({error: null, reload: login === username});
									pool.close();
								}
							} catch (err) {
								try {
									await transaction.rollback();
								} catch (err) {
									console.log(err);
								}
								throw (err);
							}
						}
					}
				} catch (err) {
					pool.close();
					throw(err);
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.json({error: 'Iternal error!'});
	}
});

module.exports = router;