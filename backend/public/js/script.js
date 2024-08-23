// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()

  let logsig = document.querySelector(".logsig");
  let profile = document.querySelector(".Profile");
  let showtimeout;
  
  profile.addEventListener("mouseover",()=>{
    console.log("clicked");
    clearTimeout(showtimeout);
    logsig.style.visibility = " visible";
  });

  profile.addEventListener("mouseout", () => {
    showtimeout= setTimeout(() => {
    logsig.style.visibility = "hidden";
    },3000);
  });
  