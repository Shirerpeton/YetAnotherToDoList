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

describe('delete project', () => {
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
		describe('delete to "/projects/badId" (with bad project ID)', () => {
			it('sends json with proper error', done => {
				agent
				.delete('/projects/badId')
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid project ID!");
					done();
				});
			});
		});
		describe('delete to "/projects/0" wihtout access to the project', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(false);
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err).to.have.status(403);
					expect(res.body.error).to.be.equal("You are not in this project!");
					done();
				});
			});
		});
		describe('delete to "/projects/0" with error in second query', () => {
			it('sends json with proper error', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				client.query.throws('Database error!');
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err).to.have.status(500);
					expect(res.body.error).to.be.equal("Iternal error!");
					done();
				});
			});
		});
		describe('delete to "/projects/0" with proper data', () => {
			it('deletes project and sends json without errors', done => {
				db.isUserInTheProject.withArgs('testUsername', 0).returns(true);
				agent
				.delete('/projects/0')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					done();
				});
			});
		});
	});
});