'use strict';

const chai = require('chai')
	, expect = chai.expect
	, sinon = require('sinon')
	, chaiHttp = require('chai-http')
	, chaiAsPromised = require("chai-as-promised")
	, bcrypt = require('bcrypt')
	, db = require('../bin/db.js');

chai.use(chaiHttp);
chai.use(chaiAsPromised);

var sandbox = sinon.sandbox.create();
var server;

let client = {
	query: sandbox.stub(),
	release: sandbox.spy()
};

describe('/sign-up', () => {
	afterEach('restore sandbox and restart server', () => {
		sandbox.restore();
		sandbox.reset();
		client.query.reset();
		client.release.reset();
	});
	beforeEach('starting server', () => {
		sandbox.stub(db.pool, 'connect').returns(client);
		server = require('../bin/www');
	});
	describe('get', () => {
		describe('while not logged', () => {
			it('responds with sign-up page', done => {
				chai.request(server)
				.get('/sign-up')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
	});
	describe('post', () => {
		beforeEach('stub functions', () => {
			sandbox.stub(db, 'getUserByUsername').withArgs('testUsername').returns({username: 'testUsername', passwordHash: 'testHash'});
			sandbox.stub(bcrypt, 'hash').withArgs('testPassword', 10).returns('testHash');
		});
		describe('with proper data', () => {
			it('register new user', done => {
				chai.request(server)
				.post('/sign-up')
				.send({username: 'anotherUsername', password: 'testPassword', repeatPassword: 'testPassword'})
				.then(res => {
					expect(res.body.error).to.be.null;
					expect(client.query.calledOnce).to.be.true;
					expect(bcrypt.hash.calledWith('testPassword', 10)).to.be.true;
				}).then(done).catch(console.log);
			});
		});
		describe('with invalid request', () => {
			it('send json with proper error', done => {
				chai.request(server)
				.post('/sign-up')
				.send({myUsername: 'use', myPassword: 'testPassword', repeatMyPassword: 'testPassword'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid request!");
					expect(client.query.called).to.be.false;
					expect(bcrypt.hash.called).to.be.false;
					done();
				});
			});
		});
		describe('with too short login', () => {
			it('send json with proper error', done => {
				chai.request(server)
				.post('/sign-up')
				.send({username: 'u', password: 'testPassword', repeatPassword: 'testPassword'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("Invalid request!");
					expect(client.query.called).to.be.false;
					expect(bcrypt.hash.called).to.be.false;
					done();
				});
			});
		});
		describe('with already taken login', () => {
			it('send json with proper error', done => {
				chai.request(server)
				.post('/sign-up')
				.send({username: 'testUsername', password: 'testPassword', repeatPassword: 'testPassword'})
				.end((err, res) => {
					expect(err).to.have.status(400);
					expect(res.body.error).to.be.equal("That username is already taken!");
					expect(client.query.called).to.be.false;
					expect(bcrypt.hash.called).to.be.false;
					done();
				});
			});
		});
	});
});