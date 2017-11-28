$("#signInForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	var formData = { "username": $('#username').val(), "password": $('#password').val() };
	$.ajax({
        type: 'POST',
        url: '/users/sign-in',
        data: formData,
        success : function(response){
            if (response.error === 'That user do not exist!')
			{
				$('#username').attr('class', 'form-control is-invalid');
				$('#password').attr('class', 'form-control');
			}
			else
			{
				$('#username').attr('class', 'form-control is-valid');
				if (response.error === 'Invalid password!')
					$('#password').attr('class', 'form-control is-invalid');
				else if (response.error === null)
				{
					$('#password').attr('class', 'form-control is-valid');
					window.location.replace('/');
				}
			}	
		}
	});
}