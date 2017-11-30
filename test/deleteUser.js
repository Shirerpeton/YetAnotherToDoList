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
		describe('delete to "/projects/badId/users/testUsername"', () => {
			it('sens json with proper error', done => {
				agent
				.delete('/projects/badId/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid project ID!');
					expect(db.isUserInTheProject.called).to.be.false;
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" without access to the project', () => {
			it('sens json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not in this project!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" when user whith name username not in the project', () => {
			it('sens json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(false);
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('That user not in this project!');
					expect(db.isUserInTheProject.callCount).to.be.equal(2);
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" with error in the database', () => {
			it('sens json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).throws('Database error!');
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					expect(db.isUserInTheProject.calledOnce).to.be.true;
					expect(request.query.called).to.be.false;
					expect(pool.connect.calledOnce).to.be.false;
					expect(pool.close.calledOnce).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" with error in first query', () => {
			it('rollback transaction and sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				request.query.onFirstCall().throws('Database error!');
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal("Iternal error!");
					expect(request.query.calledOnce).to.be.true;
					expect(db.isUserInTheProject.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.calledOnce).to.be.true;
					expect(transaction.commit.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of other user and when there are other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				request.query.onSecondCall().returns({recordset: [{username: 'testUsername'}]});
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.false;
					expect(request.query.callCount).to.be.equal(2);
					expect(db.isUserInTheProject.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.called).to.be.false;
					expect(transaction.commit.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of yourself and when there are other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				request.query.onSecondCall().returns({recordset: [{username: 'testUsername'}]});
				agent
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.true;
					expect(request.query.callCount).to.be.equal(2);
					expect(db.isUserInTheProject.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.called).to.be.false;
					expect(transaction.commit.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of other user and when there are no other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				request.query.onSecondCall().returns({recordset: []});
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.false;
					expect(request.query.callCount).to.be.equal(4);
					expect(db.isUserInTheProject.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.called).to.be.false;
					expect(transaction.commit.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of yourself and when there are no other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				request.query.onSecondCall().returns({recordset: []});
				agent
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.true;
					expect(request.query.callCount).to.be.equal(4);
					expect(db.isUserInTheProject.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.called).to.be.false;
					expect(transaction.commit.calledOnce).to.be.true;
					done();
				});
			});
		});
	});
});