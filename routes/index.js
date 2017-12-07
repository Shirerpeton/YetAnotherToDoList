'use strict';

const express = require('express')
	, router = require('./indexTasks.js')
	, db = require('../bin/db.js');

router.get('/', async (req, res) => {
	try {
		const login = req.session.user;
		if (login !== undefined)
			res.render('index', {title: 'Yet Another ToDo List', profile: login});
		else
			res.render('welcome', {title: 'Welcome to the Yet Another ToDo List'});
	} catch (err) {
		console.log(err);
		res.status(500).render('error', { profile: req.session.user, title: 'error', message: 'Iternal error!'});
	}
});	

router.get('/contact-us', async (req, res) => {
	try {
		res.render('contactus', {title: 'Contact Us'});
	} catch (err) {
		console.log(err);
		res.status(500).render('error', { profile: req.session.user, title: 'error', message: 'Iternal error!'});
	}
});	

module.exports = router;