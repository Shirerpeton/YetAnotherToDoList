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


describe('rename project', () => {
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
		describe('put to "/projects/0/" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.put('/projects/0/')
				.send({projectNewName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid request!');
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
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid project ID!');
					done();
				});
			});
		});
		describe('put to "/projects/0/" without access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.put('/projects/0/')
				.send({projectName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal("You are not in this project!");
					done();
				});
			});
		});
		describe('put to "/projects/0/" with proper data', () => {
			it('renames project and sends json without errors and with new project name', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				agent
				.put('/projects/0/')
				.send({projectName: 'newProjectName'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.project.projectName).to.be.equal('newProjectName');
					expect(res.body.project.projectId).to.be.equal(0);
					done();
				});
			});
		});
	});
});