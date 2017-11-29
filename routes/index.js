'use strict';

const express = require('express');
const router = require('./indexTasks.js');
const sql = require('mssql');
const db = require('../bin/db.js');

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

router.get('/tinfo', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
		try {
			await pool.connect();
			const result = await pool.request()
			.query('select * from tasks');
			pool.close();
			console.log(result);
		} catch (err) {
			pool.close();
			throw err;
		}
	} catch (err) {
		console.log(err);
	}
});

router.get('/tdel', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
		try {
			await pool.connect();
			const result = await pool.request()
			.query('delete from tasks');
			pool.close();
			console.log(result);
		} catch (err) {
			pool.close();
			throw err;
		}
	} catch (err) {
		console.log(err);
	}
});

/* router.get('/alter', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
		try {
			await pool.connect();
			const result = await pool.request()
			.query('alter table tasks alter column dateOfAdding datetime NULL');
			pool.close();
			console.log(result);
		} catch (err) {
			pool.close();
			throw err;
		}
	} catch (err) {
		console.log(err);
	}
}); */

router.get('/tableinfo/:table/', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
		try {
			const table = req.params.table;
			const text = "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '" + table + "'";
			await pool.connect();
			const result = await pool.request()
			.query(text);
			pool.close();
			console.log(result);
		} catch (err) {
			pool.close();
			throw err;
		}
	} catch (err) {
		console.log(err);
	}
});

/* router.get('/addTaskTable', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
			try {
				await pool.connect();
				const result = await pool.request()
				.query('create table tasks (taskId integer primary key not null identity, taskName varchar(200) not null, projectId integer not null, dateOfAdding date null, dueDate date null, priority integer null, constraint fkTaskProjectId foreign key (projectId) references projects (projectId))');
				pool.close();
				console.log(result);
				} catch (err) {
					pool.close();
					throw err;
				}
	} catch (err) {
		console.log(err);
	}
}); */

module.exports = router;