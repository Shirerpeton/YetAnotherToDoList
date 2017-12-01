'use strict';

const express = require('express')
	, router = express.Router()
	, sql = require('mssql')
	, db = require('../bin/db.js')
	, Ajv = require('ajv')
	, ajv = new Ajv()
	, schemas = require('../bin/jsonSchemas.js');

const addProjectValidation = ajv.compile(schemas.addProject);
const renameProjectValidation = ajv.compile(schemas.renameProject);
	
router.get('/', async (req, res) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.render('index', {title: 'Yet Another ToDo List', profile: login});
		else
			res.render('welcome', {title: 'Welcome to the Yet Another ToDo List'});
	} catch (err) {
		console.log(err);
		res.status(500).render('error', { profile: req.session.user, title: 'error', message: 'Iternal error!'});
	}
});

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

router.use((req, res, next) => {
	if (req.session.user !== undefined)
		next();
	else
		res.status(401).json({error: 'You are not logged!'});
});

router.get('/projects', async(req, res) => {
	try {
		const login = req.session.user;
			res.json({error: null, projects: await db.getProjectsOfUser(login)});
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});

router.post('/projects', async (req, res) => {
	try {
		const login = req.session.user;
		if (!addProjectValidation(req.body))
			res.status(400).json({"error": "Invalid request!", "errorDetails": addProjectValidation.errors});
		else
		{
			const projName = req.body.projectName;
			if (projName.length === 0)
				res.status(400).json({error: 'Project name can not be empty!'});
			else if (projName.length > 50)
				res.status(400).json({error: 'Project name must be no more than 50 characters long!'});
			else
			{
				const pool = new sql.ConnectionPool(db.config);
				try {
					await pool.connect();
					const transaction = pool.transaction();
					try {
						await transaction.begin();
						const result = await transaction.request()
						.input('projName', sql.VarChar(50), projName)
						.query('insert into projects values (@projName); SELECT SCOPE_IDENTITY() AS id');
						await transaction.request()
						.input('login', sql.VarChar(20), login)
						.input('projId', sql.Int, result.recordset[0].id)
						.query('insert into usersProjects (username, projectId) values (@login, @projId)');
						await transaction.commit();
						res.status(201).json({error: null, project: {projectId: result.recordset[0].id , projectName: projName}});
					} catch (err) {
						try {
							await transaction.rollback();
						} catch (err) {
							console.log(err);
						}
						throw (err);
					}
					pool.close();
				} catch (err) {
					pool.close();
					throw (err);
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
		const projId = Number(req.params.projId);
		if (isNaN(projId))
			res.status(400).json({error : 'Invalid project ID!'});
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
					res.status(403).json({ error: "You are not in this project!" });
					pool.close();
				}
				else
				{
					let transaction = pool.transaction();
					try {
						await transaction.begin();
						await transaction.request()
						.input('projId', sql.Int, projId)
						.query('delete from tasks where projectId = @projId');
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
	} catch (err) {
		console.log(err);
		res.status(500).json({error: 'Iternal error!'});
	}
});


router.put('/projects/:projId/', async (req, res) => {
	try {
		const login = req.session.user;
		if (!renameProjectValidation(req.body))
			res.status(400).json({"error": "Invalid request!", "errorDetails": renameProjectValidation.errors});
		else
		{
			const projId = Number(req.params.projId);
			if (isNaN(projId))
				res.status(400).json({error : 'Invalid project ID!'});
			else
			{
				const projName = req.body.projectName;
				if (projName.length > 50)
					res.status(400).json({error: 'Project name must be no more than 50 characters long!'})
				else
				{
					if (!(await db.isUserInTheProject(login, projId)))
						res.status(403).json({error: "You are not in this project!"});
					else {
						const pool = new sql.ConnectionPool(db.config);
						try {
							await pool.connect();
							await pool.request()
							.input('projId', sql.Int, projId)
							.input('projName', sql.VarChar(50), projName)
							.query('update projects set projectName = @projName where projectId = @projId');
							res.json({error: null, project: {projectName: projName, projectId: projId}});
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
		res.status(500).json({error: 'Iternal error!'});
	}
});

module.exports = router;