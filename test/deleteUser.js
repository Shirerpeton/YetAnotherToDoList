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

describe('delete user', () => {
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
		describe('delete to "/projects/badId/users/testUsername"', () => {
			it('sens json with proper error', done => {
				agent
				.delete('/projects/badId/users/testUsername')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('Invalid project ID!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" without access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.have.status(403);
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" when user whith name username not in the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(false);
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal('That user not in this project!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" with error in the database', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).throws('Database error!');
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername" with error in first query', () => {
			it('rollback transaction and sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				client.query.onFirstCall().throws('Database error!');
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err.status).to.be.equal(500);
					expect(res.body.error).to.be.equal("Iternal error!");
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of other user and when there are other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				client.query.returns({rows: [{username: 'testUsername'}, {username: 'test'}]});
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of yourself and when there are other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				client.query.returns({rows: [{username: 'testUsername'}, {username: 'test'}]});
				agent
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.true;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of other user and when there are no other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				db.isUserInTheProject.withArgs('testUsername1', 0).returns(true);
				client.query.returns({rows: [{username: 'testUsername'}]});
				agent
				.delete('/projects/0/users/testUsername1')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.false;
					done();
				});
			});
		});
		describe('delete to "/projects/0/users/testUsername1" with username of yourself and when there are no other users in the project', () => {
			it('deletes user and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				client.query.returns({rows: [{username: 'testUsername'}]});
				agent
				.delete('/projects/0/users/testUsername')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(res.body.reload).to.be.true;
					done();
				});
			});
		});
	});
});