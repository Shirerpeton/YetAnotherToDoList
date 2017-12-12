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
					expect(err).to.have.status(401);
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('get to "/projects/0"', () => {
			it('redirects to the main page', done => {
				chai.request(server)
				.get('/projects/0')
				.end((err, res) => {
					expect(err).to.have.status(401);
					done();
				});
			});
		});
		describe('get to "/projects/0/users"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.get('/projects/0/users').redirects(0)
				.end((err, res) => {
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
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
					expect(err).to.have.status(401);
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
	});
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
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal("You are not in that project!");
					done();
				});
			});
		});
		describe('get to "/projects/0/users with access to the project"', () => {
			it('get list of projects', done => {
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
	});
});