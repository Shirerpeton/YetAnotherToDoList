$("#passChangeForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	const formData = { "password": $('#password').val(), "newPassword": $('#newPassword').val(), "repNewPassword": $('#repNewPassword').val()};
	console.log(formData.newPassword.length);
	if (formData.newPassword.length < 6)
	{
		$('#newPassword').attr('class', 'form-control is-invalid');
		$('#invNewPass').text('Password must be at least 6 characters long!');
		$('#repNewPassword').attr('class', 'form-control');
	} else if (formData.newPassword.length > 20)
	{
		$('#newPassword').attr('class', 'form-control is-invalid');
		$('#invNewPass').text('Password must be no more than 20 characters long!');
		$('#repNewPassword').attr('class', 'form-control');
	} else if (formData.newPassword !== formData.repNewPassword)
	{
		$('#newPassword').attr('class', 'form-control is-invalid');
		$('#repNewPassword').attr('class', 'form-control is-invalid');
		$('#invNewPass').text('');
		$('#invRepNewPass').text('Passwords must match!');
	} else
		$.ajax({
			type: 'POST',
			url: '/change-password',
			data: formData,
			success : function(response){
				if (response.error === 'Invalid password!')
				{
					$('#password').attr('class', 'form-control is-invalid');
					$('#newPassword').attr('class', 'form-control');
					$('#repNewPassword').attr('class', 'form-control');
				}
				else if (response.error === null)
				{
					
					$('#newPassword').attr('class', 'form-control is-valid');
					$('#repNewPassword').attr('class', 'form-control is-valid');
					window.location.replace('/');
				}	
			}
		});
}