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

describe('add user', () => {
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
		describe('post to "/projects/0/users" (with invalid request)', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/0/users')
				.send({newUserUsername: 'testUsername'})
				.end((err, res) => {
					console.log(err);
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid request!");
					done();
				});
			});
		});
		describe('post to "/projects/badId/users" (with bad project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.post('/projects/badId/users')
				.send({username: 'testUsername'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid project ID!");
					done();
				});
			});
		});
		describe('post to "/projects/0/users" wihtout access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.post('/projects/0/users')
				.send({username: 'testUsername'})
				.end((err, res) => {
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal("You are not in this project!");
					done();
				});
			});
		});
		describe('post to "/projects/0/users" with username of user that does not exist', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.getUserByUsername.withArgs('testUsername1').returns(null);
				agent
				.post('/projects/0/users')
				.send({username: 'testUsername1'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Such user does not exist!");
					done();
				});
			});
		});
		describe('post to "/projects/0/users" with username of user that already in the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.getUserByUsername.withArgs('testUsername1').returns({uername: 'testUsername'});
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				agent
				.post('/projects/0/users')
				.send({username: 'testUsername1'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("That user already in this project!");
					done();
				});
			});
		});
		describe('post to "/projects/0/users" with proper data', () => {
			it('adds new user to the project and sends json without errors and with username', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.getUserByUsername.withArgs('testUsername1').returns({uername: 'testUsername'});
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(false);
				agent
				.post('/projects/0/users')
				.send({username: 'testUsername1'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.user.username).to.be.equal('testUsername1');
					done();
				});
			});
		});
	});
});