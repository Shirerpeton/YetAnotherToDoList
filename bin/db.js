'use strict';

const {Pool} = require('pg');
const config = require('./config.js')

let db = {};

db.pool = new Pool(config)

db.getProjectsOfUser = async username => {
	try {
		const client = await db.pool.connect();
		try {
			const query = {
				text: 'select p."projectName", p."projectId" from "usersProjects" as up inner join "users" as u on (u."username" = up."username" and u."username" = $1) inner join "projects" as p on (p."projectId" = up."projectId")',
				values: [username]
			}
			const {rows} = await client.query(query);
			return rows;
		} catch (err){
			throw err;
		} finally {
			client.release();
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
};

db.getUsersOfProject = async projId => {
	try {
		const client = await db.pool.connect();
		try {
			const query = {
				text: 'select u."username" from "usersProjects" as up join "users" as u on (up."username" = u."username") join "projects" as p on (up."projectId" = p."projectId" and p."projectId" = $1)',
				values: [projId]
			}
			const {rows} = await client.query(query);
			return rows;
		} catch (err){
			throw err;
		} finally {
			client.release();
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
};

db.getUserByUsername = async username => {
	try {
		const client = await db.pool.connect();
		try {
			const {rows} = await client.query('select * from "users" where "username" = $1', [username]);
			return (rows[0] !== undefined) ? rows[0] : null;
		} catch (err) {
			throw (err);
		} finally {
			client.release();
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
};

db.isUserInTheProject = async (username, projId) => {
	try {
		const client = await db.pool.connect();
		try {
			const query = {
				text: 'select * from "usersProjects" where ("username" = $1 and "projectId" = $2)',
				values: [username, projId]
			}
			const {rows} = await client.query(query);
			return (rows.length !== 0);
		} catch (err){
			throw err;
		} finally {
			client.release();
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
}

db.isTaskInTheProject = async (taskId, projId) => {
	try {
		const client = await db.pool.connect();
		try {
			const query = {
				text: 'select * from "tasks" where ("taskId" = $1 and "projectId" = $2)',
				values: [taskId, projId]
			}
			const {rows} = await client.query(query);
			return (rows.length !== 0);
		} catch (err){
			throw err;
		} finally {
			client.release();
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
}

module.exports = db;