// Flash messages
const flashMessage = document.getElementById('flashMessage');

const displayMessage = (string, error = false) => {
    flashMessage.querySelector('p').innerText = string;
    if (error) {
        flashMessage.classList.add('alert-danger');
        flashMessage.classList.remove('alert-success');
    } else {
        flashMessage.classList.add('alert-success')
        flashMessage.classList.remove('alert-danger');
    }
    mdb.Alert.getInstance(flashMessage).show();
    // flashMessage.classList.remove('d-none');
}
const hideMessage = () => {
    flashMessage.querySelector('p').innerText = '';
    flashMessage.classList.remove('alert-danger');
    mdb.Alert.getInstance(flashMessage).hide();
    // flashMessage.classList.add('d-none');
}

