'use strict';

const express = require('express')
	, router = express.Router()
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const addProjectValidation = ajv.compile(schemas.addProject);
const renameProjectValidation = ajv.compile(schemas.renameProject);

router.get('/projects/:projId', async (req, res) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.render('index', {title: 'Yet Another ToDo List', profile: login});
		else
			res.status(401).render('error', { title: 'Error', message: 'You are not logged!'});
	} catch (err) {
		console.log(err);
		res.status(500).render('error', { profile: req.session.user, message: 'Iternal error!'})
	}
});

router.get('/projects', async(req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else 
			res.json({error: null, projects: await db.getProjectsOfUser(login)});
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.post('/projects', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			if (!addProjectValidation(req.body))
				res.status(400).json({"error": "Invalid request!", "errorDetails": addProjectValidation.errors});
			else {
				const projName = req.body.projectName;
				const client = await db.pool.connect();
				try {
					await client.query('BEGIN');
					let query = {
						text: 'insert into "projects" ("projectName") values ($1) returning "projectId"',
						values: [projName]
					};
					const {rows} = await client.query(query);
					query = {
						text: 'insert into "usersProjects" ("username", "projectId") values ($1, $2)',
						values: [login, rows[0].projectId]
					};
					await client.query(query);
					await client.query('COMMIT');
					res.status(201).json({error: null, project: {projectId: rows[0].projectId, projectName: projName}});
				} catch (err) {
					client.query('ROLLBACK');
					throw (err);
				} finally {
					client.release();
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});


router.delete('/projects/:projId', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.status(400).json({error : 'Invalid project ID!'});
			else {
				if (!(await db.isUserInTheProject(login, projId))){
					res.status(403).json({ error: "You are not in this project!" });
				} else {
					const client = await db.pool.connect();
					try {
						const query = {
							text: 'delete from "projects" where "projectId" = $1',
							values: [projId]
						};
						await client.query(query);
						res.json({error: null});
					} catch (err) {
						throw(err);
					} finally {
						client.release();
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});


router.put('/projects/:projId/', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			if (!renameProjectValidation(req.body))
				res.status(400).json({"error": "Invalid request!", "errorDetails": renameProjectValidation.errors});
			else {
				const projId = Number(req.params.projId);
				if (isNaN(projId))
					res.status(400).json({error : 'Invalid project ID!'});
				else {
					const projName = req.body.projectName;
					if (!(await db.isUserInTheProject(login, projId)))
						res.status(403).json({error: "You are not in this project!"});
					else {
						const client = await db.pool.connect();
						try {
							const query = {
								text: 'update "projects" set "projectName" = $1 where "projectId" = $2',
								values: [projName, projId]
							};
							await client.query(query);
							res.json({error: null, project: {projectName: projName, projectId: projId}});
						} catch (err) {
							throw err;
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