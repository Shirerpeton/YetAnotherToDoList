'use strict';

const chai = require('chai')
	, expect = chai.expect
	, sinon = require('sinon')
	, chaiHttp = require('chai-http')
	, chaiAsPromised = require("chai-as-promised")
	, bcrypt = require('bcrypt')
	, db = require('../bin/db.js');

chai.use(chaiHttp);

let sandbox = sinon.sandbox.create();
let server;

let client = {
	query: sandbox.stub(),
	release: sandbox.spy()
};

describe('update task', () => {
	describe('while logged', () => {
		let agent;
		beforeEach('logging', done => {
			server = require('../bin/www');
			sandbox.stub(db.pool, 'connect').returns(client);
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(db, 'isUserInTheProject');
			sandbox.stub(db, 'isTaskInTheProject');
			sandbox.stub(bcrypt, 'compare').withArgs('testPassword', 'testHash').returns(true);
			agent = chai.request.agent(server);
			agent
			.post('/sign-in')
			.send({username: 'testUsername', password: 'testPassword'})
			.then(res => {
				expect(res.body.error).to.be.null;
				db.getUserByUsername.reset();
				bcrypt.compare.reset();
				done();
			});
		});
		afterEach('reset spies and stubs', done => {
			sandbox.restore();
			sandbox.reset();
			client.query.reset();
			client.release.reset();
			server.close();
			done();
		});
		describe('put to "/projects/0/tasks/0" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/0/tasks')
				.send({tskName: 'testTaskname'})
				.end((err, res) => {
					expect(err).to.be.have.status(400);
					expect(res.body.error).to.be.equal('Invalid request!');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.put('/projects/0/tasks/0')
				.send({priority: 5})
				.end((err, res) => {
					expect(err).to.be.have.status(400);
					expect(res.body.error).to.be.equal('Invalid request!');
					done();
				});
			});
		});
		describe('put to "/projects/badId/tasks/0" (with invalid project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.put('/projects/badId/tasks/0')
				.send({taskName: "newTestTaskName"})
				.end((err, res) => {
					expect(err).to.be.have.status(400);
					expect(res.body.error).to.be.equal('Invalid project ID!');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/badId" (with invalid task ID)', () => {
			it('sends json with proper error', done => {
				agent
				.put('/projects/0/tasks/badId')
				.send({taskName: "newTestTaskName"})
				.end((err, res) => {
					expect(err).to.be.have.status(400);
					expect(res.body.error).to.be.equal('Invalid task ID!');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" without access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName"})
				.end((err, res) => {
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal('You are not in this project!');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with id of task that not in the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(false);
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName"})
				.end((err, res) => {
					expect(err).to.have.status(404);
					expect(res.body.error).to.be.equal('This task not in the project!');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with proper data', () => {
			it('updates task and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				client.query.onFirstCall().returns({rows: [{taskName: 'oldTestTaskName', dateOfAdding: 'someDate', priority: null, completed: false}]});
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName"})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.task.taskName).to.be.equal('newTestTaskName');
					expect(res.body.task.taskId).to.be.equal(0);
					expect(res.body.task.dateOfAdding).to.be.equal('someDate');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with proper data', () => {
			it('updates task and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				client.query.onFirstCall().returns({rows: [{taskName: 'oldTestTaskName', dateOfAdding: 'someDate', priority: 'low', completed: false}]});
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName", completed: true, priority: 'low'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.task.taskName).to.be.equal('newTestTaskName');
					expect(res.body.task.taskId).to.be.equal(0);
					expect(res.body.task.dateOfAdding).to.be.equal('someDate');
					expect(res.body.task.priority).to.be.equal('low');
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with error in the first query', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				client.query.onFirstCall().throws('Database error!');
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName", completed: true, priority: 'low'})
				.end((err, res) => {
					expect(err).to.have.status(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					done();
				});
			});
		});
	});
});