'use strict';

$("#addProj").click(function(){
	$('#addProj').slideToggle();
	$('#addProjForm').hide();
	$('#addProjForm').attr('class', '');
	$('#addProjForm').slideToggle();
	$('#projName').focus();
});

$("#addUser").click(function(){
	$('#addUser').slideToggle();
	$('#addUserForm').hide();
	$('#addUserForm').attr('class', '');
	$('#addUserForm').slideToggle();
	$('#username').focus();
});

$("#addTask").click(function(){
	$('#addTask').slideToggle();
	$('#addTaskForm').hide();
	$('#addTaskForm').attr('class', '');
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
	//let projNameLink = "<a class='mylink pad-left d-inline' data-projId=" + project.projectId + " href='/projects/" + project.projectId + "/'>" + project.projectName + "</a>";
	$('<li></li>').appendTo('#projectList').append(divDrop, projNameLink);
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
	$('<li></li>').appendTo('#userList').append(divDrop, username);
}

function addTask(task) {
	const delLink = $('<a></a>').text('Delete');
	delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	delLink.click(deleteTask);
	const renameLink = $('<a></a>').text('Rename');
	renameLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	renameLink.click(renameTask(task.taskId));
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
	//const taskNameLink = "<p class='greyText smallmar d-inline' data-taskId=" + task.taskId + "'>" + task.taskName + "</p>";
	$('<li></li>').appendTo('#taskList').append(divDrop, taskName);
}

function loadProjects() {
	$.ajax({
		type: 'GET',
        url: '/projects',
        success : function(response) {
			if (response.projects)
				for (let i = 0; i < response.projects.length; i++)
					addProject(response.projects[i]);
		}
	});
}

loadProjects();
if (/projects\/\d*/.test(window.location) === true)
{
	$('#addUser').attr('class', 'btn btn-dark btn-block');
	$('#addTask').attr('class', 'btn btn-dark btn-block');
	loadUsers();
	loadTasks();
}

function loadUsers() {
	$.ajax({
		type: 'GET',
        url: 'users',
        success : function(response) {
			if ((response.error === null) && (response.users))
				for (let i = 0; i < response.users.length; i++)
					addUser(response.users[i]);
		}
	});
}

function loadTasks() {
	$.ajax({
		type: 'GET',
        url: 'tasks',
        success : function(response) {
			if ((response.error === null) && (response.tasks))
				for (let i = 0; i < response.tasks.length; i++)
					addTask(response.tasks[i]);
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
			let reg = new RegExp('\/projects\/' + projId + '\/');
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

function renameTask(taskId) {
	let taskNumber = $('#taskList').children().length;
	return (event) => {
		event.preventDefault();
	}
}

function deleteTask(event)
{
	event.preventDefault();
}

function renameProj(projId) {
	let projNumber = $('#projectList').children().length;
	return (event) => {
		event.preventDefault();
		$('#addProj').slideToggle();
		$('#renameProjForm').hide();
		$('#renameProjForm').attr('class', '');
		$('#renameProjForm').attr('data-projId', projId);
		$('#renameProjForm').attr('data-projNumber', projNumber);
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
			url: '/projects/' + $('#renameProjForm').attr('data-projId') + '/',
			data: formData,
			success : function(response) {
				if (response.error === null) {
					$('#projectList').children().eq($('#renameProjForm').attr('data-projNumber')).children().eq(1).text(response.projectName);
					$('#newProjName').attr('class', 'col-10 form-control');
					$('#renameProjForm').hide();
					$('#addProj').slideToggle();
					$('#newProjName').val('');
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
					$('#username').attr('class', 'col-10 form-control');
					$('#addUserForm').hide();
					$('#addUser').slideToggle();
					$('#username').val('');
					addUser(response);
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
	if (formData.projectName === '')
	{
		$('#addProjForm').hide();
		$('#addProj').slideToggle();
	}
	else
	{
		$('#addProjForm').off('submit', submitProjForm);
		$.ajax({
			type: 'POST',
			url: '/projects',
			data: formData,
			success : function(response) {
				if (response.error === null)
				{
					$('#projName').attr('class', 'col-10 form-control');
					$('#addProjForm').hide();
					$('#addProj').slideToggle();
					$('#projName').val('');
					addProject(response);
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
	const formData = { 'taskName': $('#taskName').val(), 'dueDate' : 'aaaa'};
	if (formData.taskName === '')
	{
		$('#addTaskForm').hide();
		$('#addTask').slideToggle();
	}
	else
	{
		$('#addTaskForm').off('submit', submitTaskForm);
		$.ajax({
			type: 'POST',
			url: 'tasks/',
			data: formData,
			success : function(response) {
				if (response.error === null) {
					$('#taskName').attr('class', 'col-10 form-control');
					$('#addTaskForm').hide();
					$('#addTask').slideToggle();
					$('#taskName').val('');
					addTask(response);
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