'use strict';

$('#renameProjForm').hide();
$('#addProjForm').hide();
$('#addUserForm').hide();
$('#addTaskForm').hide();
$('#updateTaskForm').hide();

$('#addUser').hide();
$('#addTask').hide();

$('#viewSettings').hide();

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

$("#sortByCompletion").click(event => {
	event.preventDefault();
});

$("#sortByName").click(event => {
	event.preventDefault();
});

$("#sortByDateOfAdding").click(event => {
	event.preventDefault();
});

$('#orderToggle').click(event => {
	event.preventDefault();
});

let users = [], projects = [], tasks = [];

let renamingProject = {
	id: null,
	element: null,
	request: false
};

let updatingTask = {
	id: null,
	element: null,
	request: false
}

let showCompleted = (Cookies.get('showCompleted') === 'true');
if (showCompleted)
	$("#showCompleted").attr('class', 'fa fa-check-square-o fa-inverse nopad btn my-btn-dark fa-2x');
else
	$("#showCompleted").attr('class', 'fa fa-square-o fa-inverse nopad btn my-btn-dark fa-2x');

let sortBy = Cookies.get('sortBy') ? Cookies.get('sortBy') : 'name';
$('#sortBy').text("Sort by " + sortBy);

let order = Cookies.get('order') ? Cookies.get('order') : 'Descending';
$('#orderToggle').text(order);

$('#orderToggle').click(() => {
	if (order === "Descending")
		order = "Ascending";
	else if (order === "Ascending")
		order = "Descending";
	Cookies.set("order", order);
	$('#orderToggle').text(order);
	showTasks();
});

$("#showCompleted").click(() => {
	showCompleted = !showCompleted;
	Cookies.set('showCompleted', showCompleted);
	if (showCompleted) {
		$("#showCompleted").attr('class', 'fa fa-check-square-o fa-inverse nopad btn my-btn-dark fa-2x');
		$('.completed').parent().show();
	}
	else {
		$("#showCompleted").attr('class', 'fa fa-square-o fa-inverse nopad btn my-btn-dark fa-2x');
		$('.completed').parent().hide();
	}
});

$("#sortByName").click(() => {
	sortBy = "name";
	updateSorting();
});

$("#sortByCompletion").click(() => {
	sortBy = "completion";
	updateSorting();
});

$("#sortByDateOfAdding").click(() => {
	sortBy = "date of adding";
	updateSorting();
});

function updateSorting(){
	Cookies.set('sortBy', sortBy);
	$('#sortBy').text("Sort by " + sortBy);
	showTasks();
}

function addProject(project) {
	const delLink = $('<a></a>').text('Delete');
	delLink.attr('class', 'dropdown-item greyBg mylink');
	delLink.click(deleteProj(project.projectId));
	const renameLink = $('<a></a>').text('Rename');
	renameLink.attr('class', 'dropdown-item greyBg mylink');
	renameLink.click(renameProj(project.projectId));
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg mylink');
	divDropMenu.append(renameLink);
	divDropMenu.append(delLink);
	const dropBtn = $('<button></button>');
	dropBtn.attr({ 'class': 'btn my-btn-dark settings-buttons fa fa-bars fa-inverse', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	const divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline ');
	divDrop.append(dropBtn, divDropMenu);
	const projNameLink = $('<a></a>').text(project.projectName);
	projNameLink.attr({'class': 'mylink pad-left d-inline', 'href': '/projects/' + project.projectId + '/'});
	$('#projectList').append($('<li></li>').append(divDrop, projNameLink));
}

function addUser(user) {
	const delLink = $('<a></a>').text('Delete');
	delLink.attr('class', 'dropdown-item greyBg mylink');
	delLink.click(deleteUser(user.username));
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg mylink');
	divDropMenu.append(delLink);
	const dropBtn = $('<button></button>');
	dropBtn.attr({ 'class': 'btn my-btn-dark settings-buttons fa fa-bars fa-inverse', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	const divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline');
	divDrop.append(dropBtn, divDropMenu);
	const username = $('<p></p>').text(user.username);
	username.attr('class', 'greyText smallmar d-inline');
	$('#userList').append($('<li></li>').append(divDrop, username));
}

function addTask(task) {
	const completeLink = task.completed ? $('<a></a>').text('Uncomplete') : $('<a></a>').text('Complete');
	completeLink.attr('class', 'dropdown-item greyBg mylink');
	completeLink.click(completeTask(task.taskId));
	const delLink = $('<a></a>').text('Delete');
	delLink.attr('class', 'dropdown-item greyBg mylink');
	delLink.click(deleteTask(task.taskId));
	const renameLink = $('<a></a>').text('Rename');
	renameLink.attr('class', 'dropdown-item greyBg mylink');
	renameLink.click(updateTask(task.taskId));
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg mylink');
	divDropMenu.append(completeLink);
	divDropMenu.append(renameLink);
	divDropMenu.append(delLink);
	const dropBtn = $('<button></button>');
	dropBtn.attr({ 'class': 'btn my-btn-dark settings-buttons fa fa-bars fa-inverse', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	const divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline ');
	divDrop.append(dropBtn, divDropMenu);
	const taskName = $('<p></p>').text(task.taskName);
	if (task.completed)
		taskName.attr({'class': 'smallmar d-inline completed'});
	else
		taskName.attr({'class': 'greyText smallmar d-inline'});
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
	$('#viewSettings').show();
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
				tasks = response.tasks;
				showTasks();
			}
		}
	});
}

function showTasks() {
	$('#taskList').children().remove();
	switch (sortBy){
		case "name":
			tasks.sort((task1, task2) => {
				if (task1.taskName < task2.taskName)
					return -1 * (order === "Descending" ? 1 : -1);
				if (task1.taskName > task2.taskName)
					return 1 * (order === "Descending" ? 1 : -1);
				return 0;
			});
			break;
		case "completion":
		tasks.sort((task1, task2) => {
				if ((!task1.completed) && (task2.completed))
					return -1 * (order === "Descending" ? 1 : -1);
				if ((task1.completed) && (!task2.completed))
					return 1 * (order === "Descending" ? 1 : -1);
				return 0;
			});
			break;
		case "date of adding":
			tasks.sort((task1, task2) => {
				if ((new Date(task1.dateOfAdding)) < (new Date(task2.dateOfAdding)))
					return -1 * (order === "Descending" ? 1 : -1);
				if ((new Date(task1.dateOfAdding)) > (new Date(task2.dateOfAdding)))
					return 1 * (order === "Descending" ? 1 : -1);
				return 0;
			});
			break;
	}
	for (let i = 0; i < tasks.length; i++)
		addTask(tasks[i]);
	if (!showCompleted)
		$('.completed').parent().hide();
}

function deleteProj(projId) {
	return function(event) {
		let that = $(this);
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: '/projects/' + projId,
			success : function(response){
				if (response.error === null)
				{
					const projNumber = that.parent().parent().parent().index();
					$('#projectList').children().eq(projNumber).remove();
					projects.splice(projNumber, 1);
				}
				else
					console.log(response.error);
				const reg = new RegExp('\/projects\/' + projId + '\/');
				if (reg.test(window.location))
					window.location.replace('/');
			}
		});
	}
}

function deleteUser(username) {
	return function(event) {
		let that = $(this);
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: 'users/' + username,
			success : function(response) {
				if (response.error === null) {
					const userNumber = that.parent().parent().parent().index();
					$('#userList').children().eq(userNumber).remove();
					users.splice(userNumber, 1);
				}
				else
					console.log(reponse.error)
				if (response.reload)
					window.location.replace('/');
			}
		});
	}
}

function deleteTask(taskId) {
	return function(event) {
		let that = $(this);
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: 'tasks/' + taskId,
			success : function(response) {
				if (response.error === null) {
					const taskNumber = that.parent().parent().parent().index();
					$('#taskList').children().eq(taskNumber).remove();
					tasks.splice(taskNumber, 1);
				}
				else
					console.log(reponse.error)
			}
		});
	}
}

function completeTask(taskId){
	return function(event) {
		let that = $(this);
		event.preventDefault();
		let taskNumber = that.parent().parent().parent().index();
		$.ajax({
			type: 'PUT',
			url: 'tasks/' + taskId,
			data: JSON.stringify({'completed' : !tasks[taskNumber].completed}),
			dataType: 'json',
			contentType: "application/json",
			success : function(response) {
				if (response.error === null) {
					taskNumber = that.parent().parent().parent().index();
					tasks[taskNumber] = response.task;
					if (sortBy === "completion")
						showTasks();
					else
					{
						if (response.task.completed) {
							$('#taskList').children().eq(taskNumber).children().eq(1).attr('class', 'smallmar d-inline completed');
							$('#taskList').children().eq(taskNumber).children().eq(0).children().eq(1).children().eq(0).text('Uncomplete')
							if (!showCompleted)
								that.parent().parent().parent().hide();
						} else {
							$('#taskList').children().eq(taskNumber).children().eq(1).attr('class', 'smallmar d-inline greyText');
							$('#taskList').children().eq(taskNumber).children().eq(0).children().eq(1).children().eq(0).text('Complete')
							if (!showCompleted)
							that.parent().parent().parent().show();
						}
					}
				} else 
					console.log(response.error);
			}
		});
	}
}

function renameProj(projId) {
	return function(event) {
		event.preventDefault();
		if (!renamingProject.request) {
			renamingProject.id = projId;
			renamingProject.element = $(this);
			if ($('#addProjForm').is(":visible")) 
				$('#addProjForm').slideToggle(); 
			else
				$('#addProj').slideToggle();
			$('#renameProjForm').slideToggle();
			$('#newProjName').focus();
		}
	}
}

function updateTask(taskId) {
	return function(event) {
		event.preventDefault();
		if (!updatingTask.request) {
			updatingTask.id = taskId;
			updatingTask.element = $(this);
			if ($('#addTaskForm').is(':visible'))
				$('#addTaskForm').slideToggle();
			else
				$('#addTask').slideToggle();
			$('#updateTaskForm').slideToggle();
			$('#newTaskName').focus();
		}
	}
}

function submitRenameProjForm() {
	const formData = { 'projectName': $('#newProjName').val() };
	if (formData.projectName === '') {
		$('#newProjName').attr('class', 'col-10 form-control');
		$('#renameProjForm').slideToggle();
		$('#addProj').slideToggle();
	}
	else {
		$('#renameProjForm').off('submit', submitRenameProjForm);
		renamingProject.request = true;
		$.ajax({
			type: 'PUT',
			url: '/projects/' + renamingProject.id,
			data: formData,
			success : function(response) {
				if (response.error === null) {
					const projectNumber = renamingProject.element.parent().parent().parent().index();
					$('#projectList').children().eq(projectNumber).children().eq(1).text(response.project.projectName);
					projects[projectNumber] = response.project;
					$('#newProjName').attr('class', 'col-10 form-control');
					$('#renameProjForm').slideToggle();
					$('#addProj').slideToggle();
					$('#newProjName').val('');
				}
				else {
					$('#newProjName').attr('class', 'col-10 form-control is-invalid');
					$('#invNewProjName').text(response.error);
				}
				$('#renameProjForm').submit(submitRenameProjForm);
				renamingProject.request = false;
			}
		});
	}
}

function submitUserForm() {
	const formData = { 'username': $('#username').val() };
	if (formData.username === '') {
		$('#username').attr('class', 'col-10 form-control');
		$('#addUserForm').slideToggle();
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
					users.push(response.user);
					$('#username').attr('class', 'col-10 form-control');
					$('#addUserForm').slideToggle();
					$('#addUser').slideToggle();
					$('#username').val('');
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
		$('#addProjForm').slideToggle();
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
					projects.push(response.project);
					$('#projName').attr('class', 'col-10 form-control');
					$('#addProjForm').slideToggle();
					$('#addProj').slideToggle();
					$('#projName').val('');
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
		$('#addTaskForm').slideToggle();
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
					tasks.push(response.task);
					showTasks();
					$('#taskName').attr('class', 'col-10 form-control');
					$('#addTaskForm').slideToggle();
					$('#addTask').slideToggle();
					$('#taskName').val('');
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
	if (formData.taskName === '') {
		$('#newTaskName').attr('class', 'col-10 form-control');
		$('#updateTaskForm').slideToggle();
		$('#addTask').slideToggle();
	}
	else {
		$('#updateTaskForm').off('submit', submitUpdateTaskForm);
		updatingTask.request = true;
		$.ajax({
			type: 'PUT',
			url: 'tasks/' + updatingTask.id,
			data: formData,
			success : function(response) {
				if (response.error === null) {
					const taskNumber = updatingTask.element.parent().parent().parent().index();
					tasks[taskNumber] = response.task;
					showTasks();
					$('#newTaskName').attr('class', 'col-10 form-control');
					$('#updateTaskForm').slideToggle();
					$('#addTask').slideToggle();
					$('#newTaskName').val('');
				}
				else {
					$('#newTaskName').attr('class', 'col-10 form-control is-invalid');
					$('#invUpdateTask').text(response.error);
				}
				$('#updateTaskForm').submit(submitTaskForm);
				updatingTask.request = false;
			}
		});
	}
}