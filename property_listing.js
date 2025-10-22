if (window.location.pathname === '/propertyPage') {
    // Get the property ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.get('propertyname'));

    // Get property from server
    $.ajax({
        url: '/property',
        type: 'GET',
        data: { propertyname: urlParams.get('propertyname') },
        success: function(property) {
            console.log(property);
            $('#property-name').text(property.propertyname);
            $('#property-location').text(property.propertylocation);
            $('#property-price').text(`${property.propertyprice} per month`);
            $('#property-description').text(property.propertydescription);
            $('#property-image').attr('src', property.propertyimage || 'house_image.jpeg');
        },
        error: function(xhr) {
            alert(xhr.responseJSON.message);
        }
    });
}


