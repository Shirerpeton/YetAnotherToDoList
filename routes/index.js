'use strict';

const express = require('express')
	, router = require('./indexTasks.js')
	, sql = require('mssql')
	, db = require('../bin/db.js');

router.get('/toggle-completed', (req, res) => {
	if (req.session.showCompleted)
		req.session.showCompleted = false;
	else
		req.session.showCompleted = true;
	res.cookie('showCompleted', req.session.showCompleted, {
			maxAge: 1000 * 60 * 60 * 24 * 30 * 12,
			httpOnly: false
	});
	res.json({error: null});
});

/* router.get('/pinfo', (req, res) => {
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

router.get('/alter', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
		try {
			await pool.connect();
			const result = await pool.request()
			.query('alter table tasks add completed bit not null');
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
 */
 
/*  router.get('/creats', async (req, res) => {
	try {
		const pool = new sql.ConnectionPool(db.config);
		try {
			await pool.connect();
			const result = await pool.request()
			.query('CREATE TABLE dbo.sessions(sid varchar(255) NOT NULL PRIMARY KEY, session varchar(max) NOT NULL, expires datetime NOT NULL)');
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