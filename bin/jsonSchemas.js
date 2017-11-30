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

schemas.addProject = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Add project",
    "description": "Add project request schema",
    "type": "object",
	"properties": {
		"projectName": {
			"type": "string"
		}
	},
	"required": ["projectName"]
};

schemas.renameProject = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Rename project",
    "description": "Rename project request schema",
    "type": "object",
	"properties": {
		"projectName": {
			"type": "string"
		}
	},
	"required": ["projectName"]
};


schemas.addUser = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Add user project",
    "description": "Add user request schema",
    "type": "object",
	"properties": {
		"username": {
			"type": "string"
		}
	},
	"required": ["username"]
};

module.exports = schemas;