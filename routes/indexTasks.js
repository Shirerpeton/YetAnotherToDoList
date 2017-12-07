'use strict';

const express = require('express')
	, router = require('./indexUsers.js')
	, db = require('../bin/db.js')
	, moment = require('moment')
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
			else
			{
				if (!(await db.isUserInTheProject(login, projId)))
					res.status(403).json({error : 'You are not in this project!'});
				else {
					const pool = new sql.ConnectionPool(db.config);
					try {
						await pool.connect();
						const result = await pool.request()
						.input('projId', sql.Int, projId)
						.query('select * from tasks where (projectId = @projId)');
						res.json({error: null, tasks: result.recordset});
						pool.close();
					} catch (err) {
						pool.close();
						throw err;
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
						if (taskName === '')
							res.status(400).json({error: 'Task name can not be empty!'});
						else {	
							const dueDate = (req.body.dueDate !== undefined) ? moment(req.body.dueDate).toISOString() : null;
							const priority = (req.body.priority !== undefined) ? Number(req.body.priority) : null;
							const currentDate = moment().toISOString();
							const pool = new sql.ConnectionPool(db.config);
							try {
								await pool.connect();
								const result = await pool.request()
								.input('taskName', sql.VarChar(200), taskName)
								.input('projId', sql.Int, projId)
								.input('date', sql.VarChar, currentDate)
								.input('dueDate', sql.VarChar, dueDate)
								.input('priority', sql.Int, priority)
								.query('insert into tasks (taskName, projectId, dateOfAdding, dueDate, priority, completed) values (@taskName, @projId, @date, @dueDate, @priority, 0); SELECT SCOPE_IDENTITY() AS id');
								res.status(201).json({error: null, task: {taskName: taskName, dateOfAdding: currentDate, dueDate: dueDate, priority: priority, taskId: result.recordset[0].id, completed: false}});
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
			else
			{
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
								let taskName = req.body.taskName;
								if (taskName === '')
									res.status(400).json({error: 'Task name can not be empty!'});
								else {
									const pool = new sql.ConnectionPool(db.config);
									try {
										await pool.connect();
										const result = (await pool.request()
										.input('taskId', sql.Int, taskId)
										.query('select * from tasks where (taskId = @taskId)')).recordset[0];
										taskName = (taskName !== undefined) ? taskName : result.taskName;
										let dueDate = moment(req.body.dueDate);
										dueDate = ((req.body.dueDate !== undefined) && (dueDate.isValid())) ? moment(req.body.dueDate).toISOString() : result.dueDate;
										const priority = (req.body.priority !== undefined) ? Number(req.body.priority) : result.priority;
										const completed = (req.body.completed !== undefined) ? req.body.completed : result.completed;
										await pool.request()
										.input('taskId', sql.Int, taskId)
										.input('taskName', sql.VarChar(200), taskName)
										.input('dueDate', sql.VarChar, dueDate)
										.input('priority', sql.Int, priority)
										.input('completed', sql.Bit, completed ? 1 : 0)
										.query('update tasks set taskName = @taskName, dueDate = @dueDate, priority = @priority, completed = @completed where (taskId = @taskId)');
										res.json({error: null, task: {taskName: taskName, dateOfAdding: result.dateOfAdding, dueDate: dueDate, priority: priority, completed: completed, taskId: taskId}});
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
							const pool = new sql.ConnectionPool(db.config);
							try {
								await pool.connect();
								await pool.request()
								.input('taskId', sql.Int, taskId)
								.query('delete from tasks where (taskId = @taskId)');
								res.json({error: null});
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
	} catch (err){
		console.log(err);
		res.status(500).json({error: "Iternal error!"});
	}
});

module.exports = router;