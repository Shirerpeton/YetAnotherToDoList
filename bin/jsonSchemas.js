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

schemas.changePassword = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Password change",
    "description": "Password change request schema",
    "type": "object",
	"properties": {
		"password": {
			"type": "string"
		},
		"newPassword": {
			"type": "string"
		},
		"repeatNewPassword": {
			"type": "string"
		}
	},
	"required": ["password", "newPassword", "repeatNewPassword"]
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
    "title": "Add user to project",
    "description": "Add user to project request schema",
    "type": "object",
	"properties": {
		"username": {
			"type": "string"
		}
	},
	"required": ["username"]
};

schemas.addTask = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Add task",
    "description": "Add task request schema",
    "type": "object",
	"properties": {
		"taskName": {
			"type": "string"
		},
		"dueDate": {
			"type": "string"
		},
		"priority": {
			"type": "integer",
			"minimum": 0,
			"maximum": 2
		}
	},
	"required": ["taskName"]
};

schemas.updateTask = {
	"$schema": "http://json-schema.org/draft-06/schema#",
    "title": "Update task",
    "description": "Update task request schema",
    "type": "object",
	"anyOf": [
        {"required": ["taskName"]},
        {"required": ["dueDate"]},
		{"required": ["priority"]},
		{"required": ["completed"]}
	],
	"properties": {
		"taskName": {
			"type": "string"
		},
		"dueDate": {
			"type": "string"
		},
		"priority": {
			"type": "integer",
			"minimum": 0,
			"maximum": 2
		},
		"completed": {
			"type": "boolean"
		}
	}
};

module.exports = schemas;