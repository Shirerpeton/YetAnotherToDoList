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
		describe('post to "/projects" with invalid request', () => {
			it('sends json with proper error', done => {
				request.query.onFirstCall().returns({recordset: [{id: 0}]});
				agent
				.post('/projects')
				.send({newProjectName: 'testProject'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid request!');
					done();
				})
			});
		});
		describe('post to "/projects" with proper data', () => {
			it('creates new project and sends json without errors', done => {
				request.query.onFirstCall().returns({recordset: [{id: 0}]});
				agent
				.post('/projects')
				.send({projectName: 'testProject'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(request.query.callCount).to.be.equal(2);
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.commit.calledOnce).to.be.true;
					expect(transaction.rollback.called).to.be.false;
					expect(res.body.project.projectId).to.be.equal(0);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(res.body.project.projectName).to.be.equal('testProject');
					done();
				})
			});
		});
		describe('post to "/projects" with project name more than 50 characters long', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects')
				.send({projectName: 'absolutelyDefinetelyMoreThanMaximum50CharactersLongNameForMyProject'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Project name must be no more than 50 characters long!');
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				})
			});
		});
		describe('post to "/projects with error in database', () => {
			it('rollback transaction and sends json with proper error', done => {
				request.query.onFirstCall().throws('Database error!');
				agent
				.post('/projects')
				.send({projectName: 'testProject'})
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					expect(request.query.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.calledOnce).to.be.true;
					expect(transaction.commit.called).to.be.false;
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					done();
				});
			});
		});
	});
});