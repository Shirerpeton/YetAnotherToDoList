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

var list = $('#projectList').children();
for (var i = 0; i < list.length; i++)
{
	list.eq(i).children().eq(0).children().eq(1).children().eq(0).click(deleteProj);
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

var list = $('#userList').children();
for (var i = 0; i < list.length; i++)
{
	list.eq(i).children().eq(0).children().eq(1).children().eq(0).click(deleteUser);
}

function deleteUser(event)
{
	event.preventDefault();
	var number = $(this).parent().parent().parent().index();
	$.ajax({
        type: 'DELETE',
        url: 'users/' + $(this).parent().parent().parent().children().eq(1).text(),
        success : function(response){
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
				var delLink = $('<a></a>').text('Delete');
				delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
				delLink.click(deleteUser);
				var divDropMenu = $('<div></div>');
				divDropMenu.attr('class', 'dropdown-menu greyBg');
				divDropMenu.append(delLink);
				var btn = $('<button></button>');
				btn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
				var divDrop = $('<div></div>');
				divDrop.attr('class', 'dropdown d-inline');
				divDrop.append(btn, divDropMenu);
				var username = "<p class='greyText nomar d-inline'>" + formData.username + "</p>";
				$('<li></li>').appendTo('#userList').append(divDrop, username);
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
        success : function(response){
				$('#addProjForm').hide();
				$('#addProj').slideToggle();
				$('#projName').val('');
				var delLink = $('<a></a>').text('Delete');
				delLink.attr({ 'class': 'dropdown-item greyBg', 'href': '#'});
				delLink.click(deleteProj);
				var divDropMenu = $('<div></div>');
				divDropMenu.attr('class', 'dropdown-menu greyBg');
				divDropMenu.append(delLink);
				var btn = $('<button></button>');
				btn.attr({ 'class': 'btn btn-dark settings-buttons fa fa-cog', 'type': 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false'});
				var divDrop = $('<div></div>');
				divDrop.attr('class', 'dropdown d-inline ');
				divDrop.append(btn, divDropMenu);
				var projNameLink = "<a class='mylink pad-left d-inline' data-projId=" + response.projId + " href='/projects/" + response.projId + "/'>" + formData.projName + "</a>";
				$('<li></li>').appendTo('#projectList').append(divDrop, projNameLink);
			}
	});
}