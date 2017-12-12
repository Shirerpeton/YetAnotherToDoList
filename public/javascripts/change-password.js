'use strict';

$("#passChangeForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	const formData = { "password": $('#password').val(), "newPassword": $('#newPassword').val(), "repeatNewPassword": $('#repNewPassword').val()};
	$('#password').removeClass('is-invalid');
	$('#newPassword').removeClass('is-invalid');
	$('#repNewpassword').removeClass('is-invalid');
	$('#password').removeClass('is-valid');
	$('#newPassword').removeClass('is-valid');
	$('#repNewPassword').removeClass('is-valid');
	$('#invNewPass').text('');
	$('#invRepNewPass').text('');
	if (formData.newPassword.length < 6) {
		$('#newPassword').addClass('is-invalid');
		$('#invNewPass').text('Password must be at least 6 characters long!');
	} else if (formData.newPassword !== formData.repeatNewPassword) {
		$('#newPassword').addClass('is-invalid');
		$('#repNewPassword').addClass('is-invalid');
		$('#invRepNewPass').text('Passwords must match!');
	} else
		$.ajax({
			type: 'POST',
			url: '/change-password',
			data: formData,
			complete : res => {
				if (res.responseJSON.error === 'Invalid password!')
					$('#password').addClass('is-invalid');
				else if (res.responseJSON.error === null) {
					$('#password').addClass('is-valid');
					$('#newPassword').addClass('is-valid');
					$('#repNewpassword').addClass('is-valid');
					window.location.replace('/');
				} else
					console.log(res.responseJSON.error);
			}
		});
}