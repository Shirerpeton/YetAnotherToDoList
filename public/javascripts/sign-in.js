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
            if (!response.username)
				$('#username').attr('class', 'form-control is-invalid');
			else
			{
				$('#username').attr('class', 'form-control is-valid');
				if (!response.password)
					$('#password').attr('class', 'form-control is-invalid');
				else
				{
					$('#password').attr('class', 'form-control is-valid');
					window.location.replace("../../../");
				}
			}	
		}
	});
}