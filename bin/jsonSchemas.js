schemas = {}

schemas.signin = {
    "$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Sign-In",
    "description": "Sign-In request schema",
    "type": "object",
	"properties": {
		"username": {
			"type": "string"
		},
		"password": {
			"type": "string"
		}
	},
	"required": ["username", "password"]
};

schemas.signup = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Sign-Up",
    "description": "Sign-Up request schema",
    "type": "object",
	"properties": {
		"username": {
			"type": "string"
		},
		"password": {
			"type": "string"
		},
		"repeatPassword": {
			"type": "string"
		}
	},
	"required": ["username", "password", "repeatPassword"]
};

module.exports = schemas;