'use strict';

$("#passChangeForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	const formData = { "password": $('#password').val(), "newPassword": $('#newPassword').val(), "repeatNewPassword": $('#repNewPassword').val()};
	if (formData.newPassword.length < 6) {
		$('#newPassword').attr('class', 'form-control is-invalid');
		$('#invNewPass').text('Password must be at least 6 characters long!');
		$('#repNewPassword').attr('class', 'form-control');
	} else if (formData.newPassword !== formData.repeatNewPassword) {
		$('#newPassword').attr('class', 'form-control is-invalid');
		$('#repNewPassword').attr('class', 'form-control is-invalid');
		$('#invNewPass').text('');
		$('#invRepNewPass').text('Passwords must match!');
	} else
		$.ajax({
			type: 'POST',
			url: '/change-password',
			data: formData,
			complete : res => {
				if (res.responseJSON.error === 'Invalid password!') {
					$('#password').attr('class', 'form-control is-invalid');
					$('#newPassword').attr('class', 'form-control');
					$('#repNewPassword').attr('class', 'form-control');
				}
				else if (res.responseJSON.error === null) {
					
					$('#newPassword').attr('class', 'form-control is-valid');
					$('#repNewPassword').attr('class', 'form-control is-valid');
					window.location.replace('/');
				} else
					console.log(res.responseJSON.error);
			}
		});
}