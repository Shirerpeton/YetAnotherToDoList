const bcrypt = require('bcrypt');

const saltRounds = 10;

bcrypt.promiseCompare = (text, hash) =>
{
	return new Promise((resolve, reject) => {
		bcrypt.compare(text, hash, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

bcrypt.promiseHash = text =>
{
	return new Promise((resolve, reject) => {
		bcrypt.hash(text, saltRounds, (err, hash) => {
			if (err) reject(err);
			else resolve(hash);
		});
	});
}

module.exports = bcrypt;