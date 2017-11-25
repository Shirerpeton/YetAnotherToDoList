'use strict';

$("#addProj").click(function(){
	$('#addProj').slideToggle();
	$('#addProjForm').hide();
	$('#addProjForm').attr('class', '');
	$('#addProjForm').slideToggle();
});

$("#addUser").click(function(){
	$('#addUser').slideToggle();
	$('#addUserForm').hide();
	$('#addUserForm').attr('class', '');
	$('#addUserForm').slideToggle();
});

$("#addProjForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
	submitProjForm();
});

$("#addUserForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
	submitUserForm();
});

function addProject(project) {
	let delLink = $('<a></a>').text('Delete');
	delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	delLink.click(deleteProj);
	let divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg');
	divDropMenu.append(delLink);
	let btn = $('<button></button>');
	btn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	let divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline ');
	divDrop.append(btn, divDropMenu);
	let projNameLink = "<a class='mylink pad-left d-inline' data-projId=" + project.projectId + " href='/projects/" + project.projectId + "/'>" + project.projectName + "</a>";
	$('<li></li>').appendTo('#projectList').append(divDrop, projNameLink);
}

function addUser(user) {
	let delLink = $('<a></a>').text('Delete');
	delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
	delLink.click(deleteUser);
	let divDropMenu = $('<div></div>');
	divDropMenu.attr('class', 'dropdown-menu greyBg');
	divDropMenu.append(delLink);
	let btn = $('<button></button>');
	btn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
	let divDrop = $('<div></div>');
	divDrop.attr('class', 'dropdown d-inline');
	divDrop.append(btn, divDropMenu);
	let username = "<p class='greyText nomar d-inline'>" + user + "</p>";
	$('<li></li>').appendTo('#userList').append(divDrop, username);
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
const reg = /projects\/\d*/;
if (reg.test(window.location) !== -1)
	loadUsers();

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

function deleteProj(event)
{
	event.preventDefault();
	var number = $(this).parent().parent().parent().index();
	$.ajax({
        type: 'DELETE',
        url: '/projects/' + $(this).parent().parent().parent().children().eq(1).attr('data-projId'),
        success : function(response){
			if (response.proj)
				$('#projectList').children().eq(number).remove();
		}
	});
}

/* var list = $('#userList').children();
for (var i = 0; i < list.length; i++)
{
	list.eq(i).children().eq(0).children().eq(1).children().eq(0).click(deleteUser);
} */

function deleteUser(event)
{
	event.preventDefault();
	var number = $(this).parent().parent().parent().index();
	$.ajax({
        type: 'DELETE',
        url: 'users/' + $(this).parent().parent().parent().children().eq(1).text(),
        success : function(response) {
			if (response.user)
				$('#userList').children().eq(number).remove();
			if (response.reload)
				window.location.replace('/');
		}
	});
}

function submitUserForm()
{
	var formData = { 'username': $('#username').val() };
	$.ajax({
        type: 'POST',
        url: 'users/',
        data: formData,
        success : function(response){
			if (response.error !== null)
			{
				$('#username').attr('class', 'col-10 form-control is-invalid');
				$('#invUsername').text(response.error);
			}
			else
			{
				$('#username').attr('class', 'col-10 form-control');
				$('#addUserForm').hide();
				$('#addUser').slideToggle();
				$('#username').val('');
				addUser(response);
			}
		}
	});
}

function submitProjForm()
{
	var formData = { 'projName': $('#projName').val() };
	$.ajax({
        type: 'POST',
        url: '/projects',
        data: formData,
        success : function(response) {
				$('#addProjForm').hide();
				$('#addProj').slideToggle();
				$('#projName').val('');
				addProject(response);
			}
	});
}