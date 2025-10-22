function validateRole(role) {
    return role === 'tenant' || role === 'landlord';
}
if (!validateRole(role)) {
    return next({ status: 400, message: "Role must be either 'tenant' or 'landlord'" });
}
