$("#signUpForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	const formData = { "username": $('#username').val(), "password": $('#password').val(), "repPassword": $('#repPassword').val()};
	if (formData.username.length < 4)
	{
		$('#username').attr('class', 'form-control is-invalid');
		$('#invUsername').text('Username must be no less than 4 characters long!');
		$('#password').attr('class', 'form-control');
		$('#repPassword').attr('class', 'form-control');
	}
	else if (formData.username.length > 20)
	{
		$('#username').attr('class', 'form-control is-invalid');
		$('#invUsername').text('Username must be no more than 20 characters long!');
		$('#password').attr('class', 'form-control');
		$('#repPassword').attr('class', 'form-control');
	}
	else if (formData.password.length < 6)
	{
		$('#password').attr('class', 'form-control is-invalid');
		$('#invPass').text('Password must be at least 6 characters long!');
		$('#repPassword').attr('class', 'form-control');
	} else if (formData.password.length > 20)
	{
		$('#password').attr('class', 'form-control is-invalid');
		$('#invPass').text('Password must be no more than 20 characters long!');
		$('#repPassword').attr('class', 'form-control');
	} else if (formData.password !== formData.repPassword)
	{
		$('#password').attr('class', 'form-control is-invalid');
		$('#repPassword').attr('class', 'form-control is-invalid');
		$('#invPass').text('');
		$('#invRepPass').text('Passwords must match!');
	} else
		$.ajax({
			type: 'POST',
			url: '/sign-up',
			data: formData,
			success : (response) => {
				if (response.error === 'That username is already taken!')
				{
					$('#username').attr('class', 'form-control is-invalid');
					$('#invUsername').text(response.error);
					$('#password').attr('class', 'form-control');
					$('#repPassword').attr('class', 'form-control');
				}
				else if (response.error === null)
				{
					$('#username').attr('class', 'form-control is-valid');
					$('#password').attr('class', 'form-control is-valid');
					$('#repPassword').attr('class', 'form-control is-valid');
					window.location.replace('/');
				}
			}	
		});
}