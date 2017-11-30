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

const testProjects = [{projectName: 'testProject1', projectId: '1'}, {projectName: 'testProject2', projectId: '2'}, {projectName: 'testProject2', projectId: '2'}]
	, testUsers = [{username: 'testUsername'}, {username: 'testUsername1'}, {username: 'testUsername2'}]
	, testUsers1 = [{username: 'testUsername1'}, {username: 'testUsername2'}, {username: 'testUsername3'}];


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
		describe('put to "/projects/0/" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.put('/projects/0/')
				.send({projectNewName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid request!');
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('put to "/projects/badId/" (with invalid project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.put('/projects/badId/')
				.send({projectName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid project ID!');
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('put to "/projects/0/" with name of project more than 50 characters long', () => {
			it('sends json with proper errors', done => {
				request.query.onFirstCall().returns({recordset: [{username: 'testUsername'}]});
				agent
				.put('/projects/0/')
				.send({projectName: 'absolutelyDefinetelyMoreThanMaximum50CharactersLongNewNameForMyProject'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Project name must be no more than 50 characters long!');
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					done();
				});
			});
		});
		describe('put to "/projects/0/" without access to the project', () => {
			it('sends json with proper error', done => {
				request.query.onFirstCall().returns({recordset: []});
				agent
				.put('/projects/0/')
				.send({projectName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal("You are not in this project!");
					expect(request.query.calledOnce).to.be.true;
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('put to "/projects/0/" with proper data', () => {
			it('renames project and sends json without errors and with new project name', done => {
				request.query.onFirstCall().returns({recordset: [{username: 'testUsername'}]});
				agent
				.put('/projects/0/')
				.send({projectName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.projectName).to.be.equal('newProjectName');
					expect(res.body.projectId).to.be.equal(0);
					expect(request.query.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					done();
				});
			});
		});
	});
});