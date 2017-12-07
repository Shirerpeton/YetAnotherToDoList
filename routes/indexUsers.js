'use strict';

const express = require('express')
	, router = require('./indexProjects.js')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js')

const addUserValidation = ajv.compile(schemas.addUser);

router.get('/projects/:projId/users', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
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
				res.status(403).json({error: "You are not in that project!"});
			else
				res.json({error: null, users: projUsers});
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.post('/projects/:projId/users', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			if (!addUserValidation(req.body))
				res.status(400).json({error: "Invalid request!", errorDetails: addUserValidation.errors});
			else
			{
				const projId = Number(req.params.projId);
				if (isNaN(projId))
					res.status(400).json({error: "Invalid project ID!"});
				else
				{
					const username = req.body.username;
					if (!(await db.isUserInTheProject(login, projId)))
						res.status(403).json({error: "You are not in this project!"});
					else
					{
						if ((await db.getUserByUsername(username)) === null)
							res.status(400).json({error: "Such user does not exist!"});
						else
						{
							if (await db.isUserInTheProject(username, projId))
								res.status(400).json({error: "That user already in this project!"});
							else
							{	
								const pool = new sql.ConnectionPool(db.config);
								try {
									await pool.connect();
									await pool.request()
									.input('username', sql.VarChar(20), username)
									.input('projId', sql.Int, projId)
									.query('insert into usersProjects (username, projectId) values (@username, @projId)');
									res.status(201).json({error: null, user: {username: username}});
									pool.close();
								} catch (err) {
									pool.close();
									throw err;
								}
							}
						}
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.delete('/projects/:projId/users/:username', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.status(400).json({error : 'Invalid project ID!'});
			else
			{
				const username = req.params.username;
				if (!(await db.isUserInTheProject(login, projId)))
					res.status(403).json({error: "You are not in this project!"});
				else 
				{
					if (!(await db.isUserInTheProject(username, projId)))
						res.status(400).json({error: "That user not in this project!"});
					else
					{
						const pool = new sql.ConnectionPool(db.config);
						try {
							await pool.connect();
							let transaction = pool.transaction();
							try {
								await transaction.begin();
								await transaction.request()
								.input('username', sql.VarChar(20), username)
								.input('projId', sql.Int, projId)
								.query('delete from usersProjects where (username = @username and projectId = @projId)');
								const result = await transaction.request()
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
									.query('delete from tasks where projectId = @projId');
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
						} catch (err) {
							pool.close();
							throw(err);
						}
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

module.exports = router;