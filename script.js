$(document).ready(function () {
    $.ajax({
      type: 'GET',
      url: '/main',
      success: function(response) {
        $("#bodymain").html(response);
      }
    });
  });