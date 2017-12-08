'use strict';

$("#signInForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm() {
	const formData = { "username": $('#username').val(), "password": $('#password').val() };
	$('#username').removeClass('is-invalid');
	$('#password').removeClass('is-invalid');
	$('#username').removeClass('is-valid');
	$('#password').removeClass('is-valid');
	$.ajax({
        type: 'POST',
        url: '/sign-in',
        data: formData,
        complete: res => {
            if (res.responseJSON.error === 'That user do not exist!')
				$('#username').addClass('is-invalid');
			else {
				$('#username').addClass('is-valid');
				if (res.responseJSON.error === 'Invalid password!')
					$('#password').addClass('is-invalid');
				else if (res.responseJSON.error === null) {
					$('#password').addClass('is-valid');
					window.location.replace('/');
				} else
					console.log(res.responseJSON.error);
			}	
		}
	});
}