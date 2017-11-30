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
	afterEach('restore sandbox and restart server', done => {
		sandbox.reset();
		sandbox.restore();
		server.close();
		done();
	});
	beforeEach('starting server', done => {
		server = require('../bin/www');
		done();
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
			it('sends json with proper error', done => {
				chai.request(server)
				.get('/projects')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('get to "/projects/0"', () => {
			it('redirects to the main page', done => {
				chai.request(server)
				.get('/projects/0').redirects(0)
				.catch(err => {
					expect(err.response).to.have.status(302).and.header('Location', '/');
					done();
				});
			});
		});
		describe('get to "/projects/0/users"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.get('/projects/0/users').redirects(0)
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('post to "/projects"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.post('/projects')
				.send({projName: 'testProject'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('post to "/projects/0/users"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.post('/projects/0/users')
				.send({username: 'testUsername'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('delete to "/projects/0"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.delete('/projects/0')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('put to "/projects/0/"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.put('/projects/0/')
				.send({projectName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('get to "/projects/0/tasks"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.get('/projects/0/tasks')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('post to "/projects/0/tasks")', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.post('/projects/0/tasks')
				.send({taskName: 'testTaskname', dueDate: new Date(), priority: 0})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
	});
	describe('while logged', () => {
		let agent;
		beforeEach('logging', done => {
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
			done();
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
		describe('get to "/projects/0"', () => {
			it('responds with main page', done => {
				agent
				.get('/projects/0')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
		describe('get to "/projects/0/users without access to the project"', () => {
			it('sends json with proper error', done => {
				sandbox.stub(db, 'getUsersOfProject').withArgs(0).returns(testUsers1);
				agent
				.get('/projects/0/users')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal("You are not in that project!");
					done();
				});
			});
		});
		describe('get to "/projects/0/users with access to the project"', () => {
			it('sends json with proper error', done => {
				sandbox.stub(db, 'getUsersOfProject').withArgs(0).returns(testUsers);
				agent
				.get('/projects/0/users')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.users).to.deep.equal(testUsers);
					done();
				});
			});
		});
		describe('delete to "/projects/badId" (with bad project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.delete('/projects/badId')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal("Invalid project ID!");
					expect(pool.connect.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0" wihtout access to the project', () => {
			it('sends json with proper error', done => {
				request.query.onFirstCall().returns({recordset: []});
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal("You are not in this project!");
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(request.query.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('delete to "/projects/0" with error in first query', () => {
			it('sends json with proper error', done => {
				request.query.onFirstCall().throws('Database error');
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal("Iternal error!");
					expect(request.query.calledOnce).to.be.true;
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('delete to "/projects/0" with error in second query', () => {
			it('sends json with proper error', done => {
				request.query.onFirstCall().returns({recordset: [{username: 'testUsername'}]});
				request.query.onSecondCall().throws('Database error!');
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal("Iternal error!");
					expect(request.query.callCount).to.be.equal(2);
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(transaction.begin.calledOnce).to.be.true;
					expect(transaction.rollback.calledOnce).to.be.true;
					expect(transaction.commit.called).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0" with proper data', () => {
			it('deletes project and sends json without errors', done => {
				request.query.onFirstCall().returns({recordset: [{username: 'testUsername'}]});
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(request.query.callCount).to.be.equal(4);
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