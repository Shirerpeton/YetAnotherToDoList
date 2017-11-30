'use strict';

const express = require('express');
const router = require('./indexUsers.js');
const sql = require('mssql');
const db = require('../bin/db.js');
const moment = require('moment');

router.get('/projects/:projId/tasks', async (req, res) => {
	try {
		const login = req.session.user;
		const projId = Number(req.params.projId);
		if (isNaN(projId))
			res.json({error : 'Invalid project ID!'});
		else
		{
			if (!(await db.isUserInTheProject(login, projId)))
					res.json({error : 'You are not in this project!'});
			else
			{
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
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.post('/projects/:projId/tasks', async (req, res) => {
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
				if (!(await db.isUserInTheProject(login, projId)))
						res.json({error : 'You are not in this project!'});
				else
				{
					const taskName = req.body.taskName;
					if (taskName === '')
						res.json({error: 'Task name can not be empty!'});
					else
					{
						let dueDate = moment(req.body.dueDate);
						let priority = Number(req.body.priority);
						if (isNaN(priority) || ((priority !== 0) && (priority !== 1) && (priority !== 2)))
							priority = null;
						const currentDate = moment();
						const pool = new sql.ConnectionPool(db.config);
						try {
							await pool.connect();
							const result = await pool.request()
							.input('taskName', sql.VarChar(20), taskName)
							.input('projId', sql.Int, projId)
							.input('date', sql.VarChar, currentDate.toISOString())
							.input('dueDate', sql.VarChar, dueDate.isValid() ? dueDate.toISOString() : null)
							.input('priority', sql.Int, priority)
							.query('insert into tasks (taskName, projectId, dateOfAdding, dueDate, priority, completed) values (@taskName, @projId, @date, @dueDate, @priority, 0); SELECT SCOPE_IDENTITY() AS id');
							res.json({error: null, taskName: taskName, date: currentDate.format(), dueDate: dueDate.format(), priority: priority, taskId: result.recordset[0].id});
							pool.close();
						} catch (err) {
							pool.close();
							throw err;
						}
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.json({error: "Iternal error!"});
	}
});

module.exports = router;