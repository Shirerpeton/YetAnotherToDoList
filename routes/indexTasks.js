'use strict';

const express = require('express')
	, router = require('./indexUsers.js')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const addTaskValidation = ajv.compile(schemas.addTask);
const updateTaskValidation = ajv.compile(schemas.updateTask);

router.get('/projects/:projId/tasks', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.status(400).json({error : 'Invalid project ID!'});
			else {
				if (!(await db.isUserInTheProject(login, projId)))
					res.status(403).json({error : 'You are not in this project!'});
				else {
					const client = await db.pool.connect();
					try {
						const query = {
							text: 'select * from tasks where ("projectId" = $1)',
							values: [projId]
						};
						const {rows} = await client.query(query);
						res.json({error: null, tasks: rows});
					} catch (err) {
						throw err;
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

router.post('/projects/:projId/tasks', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			if (!addTaskValidation(req.body))
				res.status(400).json({"error": "Invalid request!", "errorDetails": addTaskValidation.errors});
			else {
				const projId = Number(req.params.projId);
				if (isNaN(projId))
					res.status(400).json({error : 'Invalid project ID!'});
				else {
					if (!(await db.isUserInTheProject(login, projId)))
						res.status(403).json({error : 'You are not in this project!'});
					else {
						const taskName = req.body.taskName;
						const priority = (req.body.priority) ? req.body.priority : null;
						const currentDate = (new Date).toISOString();
						const client = await db.pool.connect();
						try {
							const query = {
								text: 'insert into "tasks" ("taskName", "projectId", "dateOfAdding", "priority", "completed") values ($1, $2, $3, $4, false) returning "taskId"',
								values: [taskName, projId, currentDate, priority]
							};
							const {rows} = await client.query(query);
							res.status(201).json({error: null, task: {taskName: taskName, dateOfAdding: currentDate, priority: priority, taskId: rows[0].taskId, completed: false}});
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
		res.status(500).json({error: "Iternal error!"});
	}
});

router.put('/projects/:projId/tasks/:taskId', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			if (!updateTaskValidation(req.body))
				res.status(400).json({"error": "Invalid request!", "errorDetails": updateTaskValidation.errors});
			else {
				const projId = Number(req.params.projId);
				if (isNaN(projId))
					res.status(400).json({error : 'Invalid project ID!'});
				else {
					const taskId = Number(req.params.taskId);
					if (isNaN(taskId))
						res.status(400).json({error : 'Invalid task ID!'});
					else {
						if (!(await db.isUserInTheProject(login, projId)))
							res.status(403).json({error : 'You are not in this project!'});
						else {	
							if (!(await db.isTaskInTheProject(taskId, projId)))
								res.status(404).json({error : 'This task not in the project!'});
							else {
								const client = await db.pool.connect();
								try {
									let query = {
										text: 'select * from "tasks" where ("taskId" = $1)',
										values: [taskId]
									};
									const {rows} = await client.query(query);
									const taskName = (req.body.taskName !== undefined) ? req.body.taskName : rows[0].taskName;
									const priority = (req.body.priority !== undefined) ? req.body.priority : rows[0].priority;
									const completed = (req.body.completed !== undefined) ? req.body.completed : rows[0].completed;
									query = {
										text: 'update "tasks" set "taskName" = $1, "priority" = $2, "completed" = $3 where ("taskId" = $4)',
										values: [taskName, priority, completed, taskId]
									};
									await client.query(query);
									res.json({error: null, task: {taskName: taskName, dateOfAdding: rows[0].dateOfAdding, priority: priority, completed: completed, taskId: taskId}});
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
		res.status(500).json({error: "Iternal error!"});
	}
});

router.delete('/projects/:projId/tasks/:taskId', async (req, res) => {
	try {
		const login = req.session.user;
		if (login === undefined)
			res.status(401).json({error: 'You are not logged!'});
		else {
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.status(400).json({error : 'Invalid project ID!'});
			else {
				const taskId = Number(req.params.taskId);
				if (isNaN(taskId))
					res.status(400).json({error : 'Invalid task ID!'});
				else {
					if (!(await db.isUserInTheProject(login, projId)))
						res.status(403).json({error : 'You are not in this project!'});
					else {
						if (!(await db.isTaskInTheProject(taskId, projId)))
							res.status(400).json({error : 'This task not in the project!'});
						else {
							const client = await db.pool.connect();
							try {
								const query = {
									text: 'delete from "tasks" where ("taskId" = $1)',
									values: [taskId]
								};
								await client.query(query);
								res.json({error: null});
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
	} catch (err){
		console.log(err);
		res.status(500).json({error: "Iternal error!"});
	}
});

module.exports = router;