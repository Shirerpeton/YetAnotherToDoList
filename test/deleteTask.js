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

describe('delete task', () => {
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
		describe('delete to "/projects/badId/tasks/0"', () => {
			it('sends json with proper error', done => {
				agent
				.delete('/projects/badId/tasks/0')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid project ID!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/tasks/badId"', () => {
			it('sends json with proper error', done => {
				agent
				.delete('/projects/0/tasks/badId')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid task ID!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/tasks/0" without access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.delete('/projects/0/tasks/0')
				.end((err, res) => {
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal('You are not in this project!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/tasks/0" with task that not in the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(false);
				agent
				.delete('/projects/0/tasks/0')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('This task not in the project!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/tasks/0" with proper data', () => {
			it('deletes task and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isTaskInTheProject.withArgs(0, 0).returns(true);
				agent
				.delete('/projects/0/tasks/0')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					done();
				});
			});
		});
	});
});