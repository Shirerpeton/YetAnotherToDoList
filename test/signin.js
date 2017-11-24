'use strict';

const chai = require('chai')
	, expect = chai.expect
	, sinon = require('sinon')
	, chaiHttp = require('chai-http')
	, chaiAsPromised = require("chai-as-promised")
	, sql = require('mssql');

chai.use(chaiHttp);
chai.use(chaiAsPromised);

var server;

var request = {
	input: function() { return this; },
	query: sinon.stub()
};

var pool = {
	connect: sinon.spy(),
	request: () => {return request;},
	close: sinon.spy()
};

describe('/users/sign-in', function() {
	afterEach('reset spies', function() {
		server.close();
		pool.connect.reset();
		pool.close.reset();
	});
	beforeEach('starting server', function() {
		sinon.stub(sql, 'ConnectionPool').returns(pool);
		server = require('../bin/www');
	});
	describe('#get to "/" while not logged', function() {
		it('responds with sign-in page', done => {
			chai.request(server)
			.get('/users/sign-in')
			.end((err, res) => {
				expect(err).to.be.null;
				expect(res).to.have.status(200);
				done();
			});
		});
	});
	describe('#get to "/" while logged', function() {
		it('redirects to main page', function() {
			
		});
	});
	describe('#post to "/" with proper data', function() {
		it('loggs user into system');
	});
	describe('#post to "/" with wrong login', function() {
		it('send json with proper error');
	});
	describe('#post to "/" with wrong password', function() {
		it('send json with proper error');
	});
});