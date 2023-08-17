document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#submit-email').addEventListener('click', send_email);

  // By default, load the inbox
  load_mailbox('inbox')

  
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#individual-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  // Clear out composition fields
  document.querySelector("#error-message").innerHTML = ``;
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function reply_email(emailId) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#individual-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  // Fetch data

  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(email => {
    
    document.querySelector("#error-message").innerHTML = ``;
    document.querySelector('#compose-recipients').value = `${email.sender}`;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  })
}

async function load_mailbox(mailbox) {
  try {
    const response = await fetch(`/emails/${mailbox}`);
    const emails = await response.json()

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#individual-email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    emails.forEach(email => {
      let div = document.createElement("div");
      div.className = "email-container";

      let subtitleContent;
      if(email.body.length < 33) {
        subtitleContent = `${email.body}`;
      } else{
        subtitleContent = `${email.body.slice(0,30)}...`
      }

      if(email.read == true){
        div.style.backgroundColor = "#eaf6f6";
      } else {
        div.style.backgroundColor = "white";
      }

      
      div.innerHTML = `
      <div class="email-container-leftside">
          <div class="email-container-leftside-title-and-btn">
            <button class="email-archive-btn"><span class="material-symbols-outlined" id="not-archived">bookmark</span></button>
            <p class="email-content-sender">${email.sender}</p>
          </div>
          <p class="email-content-title">${email.subject}</p>
          <p class="email-content-subtitle">${subtitleContent}</p>
      </div>
      <div class="email-container-rightside">
          <p class="email-timestamp">${email.timestamp}</p>
      </div>
      `

      if(email.archived == true) {
        div.querySelector('.material-symbols-outlined').id = "archived";
      } else {
        div.querySelector('.material-symbols-outlined').id = "not-archived";
      }

      div.querySelectorAll("p").forEach( element => {
        element.addEventListener('click', () => seeEmail(email.id))
      });

      div.querySelector(".email-archive-btn").myParam = email.id
      div.querySelector(".email-archive-btn").addEventListener('click', changeArchiveStatus)
      
      document.querySelector("#emails-view").append(div);

    })
  }
  catch(error) {
    console.error("Error loading mailbox:", error);
  }
}

function send_email() {
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value
    })
  })
  .then(response => response.json())
  .then(result => {
      // handle 3 cases
      // Success 201 status code : {"message": "Email sent successfully."}.
      if (result.message == "Email sent successfully."){
        load_mailbox("inbox")
      }
      else {
        // Error 401 : {"error": "At least one recipient required."} or "error": "User with email baz@example.com does not exist."}
        document.querySelector("#error-message").innerHTML = `<h3 class="text-danger">${result.error}</h3>`;
      }
  });
}


function changeArchiveStatus(event) {
  // Find the clicked email container

  const clickedEmailContainer = event.target.closest('.email-container');

  // Find the icon element within the clicked email container
  const iconElement = clickedEmailContainer.querySelector('.material-symbols-outlined');

  // Get the current font variation settings
  const currentId = iconElement.id

  emailId = event.currentTarget.myParam

  // Toggle the font variation settings
  if (currentId === "not-archived") {
    iconElement.id = "archived";
    fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
  } else {
    iconElement.id = "not-archived";
    fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
  }
}


function seeEmail(emailId) {
  fetch(`emails/${emailId}`)
      .then(response => response.json())
      .then(email => {
        
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#individual-email-view').style.display = 'block';
    

        let div = document.createElement('div');

        div.innerHTML = `
          <div>
              <p><span class="font-weight-bold">From: </span>${email.sender}</p>
              <p><span class="font-weight-bold">To: </span>${email.recipients}</p>
              <p><span class="font-weight-bold">Subject: </span>${email.subject}</p>
              <p><span class="font-weight-bold">Timestamp: </span>${email.timestamp}</p>
              <button class="btn btn-sm btn-outline-primary" id="reply-btn" >Reply</button>
              <div class="archive-container-inside"><button class="email-archive-btn"><p>Archive</p><span class="material-symbols-outlined" id="not-archived">bookmark</span></button>
              </div>
          </div>
          <hr>
          <div>
              <p>${email.body}</p>
          </div>
        `
        div.querySelector("#reply-btn").addEventListener('click', () => reply_email(emailId));

        // Set the archive icon fill dependng on archive status
        if(email.archived == true) {
          div.querySelector('.material-symbols-outlined').id = "archived";
        } else {
          div.querySelector('.material-symbols-outlined').id = "not-archived";
        }
        //

        div.querySelector(".email-archive-btn").addEventListener('click', () => {
          
          iconElement = document.querySelector(".material-symbols-outlined")
          if (iconElement.id === "not-archived") {
            iconElement.id = "archived";
            fetch(`/emails/${emailId}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          } else {
            iconElement.id = "not-archived";
            fetch(`/emails/${emailId}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            })
          }
        })

        document.querySelector("#individual-email-view").replaceChildren(div);
      });

  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
        read:true
    })
  })
}