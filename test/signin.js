'use strict';

const server = require('../bin/www');
const chai = require('chai')
	, expect = chai.expect
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

after('closing server', function() {
	server.close();
});

describe('/users/sign-in', function() {
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
		it('redirects to main page');
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