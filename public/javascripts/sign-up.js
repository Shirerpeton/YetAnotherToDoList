$("#signUpForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	const formData = { "username": $('#username').val(), "password": $('#password').val(), "repPassword": $('#repPassword').val()};
	$.ajax({
        type: 'POST',
        url: '/users/sign-up',
        data: formData,
        success : (response) => {
            if (response.username === 'long')
			{
				$('#username').attr('class', 'form-control is-invalid');
				$('#invUsername').text('Username must be no more than 20 characters long');
				$('#password').attr('class', 'form-control');
				$('#repPassword').attr('class', 'form-control');
			} else if (!response.username)
			{
				$('#username').attr('class', 'form-control is-invalid');
				$('#invUsername').text('This username is already taken!');
				$('#password').attr('class', 'form-control');
				$('#repPassword').attr('class', 'form-control');
			}
			else
			{
				$('#username').attr('class', 'form-control is-valid');
				if (response.password === 'short')
				{
					$('#password').attr('class', 'form-control is-invalid');
					$('#invPass').text('Password must be at least 6 characters long!');
					$('#repPassword').attr('class', 'form-control');
				}
				if (response.password === 'long')
				{
					$('#password').attr('class', 'form-control is-invalid');
					$('#invPass').text('Password must be no more than 20 characters long!');
					$('#repPassword').attr('class', 'form-control');
				}
				else if (response.password === 'diff')
				{
					$('#password').attr('class', 'form-control is-invalid');
					$('#repPassword').attr('class', 'form-control is-invalid');
					$('#invPass').text('');
					$('#invRepPass').text('Passwords must match!');
				}
				else if (response.password === true)
				{
					$('#password').attr('class', 'form-control is-valid');
					$('#repPassword').attr('class', 'form-control is-valid');
					window.location.replace('/');
				}
			}	
		}
	});
}