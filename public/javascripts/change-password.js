$("#passChangeForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm()
{
	var formData = { "password": $('#password').val(), "newPassword": $('#newPassword').val(), "repNewPassword": $('#repNewPassword').val()};
	$.ajax({
        type: 'POST',
        url: '/change-password',
        data: formData,
        success : function(response){
            if (!response.password)
			{
				$('#password').attr('class', 'form-control is-invalid');
				$('#newPassword').attr('class', 'form-control');
				$('#repNewPassword').attr('class', 'form-control');
			}
			else
			{
				$('#password').attr('class', 'form-control is-valid');
				if (response.newPassword === 'short')
				{
					$('#newPassword').attr('class', 'form-control is-invalid');
					$('#invPass').text('New password must be at least 6 characters long!');
					$('#repNewPassword').attr('class', 'form-control');
				}
				else if (response.newPassword === 'diff')
				{
					$('#newPassword').attr('class', 'form-control is-invalid');
					$('#repNewPassword').attr('class', 'form-control is-invalid');
					$('#invPass').text('');
					$('#invRepPass').text('New passwords must match!');
				}
				else
				{
					$('#newPassword').attr('class', 'form-control is-valid');
					$('#repNewPassword').attr('class', 'form-control is-valid');
					window.location.replace('/');
				}
			}	
		}
	});
}