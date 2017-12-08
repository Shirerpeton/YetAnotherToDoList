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
			if (isNaN(projId))
				res.status(400).json({error: 'Invalid project ID!'});
			else {
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
			else {
				const projId = Number(req.params.projId);
				if (isNaN(projId))
					res.status(400).json({error: "Invalid project ID!"});
				else {
					const username = req.body.username;
					if (!(await db.isUserInTheProject(login, projId)))
						res.status(403).json({error: "You are not in this project!"});
					else {
						if ((await db.getUserByUsername(username)) === null)
							res.status(400).json({error: "Such user does not exist!"});
						else {
							if (await db.isUserInTheProject(username, projId))
								res.status(400).json({error: "That user already in this project!"});
							else {	
								const client = await db.pool.connect();
								try {
									const query = {
										text: 'insert into "usersProjects" ("username", "projectId") values ($1, $2)',
										values: [username, projId]
									}
									await client.query(query);
									res.status(201).json({error: null, project: {projectId: projId}, user: {username: username}});
								} catch (err) {
									throw err;
								} finally {
									client.release();
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
			else {
				const username = req.params.username;
				if (!(await db.isUserInTheProject(login, projId)))
					res.status(403).json({error: "You are not in this project!"});
				else {
					if (!(await db.isUserInTheProject(username, projId)))
						res.status(400).json({error: "That user not in this project!"});
					else {
						const client = await db.pool.connect();
						try {
							let query = {
								text: 'select * from "usersProjects" where "projectId" = $1',
								values: [projId]
							};
							const {rows} = await client.query(query);
							try {
								await client.query('BEGIN');
								query = {
									text: 'delete from "usersProjects" where ("username" = $1 and "projectId" = $2)',
									values: [username, projId]
								};
								await client.query(query);
								if (rows.length > 1) {
									await client.query('COMMIT');
									res.json({error: null, reload: login === username});
								}
								else {
									query = {
										text: 'delete from "tasks" where "projectId" = $1',
										values: [projId]
									};
									await client.query(query);
									await client.query('COMMIT');
									res.json({error: null, reload: login === username});
								}
							} catch (err) {
								await client.query('ROLLBACK');
								throw (err);
							}
						} catch (err) {
							throw (err);
						} finally {
							client.release();
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