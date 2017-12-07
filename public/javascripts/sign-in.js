'use strict';

$("#signInForm").submit(function(event){
    // cancels the form submission
    event.preventDefault();
    submitForm();
});

function submitForm() {
	const formData = { "username": $('#username').val(), "password": $('#password').val() };
	$.ajax({
        type: 'POST',
        url: '/sign-in',
        data: formData,
        complete: res => {
            if (res.responseJSON.error === 'That user do not exist!') {
				$('#username').attr('class', 'form-control is-invalid');
				$('#password').attr('class', 'form-control');
			} else {
				$('#username').attr('class', 'form-control is-valid');
				if (res.responseJSON.error === 'Invalid password!')
					$('#password').attr('class', 'form-control is-invalid');
				else if (res.responseJSON.error === null) {
					$('#password').attr('class', 'form-control is-valid');
					window.location.replace('/');
				} else
					console.log(res.responseJSON.error);
			}	
		}
	});
}