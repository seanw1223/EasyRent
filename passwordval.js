// Password validation function
function validatePassword(password) {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{9,}$/;
    return re.test(password); // Requires at least one uppercase letter, one number, special character, minimum length of 9
}
