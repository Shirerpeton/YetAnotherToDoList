'use strict';

$('#renameProjForm').hide();
$('#addProjForm').hide();
$('#addUserForm').hide();
$('#addTaskForm').hide();
$('#updateTaskForm').hide();

$('#addUser').hide();
$('#addTask').hide();

$('#viewSettings').hide();

$("#addProj").click(() => {
	$('#addProj').slideToggle();
	$('#addProjForm').slideToggle();
	$('#projName').focus();
});

$("#addUser").click(() => {
	$('#addUser').slideToggle();
	$('#addUserForm').slideToggle();
	$('#username').focus();
});

$("#addTask").click(() => {
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

$('#taskName').keydown(function(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
		$('#submitTask').click();
    }
});

$('#newTaskName').keydown(function(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
		$('#submitUpdateTask').click();
    }
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
	request: false,
	priority: null
};

let addingTask = {
	priority: null
};

const priorityEnum = {
	null: 0,
	"low": 1,
	"medium": 2,
	"high": 3
};

let showCompleted = (Cookies.get('showCompleted') === 'true');
if (showCompleted)
	$("#showCompleted").removeClass('fa-square-o').addClass('fa-check-square-o');
else
	$("#showCompleted").removeClass('fa-check-square-o').addClass('fa-square-o');

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
		$("#showCompleted").removeClass('fa-square-o').addClass('fa-check-square-o');
		$('.completed').parent().show();
	}
	else {
		$("#showCompleted").removeClass('fa-check-square-o').addClass('fa-square-o');
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

$("#sortByPriority").click(() => {
	sortBy = 'priority';
	updateSorting();
});

function updateSorting(){
	Cookies.set('sortBy', sortBy);
	$('#sortBy').text("Sort by " + sortBy);
	showTasks();
}

$("#nonePriority").click(() => {
	addingTask.priority = null;
	updatePriority();
});

$("#lowPriority").click(() => {
	addingTask.priority = 'low';
	updatePriority();
});

$("#mediumPriority").click(() => {
	addingTask.priority = 'medium';
	updatePriority();
});

$("#highPriority").click(() => {
	addingTask.priority = 'high';
	updatePriority();
});

function updatePriority(){
	$('#priority').text('Priority: ' + (addingTask.priority ? addingTask.priority : 'none'));
}

$("#newNonePriority").click(() => {
	updatingTask.priority = null;
	updateNewPriority();
});

$("#newLowPriority").click(() => {
	updatingTask.priority = 'low';
	updateNewPriority();
});

$("#newMediumPriority").click(() => {
	updatingTask.priority = 'medium';
	updateNewPriority();
});

$("#newHighPriority").click(() => {
	updatingTask.priority = 'high';
	updateNewPriority();
});


function updateNewPriority(){
	$('#newPriority').text('Priority: ' + (updatingTask.priority ? updatingTask.priority : 'none'));
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
	projNameLink.attr({'class': 'mylink d-inline', 'href': '/projects/' + project.projectId + '/'});
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
	console.log(task);
	const completeLink = task.completed ? $('<a></a>').text('Uncomplete') : $('<a></a>').text('Complete');
	completeLink.attr('class', 'dropdown-item greyBg mylink');
	completeLink.click(completeTask(task.taskId));
	const delLink = $('<a></a>').text('Delete');
	delLink.attr('class', 'dropdown-item greyBg mylink');
	delLink.click(deleteTask(task.taskId));
	const changeLink = $('<a></a>').text('Change');
	changeLink.attr('class', 'dropdown-item greyBg mylink');
	changeLink.click(updateTask(task));
	const divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg mylink');
	divDropMenu.append(completeLink);
	divDropMenu.append(changeLink);
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
        complete: res => {
			if ((res.responseJSON.error === null) && (res.responseJSON.projects)) {
				for (let i = 0; i < res.responseJSON.projects.length; i++)
					addProject(res.responseJSON.projects[i]);
				projects = res.responseJSON.projects;
			} else
				console.log(res.responseJSON.error);
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
		complete: res => {
			if (res.responseJSON.error === null && res.responseJSON.users) {
				for (let i = 0; i < res.responseJSON.users.length; i++) 
					addUser(res.responseJSON.users[i]);
				users = res.responseJSON.users;
			} else
				console.log(res.responseJSON.error);
		}
	});
}

function loadTasks() {
	$.ajax({
		type: 'GET',
        url: 'tasks',
        complete : res => {
			if ((res.responseJSON.error === null) && (res.responseJSON.tasks)) {
				tasks = res.responseJSON.tasks;
				showTasks();
			} else
				console.log(res.responseJSON.error);
		}
	});
}

function showTasks() {
	$('#taskList').children().remove();
	switch (sortBy){
		case "name":
			tasks.sort((task1, task2) => {
				if (task1.taskName < task2.taskName)
					return -(order === "Descending" ? 1 : -1);
				else if (task1.taskName > task2.taskName)
					return (order === "Descending" ? 1 : -1);
				else return 0;
			});
			break;
		case "completion":
		tasks.sort((task1, task2) => {
				if ((!task1.completed) && (task2.completed))
					return -(order === "Descending" ? 1 : -1);
				else if ((task1.completed) && (!task2.completed))
					return (order === "Descending" ? 1 : -1);
				else return 0;
			});
			break;
		case "date of adding":
			tasks.sort((task1, task2) => {
				if ((new Date(task1.dateOfAdding)) < (new Date(task2.dateOfAdding)))
					return -(order === "Descending" ? 1 : -1);
				else if ((new Date(task1.dateOfAdding)) > (new Date(task2.dateOfAdding)))
					return (order === "Descending" ? 1 : -1);
				else return 0;
			});
			break;
		case "priority":
			tasks.sort((task1, task2) => {
				if (priorityEnum[task1.priority] < priorityEnum[task2.priority])
					return -(order === "Descending" ? 1 : -1);
				else if (priorityEnum[task1.priority] > priorityEnum[task2.priority])
					return (order === "Descending" ? 1 : -1);
				else return 0;
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
		const that = $(this);
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: '/projects/' + projId,
			complete: res => {
				if (res.responseJSON.error === null) {
					const projNumber = that.parent().parent().parent().index();
					$('#projectList').children().eq(projNumber).remove();
					projects.splice(projNumber, 1);
				}
				else
					console.log(res.responseJSON.error);
				const reg = new RegExp('\/projects\/' + projId + '\/');
				if (reg.test(window.location))
					window.location.replace('/');
			}
		});
	}
}

function deleteUser(username) {
	return function(event) {
		const that = $(this);
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: 'users/' + username,
			complete: res => {
				if (res.responseJSON.error === null) {
					const userNumber = that.parent().parent().parent().index();
					$('#userList').children().eq(userNumber).remove();
					users.splice(userNumber, 1);
				}
				else
					console.log(res.responseJSON.error);
				if (res.responseJSON.reload)
					window.location.replace('/');
			}
		});
	}
}

function deleteTask(taskId) {
	return function(event) {
		const that = $(this);
		event.preventDefault();
		$.ajax({
			type: 'DELETE',
			url: 'tasks/' + taskId,
			complete: res => {
				if (res.responseJSON.error === null) {
					const taskNumber = that.parent().parent().parent().index();
					$('#taskList').children().eq(taskNumber).remove();
					tasks.splice(taskNumber, 1);
				}
				else
					console.log(res.responseJSON.error)
			}
		});
	}
}

function completeTask(taskId) {
	return function (event) {
		const that = $(this);
		event.preventDefault();
		let taskNumber = that.parent().parent().parent().index();
		$.ajax({
			type: 'PUT',
			url: 'tasks/' + taskId,
			data: JSON.stringify({ 'completed': !tasks[taskNumber].completed }),
			dataType: 'json',
			contentType: "application/json",
			complete: res => {
				if (res.responseJSON.error === null) {
					taskNumber = that.parent().parent().parent().index();
					tasks[taskNumber] = res.responseJSON.task;
					if (sortBy === "completion") showTasks(); else {
						if (res.responseJSON.task.completed) {
							$('#taskList').children().eq(taskNumber).children().eq(1).removeClass('greyText').addClass('completed');
							$('#taskList').children().eq(taskNumber).children().eq(0).children().eq(1).children().eq(0).text('Uncomplete');
							if (!showCompleted) that.parent().parent().parent().hide();
						} else {
							$('#taskList').children().eq(taskNumber).children().eq(1).removeClass('completed').addClass('greyText');
							$('#taskList').children().eq(taskNumber).children().eq(0).children().eq(1).children().eq(0).text('Complete');
							if (!showCompleted) that.parent().parent().parent().show();
						}
					}
				} else console.log(res.responseJSON.error);
			}
		});
	};
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

function updateTask(task) {
	return function(event) {
		event.preventDefault();
		if (!updatingTask.request) {
			updatingTask.id = task.taskId;
			updatingTask.element = $(this);
			if (!$('#updateTaskForm').is(':visible')) {
				if ($('#addTaskForm').is(':visible'))
					$('#addTaskForm').slideToggle();
				else
					$('#addTask').slideToggle();
				$('#updateTaskForm').slideToggle();
			}
			$('#newTaskName').val(task.taskName);
			updatingTask.priority = task.priority;
			updateNewPriority();
			$('#newTaskName').focus();
		}
	}
}

function submitRenameProjForm() {
	const formData = { 'projectName': $('#newProjName').val() };
	$('#newProjName').removeClass('is-invalid');
	$('#newProjName').removeClass('is-valid');
	$('#invNewProjName').text('');
	if (formData.projectName === '') {
		$('#renameProjForm').slideToggle();
		$('#addProj').slideToggle();
	} else {
		$('#renameProjForm').off('submit', submitRenameProjForm);
		renamingProject.request = true;
		$.ajax({
			type: 'PUT',
			url: '/projects/' + renamingProject.id,
			data: formData,
			complete: res => {
				if (res.responseJSON.error === null) {
					const projectNumber = renamingProject.element.parent().parent().parent().index();
					$('#projectList').children().eq(projectNumber).children().eq(1).text(res.responseJSON.project.projectName);
					projects[projectNumber] = res.responseJSON.project;
					$('#renameProjForm').slideToggle();
					$('#addProj').slideToggle();
					$('#newProjName').val('');
				} else {
					$('#newProjName').addClass('is-invalid');
					$('#invNewProjName').text(res.responseJSON.error);
					console.log(res.responseJSON);
				}
				$('#renameProjForm').submit(submitRenameProjForm);
				renamingProject.request = false;
			}
		});
	}
}

function submitUserForm() {
	const formData = { 'username': $('#username').val() };
	$('#username').removeClass('is-invalid');
	$('#username').removeClass('is-valid');
	$('#invUsername').text('');
	if (formData.username === '') {
		$('#addUserForm').slideToggle();
		$('#addUser').slideToggle();
	} else {
		$('#addUserForm').off('submit', submitUserForm);
		$.ajax({
			type: 'POST',
			url: 'users/',
			data: formData,
			complete: res => {
				if (res.responseJSON.error === null) {
					addUser(res.responseJSON.user);
					users.push(res.responseJSON.user);
					$('#addUserForm').slideToggle();
					$('#addUser').slideToggle();
					$('#username').val('');
				} else {
					$('#username').addClass('is-invalid');
					$('#invUsername').text(res.responseJSON.error);
					console.log(res.responseJSON);
				}
				$('#addUserForm').submit(submitUserForm);
			}
		});
	}
}

function submitProjForm() {
	const formData = { 'projectName': $('#projName').val() };
	$('#projName').removeClass('is-invalid');
	$('#projName').removeClass('is-valid');
	$('#invProj').text('');
	if (formData.projectName === '') {
		$('#addProjForm').slideToggle();
		$('#addProj').slideToggle();
	} else {
		$('#addProjForm').off('submit', submitProjForm);
		$.ajax({
			type: 'POST',
			url: '/projects',
			data: formData,
			complete: res => {
				if (res.responseJSON.error === null) {
					addProject(res.responseJSON.project);
					projects.push(res.responseJSON.project);
					$('#addProjForm').slideToggle();
					$('#addProj').slideToggle();
					$('#projName').val('');
				} else {
					$('#projName').addClass('is-invalid');
					$('#invProj').text(res.responseJSON.error);
					console.log(res.responseJSON);
				}
				$('#addProjForm').submit(submitProjForm);
			}
		});
	}
}

function submitTaskForm() {
	const formData = { 'taskName': $('#taskName').val(), priority: addingTask.priority};
	$('#taskName').removeClass('is-invalid');
	$('#taskName').removeClass('is-valid');
	$('#invTask').text('');
	if (formData.taskName === '') {
		$('#addTaskForm').slideToggle();
		$('#addTask').slideToggle();
	} else {
		$('#addTaskForm').off('submit', submitTaskForm);
		$.ajax({
			type: 'POST',
			url: 'tasks/',
			contentType: 'application/json',
            dataType: 'json',
			data: JSON.stringify(formData),
			complete: res => {
				if (res.responseJSON.error === null) {
					tasks.push(res.responseJSON.task);
					showTasks();
					$('#addTaskForm').slideToggle();
					$('#addTask').slideToggle();
					$('#taskName').val('');
					addingTask.priority = null;
					updatePriority();
				} else {
					$('#taskName').addClass('is-invalid');
					$('#invTask').text(res.responseJSON.error);
					console.log(res.responseJSON);
				}
				$('#addTaskForm').submit(submitTaskForm);
			}
		});
	}
}

function submitUpdateTaskForm() {
	const formData = { 'taskName': $('#newTaskName').val(), priority: updatingTask.priority};
	$('#newTaskName').removeClass('is-invalid');
	$('#newTaskName').removeClass('is-valid');
	$('#invUpdateTask').text('');
	if (formData.taskName === '') {
		$('#updateTaskForm').slideToggle();
		$('#addTask').slideToggle();
	} else {
		$('#updateTaskForm').off('submit', submitUpdateTaskForm);
		updatingTask.request = true;
		$.ajax({
			type: 'PUT',
			url: 'tasks/' + updatingTask.id,
			contentType: 'application/json',
            dataType: 'json',
			data: JSON.stringify(formData),
			complete: res => {
				if (res.responseJSON.error === null) {
					const taskNumber = updatingTask.element.parent().parent().parent().index();
					tasks[taskNumber] = res.responseJSON.task;
					showTasks();
					$('#updateTaskForm').slideToggle();
					$('#addTask').slideToggle();
					$('#newTaskName').val('');
				} else {
					$('#newTaskName').addClass('is-invalid');
					$('#invUpdateTask').text(res.responseJSON.error);
					console.log(res.responseJSON);
				}
				$('#updateTaskForm').submit(submitUpdateTaskForm);
				updatingTask.request = false;
			}
		});
	}
}