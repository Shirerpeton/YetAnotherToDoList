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

describe('index page', () => {
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
		describe('post to "/projects" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects')
				.send({newProjectName: 'testProject'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid request!');
					done();
				})
			});
		});
		describe('post to "/projects" with proper data', () => {
			it('creates new project and sends json without errors', done => {
				client.query.returns({rows: [{projectId: 0}]});
				agent
				.post('/projects')
				.send({projectName: 'testProject'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(201);
					expect(res.body.error).to.be.null;
					expect(res.body.project.projectId).to.be.equal(0);
					expect(res.body.project.projectName).to.be.equal('testProject');
					done();
				})
			});
		});
		describe('post to "/projects with error in database', () => {
			it('rollback transaction and sends json with proper error', done => {
				client.query.onFirstCall().throws('Database error!');
				agent
				.post('/projects')
				.send({projectName: 'testProject'})
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					done();
				});
			});
		});
	});
});