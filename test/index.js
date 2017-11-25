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
	input: function() { return this; } ,
	query: sinon.stub()
};

let pool = {
	connect: sinon.spy(),
	request: () => { return request; },
	close: sinon.spy()
};

const testProjects = [{projectName: 'testProject1', projectId: '1'}, {projectName: 'testProject2', projectId: '2'}, {projectName: 'testProject2', projectId: '2'}];

describe('index page', function() {
	afterEach('restore sandbox and restart server', () => {
		sandbox.restore();
		server.close();
		request.query.reset();
		pool.connect.reset();
		pool.close.reset();
	});
	beforeEach('starting server', () => {
		sandbox.stub(sql, 'ConnectionPool').returns(pool);
		server = require('../bin/www');
	});
	describe('while not logged', () => {
		describe('get to "/"', () => {
			it('responds with index page', done => {
				chai.request(server)
				.get('/')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
		describe('get to "/projects"', () => {
			it('respond with proper error', done => {
				chai.request(server)
				.get('/projects').redirects(0)
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('get to "/projects/0/users"', () => {
			it('redirects to the main page', done => {
				chai.request(server)
				.get('/projects/0/users').redirects(0)
				.catch(err => {
					expect(err.response).to.have.status(302).and.header('Location', '/');
					done();
				});
			});
		});
	});
	describe('while logged', () => {
		let agent;
		beforeEach('logging', done => {
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(bcrypt, 'promiseCompare').withArgs('testPassword', 'testHash').returns(true);
			agent = chai.request.agent(server);
			agent
			.post('/users/sign-in')
			.send({username: 'testUsername', password: 'testPassword'})
			.then(res => {
				expect(res.body.error).to.be.null;
				done();
			});
		});
		describe('get to "/"', done => {
			it('responds with main page', done => {
				agent
				.get('/')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
		describe('get to "/projects"', done => {
			it("gets list of user's projects", done => {
				sandbox.stub(db, 'getProjectsOfUser').withArgs('testUsername').returns(testProjects);
				agent
				.get('/projects')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.projects).to.deep.equal(testProjects);
					done();
				});
			});
		});
		describe('#get to "/projects/:projectId" while not logged', function() {
			it('redirect to proper error page');
		});
		describe('#get to "/projects/:projectId" while logged as user without access to the project', function() {
			it('redirect to proper error page');
		});
		describe('#get to "/projects/:projectId" while logged as user with access to the project', function() {
			it('responds with main page with projects of currentt user and users of selected project');
		});
		describe('#post to "/" with wrong password', function() {
			it('send json with proper error');
		});
	})
});