$("#signUpForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	const formData = { "username": $('#username').val(), "password": $('#password').val(), "repeatPassword": $('#repPassword').val()};
	$('#username').removeClass('is-invalid');
	$('#password').removeClass('is-invalid');
	$('#repPassword').removeClass('is-invalid');
	$('#username').removeClass('is-valid');
	$('#password').removeClass('is-valid');
	$('#repPassword').removeClass('is-valid');
	$('#invPass').text('');
	$('#invRepPass').text('');
	$('#invUsername').text('');
	if (formData.username.length < 2) {
		$('#username').addClass('is-invalid');
		$('#invUsername').text('Username must be no less than 2 characters long!');
	}
	else if (formData.username.length > 20) {
		$('#username').addClass('is-invalid');
		$('#invUsername').text('Username must be no more than 20 characters long!');
	}
	else if (formData.password.length < 6) {
		$('#password').addClass('is-invalid');
		$('#invPass').text('Password must be at least 6 characters long!');
	} else if (formData.password !== formData.repeatPassword) {
		$('#password').addClass('is-invalid');
		$('#repPassword').addClass('is-invalid');
		$('#invRepPass').text('Passwords must match!');
	} else {
		$.ajax({
			type: 'POST',
			url: '/sign-up',
			data: formData,
			complete : res => {
				if (res.responseJSON.error === 'That username is already taken!') {
					$('#username').addClass('is-invalid');
					$('#invUsername').text('That username is already taken!');
				}
				else if (res.responseJSON.error === null){
					$('#password').addClass('is-valid');
					$('#password').addClass('is-valid');
					$('#repPassword').addClass('is-valid');
					window.location.replace('/sign-in');
				} else
					console.log(res.responseJSON.error);
			}
		});
	}
}