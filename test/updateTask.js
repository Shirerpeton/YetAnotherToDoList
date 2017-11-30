'use strict';

const chai = require('chai')
	, expect = chai.expect
	, sinon = require('sinon')
	, chaiHttp = require('chai-http')
	, chaiAsPromised = require("chai-as-promised")
	, sql = require('mssql')
	, bcrypt = require('../bin/bcryptPromise.js')
	, db = require('../bin/db.js');

chai.use(chaiHttp);

let sandbox = sinon.sandbox.create();
let server;

let request = {
	input: function() { return this; },
	query: sandbox.stub()
};

let transaction = {
	request: () => { return request; },
	begin: sandbox.spy(),
	commit: sandbox.spy(),
	rollback: sandbox.spy()
};

let pool = {
	connect: sandbox.spy(),
	request: () => { return request; },
	close: sandbox.spy(),
	transaction: () => { return transaction; }
};

describe('index page', () => {
	describe('while logged', () => {
		let agent;
		beforeEach('logging', done => {
			server = require('../bin/www');
			sandbox.stub(sql, 'ConnectionPool').returns(pool);
			sandbox.stub(db, 'isUserInTheProject');
			sandbox.stub(db, 'isTaskInTheProject');
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(bcrypt, 'promiseCompare').withArgs('testPassword', 'testHash').returns(true);
			agent = chai.request.agent(server);
			agent
			.post('/users/sign-in')
			.send({username: 'testUsername', password: 'testPassword'})
			.then(res => {
				expect(res.body.error).to.be.null;
				db.getUserByUsername.reset();
				bcrypt.promiseCompare.reset();
				done();
			});
		});
		afterEach('reset spies and stubs', done => {
			request.query.reset();
			pool.connect.reset();
			pool.close.reset();
			transaction.begin.reset();
			transaction.commit.reset();
			transaction.rollback.reset();
			sandbox.reset();
			sandbox.restore();
			server.close();
			done();
		});
		describe('put to "/projects/0/tasks/0" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/0/tasks')
				.send({tskName: 'testTaskname'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid request!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/0/tasks')
				.send({priority: 5})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid request!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
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
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid project ID!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(db.isTaskInTheProject.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
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
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid task ID!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(db.isTaskInTheProject.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
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
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not in this project!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(db.isTaskInTheProject.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
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
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('This task not in the project!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(db.isTaskInTheProject.calledOnce).to.be.true;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with empty task name', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: ""})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Task name can not be empty!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(db.isTaskInTheProject.calledOnce).to.be.true;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(request.query.called).to.be.false;
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with proper data', () => {
			it('updates task and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
			request.query.onFirstCall().returns({recordset: [{taskName: 'oldTestTaskName', dateOfAdding: 'someDate', dueDate: 'someOtherDate', priority: null, completed: false}]});
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName"})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.task.taskName).to.be.equal('newTestTaskName');
					expect(res.body.task.taskId).to.be.equal(0);
					expect(res.body.task.dateOfAdding).to.be.equal('someDate');
					expect(res.body.task.dueDate).to.be.equal('someOtherDate');
					expect(res.body.task.priority).to.be.null;
					expect(res.body.task.completed).to.be.false;
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(db.isTaskInTheProject.calledOnce).to.be.true;
					expect(pool.connect.called).to.be.true;
					expect(pool.close.called).to.be.true;
					expect(request.query.called).to.be.true;
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with proper data', () => {
			it('updates task and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				request.query.onFirstCall().returns({recordset: [{taskName: 'oldTestTaskName', dateOfAdding: 'someDate', dueDate: 'someOtherDate', priority: null, completed: false}]});
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName", completed: true, priority: 2})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.task.taskName).to.be.equal('newTestTaskName');
					expect(res.body.task.taskId).to.be.equal(0);
					expect(res.body.task.dateOfAdding).to.be.equal('someDate');
					expect(res.body.task.dueDate).to.be.equal('someOtherDate');
					expect(res.body.task.priority).to.be.equal(2);
					expect(res.body.task.completed).to.be.true;
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(db.isTaskInTheProject.calledOnce).to.be.true;
					expect(pool.connect.called).to.be.true;
					expect(pool.close.called).to.be.true;
					expect(request.query.called).to.be.true;
					done();
				});
			});
		});
		describe('put to "/projects/0/tasks/0" with error in the first query', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				request.query.onFirstCall().throws('Database error!');
				agent
				.put('/projects/0/tasks/0')
				.send({taskName: "newTestTaskName", completed: true, priority: 2})
				.end((err, res) => {
					expect(err).to.have.status(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(db.isTaskInTheProject.calledOnce).to.be.true;
					expect(pool.connect.called).to.be.true;
					expect(pool.close.called).to.be.true;
					expect(request.query.called).to.be.true;
					done();
				});
			});
		});
	});
});