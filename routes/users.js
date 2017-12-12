const express = require('express')
	, router = express.Router()
	, db = require('../bin/db.js');

router.get('/:username', async (req, res, next) => {
	try {
		const login = req.session.user;
		if (login === req.params.username) {
			const client = await db.pool.connect();
			try {
				const query = {
					text: 'select users."dateOfRegistration" from users where username = $1',
					values: [login]
				};
				const {rows} = await client.query(query);
				const daysSinceReg = Math.floor(((new Date()) - rows[0].dateOfRegistration) / (1000 * 60 * 60 * 24));
				res.render('profile', { title: login, profile: login, regDate: rows[0].dateOfRegistration.toDateString(), daysSinceReg: daysSinceReg });
			} catch (err) {
				throw(err)
			} finally {
				client.release();
			}
		}
		else
			res.status(403).json({error: "Forbidden!"});
	} catch (err) {
		console.log(err);
		res.status(500).json({error: "Iternal error!"});
	}
});

module.exports = router;
