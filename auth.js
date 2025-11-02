document.addEventListener('DOMContentLoaded', () => {


    // --- SIGN UP FORM LOGIC ---
    const signupForm = document.getElementById('signupForm');


    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();


            const name = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;


            try {
                const response = await fetch('http://127.0.0.1:5000/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });


                const data = await response.json();


                if (response.ok) {
                    alert('Signup successful! ' + data.message);
                    window.location.href = 'login.html';
                } else {
                    alert('Signup failed: ' + data.error);
                }
            } catch (error) {
                console.error('Signup Error:', error);
                alert('An error occurred. Could not connect to the server.');
            }
        });
    }


    // --- SIGN IN FORM LOGIC ---
    const signinForm = document.getElementById('signinForm');


    if (signinForm) {
        signinForm.addEventListener('submit', async function(event) {
            event.preventDefault();


            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;


            try {
                const response = await fetch('http://127.0.0.1:5000/api/signin', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });


                const data = await response.json();


                if (response.ok) {
                    // Save user data in localStorage
                    localStorage.setItem('username', data.user.username);
                    localStorage.setItem('userEmail', data.user.email);
                    localStorage.setItem('userRole', data.user.role || 'Student');
                    localStorage.setItem('userUid', data.user.uid);
                    
                    alert('Sign-in successful! ' + data.message);
                    window.location.href = 'Main.html';
                } else {
                    alert('Sign-in failed: ' + data.error);
                }
            } catch (error) {
                console.error('Signin Error:', error);
                alert('An error occurred. Could not connect to the server.');
            }
        });
    }
    
    // --- "STAY LOGGED IN" LOGIC (for Main.html) ---
    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    const userUid = localStorage.getItem('userUid');


    const guestInfo = document.getElementById('guestInfo');
    const userInfo = document.getElementById('userInfo');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logoutButton = document.getElementById('logoutButton');
    const adminLink = document.getElementById('adminLink');


    if (username && userEmail) {
        // User is logged in
        if (guestInfo) {
            guestInfo.style.display = 'none';
        }
        if (userInfo) {
            userInfo.style.display = 'flex'; 
        }
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${username}!`;
        }

        // Show admin link only if user is admin
        if (adminLink) {
            if (userRole === 'Admin') {
                adminLink.style.display = 'block';
            } else {
                adminLink.style.display = 'none';
            }
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('username');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userUid');
                
                alert('You have been logged out.');
                window.location.href = 'Main.html';
            });
        }
        
    } else {
        // User is a guest
        if (guestInfo) {
            guestInfo.style.display = 'flex'; 
        }
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        if (adminLink) {
            adminLink.style.display = 'none';
        }
    }
});

async function loadHeaderProfilePic(userEmail) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/profile/${userEmail}`);
    if (response.ok) {
      const data = await response.json();
      const profilePic = document.getElementById('headerProfilePic');
      if (data.user.profile_pic) {
        profilePic.src = data.user.profile_pic;
      }
    }
  } catch (error) {
    console.error('Error loading profile pic:', error);
  }
}

// Check login status
const userEmail = localStorage.getItem('userEmail');
const userName = localStorage.getItem('userName');
const userRole = localStorage.getItem('userRole');

const userInfo = document.getElementById('userInfo');
const guestInfo = document.getElementById('guestInfo');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutButton = document.getElementById('logoutButton');
const adminLink = document.getElementById('adminLink');

if (userEmail) {
  // User is logged in
  if (guestInfo) guestInfo.style.display = 'none';
  if (userInfo) userInfo.style.display = 'flex';
  
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${userName || 'User'}!`;
  }

  // Load profile picture in header
  loadHeaderProfilePic(userEmail);

  // Show admin link if user is admin
  if (adminLink) {
    if (userRole === 'Admin') {
      adminLink.style.display = 'block';
    } else {
      adminLink.style.display = 'none';
    }
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userUid');
      window.location.href = 'Main.html';
    });
  }
} else {
  // User is not logged in
  if (userInfo) userInfo.style.display = 'none';
  if (guestInfo) guestInfo.style.display = 'flex';
}