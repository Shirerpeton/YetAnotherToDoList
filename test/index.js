'use strict';

const server = require('../bin/www');
const chai = require('chai')
	, expect = chai.expect
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

after('closing server', function() {
	server.close();
});

describe('/', function() {
	describe('#get to "/" while not logged', function() {
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
	describe('#get to "/" while logged', function() {
		it('responds with main page with projects of current user');
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
});