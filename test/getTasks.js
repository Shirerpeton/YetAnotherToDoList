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
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(db, 'isUserInTheProject');
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
		describe('get to "/projects/badId/tasks" (with bad project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.get('/projects/badId/tasks')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid project ID!');
					done();
				});
			});
		});
		describe('get to "/projects/0/tasks" without access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.get('/projects/0/tasks')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not in this project!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('get to "/projects/0/tasks" with proper data', () => {
			it('sends json with task list and without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				request.query.onFirstCall().returns({recordset : [{taskName: 'testTaskName'}]});
				agent
				.get('/projects/0/tasks')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.tasks).to.deep.equal([{taskName: 'testTaskName'}]);
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(request.query.calledOnce).to.be.true;
					done();
				});
			});
		});
	});
});