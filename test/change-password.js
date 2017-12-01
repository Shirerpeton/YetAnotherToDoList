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


describe('/change-password', () => {
	afterEach('restore sandbox and restart server', done => {
		sandbox.reset();
		sandbox.restore();
		server.close();
		done();
	});
	beforeEach('starting server', done => {
		server = require('../bin/www');
		sandbox.stub(db, 'getUserByUsername');
		done();
	});
	describe('while not logged', () => {
		describe('get to "/change-password"', () => {
			it('redirects to index page', done => {
				chai.request(server)
				.get('/change-password')
				.end((err, res) => {
					expect(err).to.have.status(401);
					expect(res.body.error).to.be.equal('You are not logged!');
					done();
				});
			});
		});
		describe('post to "/change-password"', () => {
			it('sends json with proper error', done => {
				chai.request(server)
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'newTestpassword', repNewPassword: 'repNewTestPassword'})
				.end((err, res) => {
					expect(err).to.have.status(401);
					expect(res.body.error).to.be.equal("You are not logged!");
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.called).to.be.false;
					done();
				});
			});
		});
	});
	describe('while logged', () => {
		let agent;
		beforeEach('logging', done => {
			sandbox.stub(sql, 'ConnectionPool').returns(pool);
			db.getUserByUsername.withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(bcrypt, 'promiseCompare').withArgs('testPassword', 'testHash').returns(true);
			agent = chai.request.agent(server);
			agent
			.post('/sign-in')
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
		describe('get to "/change-password"', () => {
			it('response with change-password page', done => {
				agent
				.get('/change-password')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
		describe('post to "/change-password" with invalid request', () => {
			it('sends json with proper error', done => {
				agent
				.post('/change-password')
				.send({oldPassword: 'testPassword', newPassword: 'Pass', repeatNewPassword: 'Pass'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid request!");
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.called).to.be.false;
					done();
				});
			});
		});
		describe('post to "/change-password" with too short password', () => {
			it('sends json with proper error', done => {
				agent
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'Pass', repeatNewPassword: 'Pass'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Password must be at least 6 characters long!");
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.called).to.be.false;
					done();
				});
			});
		});
		describe('post to "/change-password" with too long password', () => {
			it('sends json with proper error', done => {
				agent
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'definetlyTooLongThanMaximum20CharactersPassword', repeatNewPassword: 'definetlyTooLongThanMaximum20CharactersPassword'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Password must be no more than 20 characters long!");
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.called).to.be.false;
					done();
				});
			});
		});
		describe('post to "/change-password" with passwords that do not match', () => {
			it('sends json with proper error', done => {
				agent
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'testPassword', repeatNewPassword: 'anotherPassword'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Passwords must match!");
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.called).to.be.false;
					done();
				});
			});
		});
		describe('post to "/change-password" with wrong password', () => {
			it('sends json with proper error', done => {
				db.getUserByUsername.withArgs('testUsername').returns({passwordHash: 'testHash'});
				bcrypt.promiseCompare.withArgs('wrongPassword', 'testHash').returns(false);
				agent
				.post('/change-password')
				.send({password: 'wrongPassword', newPassword: 'newPassword', repeatNewPassword: 'newPassword'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid password!");
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('post to "/change-password" with right data', () => {
			it('changes password and seds json without errors', done => {
				db.getUserByUsername.withArgs('testUsername').returns({passwordHash: 'testHash'});
				bcrypt.promiseCompare.withArgs('testPassword', 'testHash').returns(true);
				agent
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'newPassword', repeatNewPassword: 'newPassword'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					expect(request.query.calledOnce).to.be.true;
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(db.getUserByUsername.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('post to "/change-password" with error in getUserByUsername', () => {
			it('sends json with proper error', done => {
				db.getUserByUsername.withArgs('testUsername').throws('Database error!');
				agent
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'newPassword', repeatNewPassword: 'newPassword'})
				.end((err, res) => {
					expect(err).to.have.status(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					expect(request.query.called).to.be.false;
					expect(pool.connect.called).to.be.false;
					expect(pool.close.called).to.be.false;
					expect(db.getUserByUsername.calledOnce).to.be.true;
					done();
				});
			});
		});
		describe('post to "/change-password" with error in query', () => {
			it('sends jsonwith proper error', done => {
				db.getUserByUsername.withArgs('testUsername').returns({passwordHash: 'testHash'});
				bcrypt.promiseCompare.withArgs('testPassword', 'testHash').returns(true);
				request.query.throws('Database error!');
				agent
				.post('/change-password')
				.send({password: 'testPassword', newPassword: 'newPassword', repeatNewPassword: 'newPassword'})
				.end((err, res) => {
					expect(err).to.have.status(500);
					expect(res.body.error).to.be.equal('Iternal error!');
					expect(request.query.calledOnce).to.be.true;
					expect(pool.connect.calledOnce).to.be.true;
					expect(pool.close.calledOnce).to.be.true;
					expect(db.getUserByUsername.calledOnce).to.be.true;
					done();
				});
			});
		});
	});	
});