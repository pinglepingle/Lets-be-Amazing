// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
  'use strict'

  window.addEventListener('load', function () {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation')

    // Loop over them and prevent submission
    Array.prototype.filter.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        // If not all forms checked in, prevent from sending
        if (form.checkValidity() === false) {
          event.preventDefault()
          event.stopPropagation()
          
        }
        // Else, display pop up and make reload and scroll to top if validation is correct
        else {
          $('#screen').css({	"display": "block", opacity: 0.7, "width": '100%',"height": '100%', "position": 'fixed', "z-index": '9'});
          $('body').css({"overflow":"hidden"});
          $('#box').css({"display": "block"}).click(function(){$(this).css("display", "none");$('#screen').css("display", "none"); window.scrollTo(0,0); location.reload();});
        
          event.preventDefault()
          event.stopPropagation()
        }        
        form.classList.add('was-validated')
      }, false)
    })
  }, false)
}())
