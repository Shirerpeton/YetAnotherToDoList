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

describe('add task', () => {
	describe('while logged', () => {
		let agent;
		beforeEach('logging', done => {
			server = require('../bin/www');
			sandbox.stub(db.pool, 'connect').returns(client);
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(db, 'isUserInTheProject');
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
		describe('post to "/projects/0/tasks" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/0/tasks')
				.send({tskName: 'testTaskname'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid request!');
					done();
				});
			});
		});
		describe('post to "/projects/badID/tasks" (with bad project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/badID/tasks')
				.send({taskName: 'testTaskname'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid project ID!');
					done();
				});
			});
		});
		describe('post to "/projects/0/tasks" without access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.post('/projects/0/tasks')
				.send({taskName: 'testTaskname'})
				.end((err, res) => {
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal('You are not in this project!');
					done();
				});
			});
		});
		describe('post to "/projects/0/tasks" with proper data', () => {
			it('creates task and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				client.query.returns({rows: [{taskId: 0}]});
				agent
				.post('/projects/0/tasks')
				.send({taskName: 'testTaskName', priority: 'low'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.task.taskName).to.be.equal('testTaskName');
					expect(res.body.task.taskId).to.be.equal(0);
					expect(res.body.task.priority).to.be.equal('low');
					done();
				});
			});
		});
	});
});