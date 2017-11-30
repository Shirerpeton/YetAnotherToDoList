'use strict';

$('#renameProjForm').hide();
$('#addProjForm').hide();
$('#addUserForm').hide();
$('#addTaskForm').hide();
$('#updateTaskForm').hide();

$('#addUser').hide();
$('#addTask').hide();

$("#addProj").click(function(){
	$('#addProj').slideToggle();
	$('#addProjForm').slideToggle();
	$('#projName').focus();
});

$("#addUser").click(function(){
	$('#addUser').slideToggle();
	$('#addUserForm').slideToggle();
	$('#username').focus();
});

$("#addTask").click(function(){
	$('#addTask').slideToggle();
	$('#addTaskForm').slideToggle();
	$('#taskName').focus();
});

$("#addProjForm").submit(event => {
	event.preventDefault();
});

$("#addProjForm").submit(submitProjForm);

$("#addUserForm").submit(event => {
	event.preventDefault();
});

$("#addUserForm").submit(submitUserForm);

$("#renameProjForm").submit(event => {
	event.preventDefault();
});

$("#renameProjForm").submit(submitRenameProjForm);

$("#addTaskForm").submit(event => {
	event.preventDefault();
});

$("#addTaskForm").submit(submitTaskForm);

$("#updateTaskForm").submit(event => {
	event.preventDefault();
});

$("#updateTaskForm").submit(submitUpdateTaskForm);

let users = [], projects = [], tasks = [];

let renamingProject = {
	id: null,
	number: null
};

let updatingTask = {
	id: null,
	number: null
}

function addProject(project) {
	const delLink = $('<a></a>').text('Delete');
	delLink.attr({'class': 'dropdown-item greyBg', 'href': '#'});
	delLink.click(deleteProj);
	const renameLink = $('<a></a>').text('Rename');
	renameLink.attr({'class': 'dropdown-item greyBg', 'href': '#'});
	renameLink.click(renameProj(project.projectId));
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg');
	divDropMenu.append(renameLink);
	divDropMenu.append(delLink);
	const dropBtn = $('<button></button>');
	dropBtn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	const divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline ');
	divDrop.append(dropBtn, divDropMenu);
	const projNameLink = $('<a></a>').text(project.projectName);
	projNameLink.attr({'class': 'mylink pad-left d-inline', 'data-projId': project.projectId, 'href': '/projects/' + project.projectId + '/'});
	$('#projectList').append($('<li></li>').append(divDrop, projNameLink));
}

function addUser(user) {
	const delLink = $('<a></a>').text('Delete');
	delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	delLink.click(deleteUser);
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg');
	divDropMenu.append(delLink);
	const dropBtn = $('<button></button>');
	dropBtn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	const divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline');
	divDrop.append(dropBtn, divDropMenu);
	const username = $('<p></p>').text(user.username);
	username.attr('class', 'greyText smallmar d-inline');
	$('#userList').append($('<li></li>').append(divDrop, username));
}

function addTask(task) {
	const delLink = $('<a></a>').text('Delete');
	delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	delLink.click(deleteTask);
	const renameLink = $('<a></a>').text('Rename');
	renameLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	renameLink.click(updateTask(task.taskId));
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg');
	divDropMenu.append(renameLink);
	divDropMenu.append(delLink);
	const dropBtn = $('<button></button>');
	dropBtn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	const divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline ');
	divDrop.append(dropBtn, divDropMenu);
	const taskName = $('<p></p>').text(task.taskName);
	taskName.attr({'class': 'greyText smallmar d-inline', 'data-taskId': task.taskId});
	$('#taskList').append($('<li></li>').append(divDrop, taskName));
}

function loadProjects() {
	$.ajax({
		type: 'GET',
        url: '/projects',
        success : function(response) {
			if ((response.error === null) && (response.projects)) {
				for (let i = 0; i < response.projects.length; i++)
					addProject(response.projects[i]);
				projects = response.projects;
			}
		}
	});
}

loadProjects();
if (/projects\/\d*/.test(window.location)){
	$('#addUser').show();
	$('#addTask').show();
	loadUsers();
	loadTasks();
}

function loadUsers() {
	$.ajax({
		type: 'GET',
        url: 'users',
        success : function(response) {
			if ((response.error === null) && (response.users)) {
				for (let i = 0; i < response.users.length; i++)
					addUser(response.users[i]);
				users = response.users; 
			}
		}
	});
}

function loadTasks() {
	$.ajax({
		type: 'GET',
        url: 'tasks',
        success : function(response) {
			if ((response.error === null) && (response.tasks)) {
				for (let i = 0; i < response.tasks.length; i++)
					addTask(response.tasks[i]);
				tasks = response.tasks;
			}
		}
	});
}

function deleteProj(event) {
	event.preventDefault();
	let number = $(this).parent().parent().parent().index();
	let projId = $('#projectList').children().eq(number).children().eq(1).attr('data-projId');
	$.ajax({
        type: 'DELETE',
        url: '/projects/' + projId,
        success : function(response){
			if (response.error === null)
				$('#projectList').children().eq(number).remove();
			const reg = new RegExp('\/projects\/' + projId + '\/');
			if (reg.test(window.location))
				window.location.replace('/');
		}
	});
}

function deleteUser(event) {
	event.preventDefault();
	let number = $(this).parent().parent().parent().index();
	console.log($('#userList').children().eq(number).children().eq(1).text());
	$.ajax({
        type: 'DELETE',
        url: 'users/' + $('#userList').children().eq(number).children().eq(1).text(),
        success : function(response) {
			console.log(response);
			if (response.error === null)
				$('#userList').children().eq(number).remove();
			if (response.reload)
				window.location.replace('/');
		}
	});
}

function updateTask(taskId) {
	const taskNumber = $('#taskList').children().length;
	return (event) => {
		event.preventDefault();
		updatingTask.id = taskId;
		updatingTask.number = taskNumber;
		$('#addTask').slideToggle();
		$('#updateTaskForm').slideToggle();
		$('#newTaskName').focus();
	}
}

function deleteTask(event)
{
	event.preventDefault();
}

function renameProj(projId) {
	const projNumber = $('#projectList').children().length;
	return (event) => {
		event.preventDefault();
		renamingProject.id = projId;
		renamingProject.number = projNumber;
		$('#addProj').slideToggle();
		$('#renameProjForm').slideToggle();
		$('#newProjName').focus();
	}
}

function submitRenameProjForm() {
	const formData = { 'projectName': $('#newProjName').val() };
	if (formData.projectName === '') {
		$('#newProjName').attr('class', 'col-10 form-control');
		$('#renameProjForm').hide();
		$('#addProj').slideToggle();
	}
	else {
		$('#renameProjForm').off('submit', submitRenameProjForm);
		$.ajax({
			type: 'PUT',
			url: '/projects/' + renamingProject.id + '/',
			data: formData,
			success : function(response) {
				if (response.error === null) {
					$('#projectList').children().eq(renamingProject.number).children().eq(1).text(response.project.projectName);
					$('#newProjName').attr('class', 'col-10 form-control');
					$('#renameProjForm').hide();
					$('#addProj').slideToggle();
					$('#newProjName').val('');
					projects[renamingProject.number] = response.project;
				}
				else {
					$('#newProjName').attr('class', 'col-10 form-control is-invalid');
					$('#invNewProjName').text(response.error);
				}
				$('#renameProjForm').submit(submitRenameProjForm);
			}
		});
	}
}

function submitUserForm() {
	const formData = { 'username': $('#username').val() };
	if (formData.username === '') {
		$('#username').attr('class', 'col-10 form-control');
		$('#addUserForm').hide();
		$('#addUser').slideToggle();
	}
	else {
		$('#addUserForm').off('submit', submitUserForm);
		$.ajax({
			type: 'POST',
			url: 'users/',
			data: formData,
			success : function(response) {
				if (response.error === null) {
					addUser(response.user);
					$('#username').attr('class', 'col-10 form-control');
					$('#addUserForm').hide();
					$('#addUser').slideToggle();
					$('#username').val('');
					users.push(response.user);
				}
				else {
					$('#username').attr('class', 'col-10 form-control is-invalid');
					$('#invUsername').text(response.error);
				}
				$('#addUserForm').submit(submitUserForm);
			}
		});
	}
}

function submitProjForm() {
	const formData = { 'projectName': $('#projName').val() };
	if (formData.projectName === '') {
		$('#projName').attr('class', 'col-10 form-control');
		$('#addProjForm').hide();
		$('#addProj').slideToggle();
	}
	else {
		$('#addProjForm').off('submit', submitProjForm);
		$.ajax({
			type: 'POST',
			url: '/projects',
			data: formData,
			success : function(response) {
				if (response.error === null)
				{
					addProject(response.project);
					$('#projName').attr('class', 'col-10 form-control');
					$('#addProjForm').hide();
					$('#addProj').slideToggle();
					$('#projName').val('');
					projects.push(response.project);
				}
				else {
					$('#projName').attr('class', 'col-10 form-control is-invalid');
					$('#invProj').text(response.error);
				}
				$('#addProjForm').submit(submitProjForm);
			}
		});
	}
}

function submitTaskForm() {
	const formData = { 'taskName': $('#taskName').val()};
	if (formData.taskName === '') {
		$('#taskName').attr('class', 'col-10 form-control');
		$('#addTaskForm').hide();
		$('#addTask').slideToggle();
	}
	else {
		$('#addTaskForm').off('submit', submitTaskForm);
		$.ajax({
			type: 'POST',
			url: 'tasks/',
			data: formData,
			success : function(response) {
				if (response.error === null) {
					addTask(response.task);
					$('#taskName').attr('class', 'col-10 form-control');
					$('#addTaskForm').hide();
					$('#addTask').slideToggle();
					$('#taskName').val('');
					tasks.push(response.task);
				}
				else {
					$('#taskName').attr('class', 'col-10 form-control is-invalid');
					$('#invTask').text(response.error);
				}
				$('#addTaskForm').submit(submitTaskForm);
			}
		});
	}
}

function submitUpdateTaskForm() {
	const formData = {'taskName': $('#newTaskName').val()};
	if (formData.newTaskName === '') {
		$('#newTaskName').attr('class', 'col-10 form-control');
		$('#updateTaskForm').hide();
		$('#addTask').slideToggle();
	}
	else {
		$('#updateTaskForm').off('submit', submitUpdateTaskForm);
		$.ajax({
			type: 'PUT',
			url: 'tasks/' + updatingTask.id + '/',
			data: formData,
			success : function(response) {
				if (response.error === null) {
					$('#taskList').children().eq(updatingTask.number).children().eq(1).text(response.task.taskName);
					$('#newTaskName').attr('class', 'col-10 form-control');
					$('#updateTaskForm').hide();
					$('#addTask').slideToggle();
					$('#newTaskName').val('');
					tasks[updatingTask.number] = response.task;
				}
				else {
					$('#newTaskName').attr('class', 'col-10 form-control is-invalid');
					$('#invUpdateTask').text(response.error);
				}
				$('#updateTaskForm').submit(submitTaskForm);
			}
		});
	}
}