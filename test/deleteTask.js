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
			.post('/sign-in')
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
		describe('delete to "/projects/badId/tasks/0"', () => {
			it('sens json with proper error', done => {
				agent
				.delete('/projects/badId/tasks/0')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid project ID!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/tasks/badId"', () => {
			it('sens json with proper error', done => {
				agent
				.delete('/projects/0/tasks/badId')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid task ID!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
	});
});