'use strict';

const chai = require('chai')
	, expect = chai.expect
	, sinon = require('sinon')
	, chaiHttp = require('chai-http')
	, chaiAsPromised = require("chai-as-promised")
	, sql = require('mssql')
	, db = require('../bin/db.js');

chai.use(chaiHttp);

var request = {
	input: function() { return this; } ,
	query: sinon.stub()
};

var pool = {
	connect: sinon.spy(),
	request: () => { return request; },
	close: sinon.spy()
};

describe('/', function() {
	afterEach('restore sandbox and restart server', () => {
		sandbox.restore();
		server.close();
		request.query.reset();
		pool.connect.reset();
		pool.close.reset();
	});
	beforeEach('starting server', () => {
		sandbox.stub(sql, 'ConnectionPool').returns(pool);
		server = require('../bin/www');
	});
	describe('while not logged', 90 => {
		describe('get to "/" while not logged', done => {
			it('responds with index page', done => {
				chai.request(server)
				.get('/users/sign-in')
				.end((err, res) => {
					expect(err).to.be.null;
					expect(res).to.have.status(200);
					done();
				});
			});
		});
	});
	describe('while logged', () => {
		describe('#get to "/" while logged', done => {
			it('responds with main page with projects of current user', () => {
			
			});
		});
		describe('#get to "/projects/:projectId" while not logged', function() {
			it('redirect to proper error page');
		});
		describe('#get to "/projects/:projectId" while logged as user without access to the project', function() {
			it('redirect to proper error page');
		});
		describe('#get to "/projects/:projectId" while logged as user with access to the project', function() {
			it('responds with main page with projects of currentt user and users of selected project');
		});
		describe('#post to "/" with wrong password', function() {
			it('send json with proper error');
		});
	})
});