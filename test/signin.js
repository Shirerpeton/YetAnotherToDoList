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

describe('/users/sign-in', () => {
	afterEach('restore sandbox and restart server', () => {
		sandbox.restore();
		server.close();
	});
	beforeEach('starting server', () => {
		server = require('../bin/www');
	});
	describe('get', () => {
		describe('while not logged', done => {
			it('responds with sign-in page', done => {
				chai.request(server)
				.get('/sign-in')
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
				let agent = chai.request.agent(server)
				agent
				.post('/sign-in')
				.send({username: 'testUsername', password: 'testPassword'})
				.then(res => {
					expect(res.body.error).to.be.null;
				}).then(() => {
					return agent.get('/users/sign-in').redirects(0)
				}).catch(err => {
					expect(err.response).to.have.status(302).and.header('Location', '/');
				}).then(done).catch(console.log);
			});
		});
	});
	describe('post', () => {
		beforeEach('stub functions', () => {
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(bcrypt, 'promiseCompare').withArgs('testPassword', 'testHash').returns(true);
		});
		describe('with invalid request', () => {
			it('loggs user into system', done => {
				chai.request(server)
				.post('/sign-in')
				.send({myUsername: 'testUsername', muPassword: 'testPassword'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid request!');
					done();
				});
			});
		});
		describe('with proper data', () => {
			it('loggs user into system', done => {
				chai.request(server)
				.post('/sign-in')
				.send({username: 'testUsername', password: 'testPassword'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.null;
					done();
				});
			});
		});
		describe('with wrong login', () => {
			it('send json with proper error', done => {
				chai.request(server)
				.post('/sign-in')
				.send({username: 'wrongUsername', password: 'testPassword'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('That user do not exist!');
					done();
				});
			});
		});
		describe('with wrong password', () => {
			it('send json with proper error', done => {
				chai.request(server)
				.post('/sign-in')
				.send({username: 'testUsername', password: 'wrongPassword'})
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res.body.error).to.be.equal('Invalid password!');
					done();
				});
			});
		});
	});
});