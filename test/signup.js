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
chai.use(chaiAsPromised);

var sandbox = sinon.sandbox.create();
var server;

var request = {
	input: function() { return this; } ,
	query: sandbox.stub()
};

var pool = {
	connect: sandbox.spy(),
	request: () => { return request; },
	close: sandbox.spy()
};

describe('/users/sign-up', () => {
	afterEach('restore sandbox and restart server', () => {
		sandbox.restore();
		request.query.reset();
		server.close();
	});
	beforeEach('starting server', () => {
		sandbox.stub(sql, 'ConnectionPool').returns(pool);
		server = require('../bin/www');
	});
	describe('get', () => {
		describe('while not logged', done => {
			it('responds with sign-up page', done => {
				chai.request(server)
				.get('/users/sign-up')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
		describe('while logged', () => {
			it('redirects to main page', done => {
				sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
				sandbox.stub(bcrypt, 'promiseCompare').withArgs('testPassword', 'testHash').returns(true);
				let agent = chai.request.agent(server);
				agent
				.post('/users/sign-in')
				.send({username: 'testUsername', password: 'testPassword'})
				.then(res => {
					expect(res.body.error).to.be.null;
				}).then(() => {
					return agent.get('/users/sign-up').redirects(0)
				}).catch(err => {
					expect(err.response).to.have.status(302).and.header('Location', '/');
				}).then(done).catch(console.log);
			});
		});
	});
	describe('post', () => {
		beforeEach('stub functions', () => {
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(bcrypt, 'promiseHash').withArgs('testPassword').returns('testHash');
		});
		describe('with proper data', () => {
			it('register new user', done => {
				chai.request(server)
				.post('/users/sign-up')
				.send({username: 'anotherUsername', password: 'testPassword'})
				.then(res => {
					expect(res.body.error).to.be.null;
					expect(request.query.calledOnce).to.be.true;
					expect(bcrypt.promiseHash.calledWith('testPassword')).to.be.true;
				}).then(done).catch(console.log);
			});
		});
		describe('with wrong login', () => {
			it('send json with proper error', (done) => {
				chai.request(server)
				.post('/users/sign-up')
				.send({username: 'testUsername', password: 'testPassword'})
				.then(res => {
					expect(res.body.error).to.be.equal("That username is already taken!");
					expect(request.query.called).to.be.false;
					expect(bcrypt.promiseHash.called).to.be.false;
				}).then(done).catch(console.log);
			});
		});
	});
});