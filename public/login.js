// login.js
// Manages Sign In / Sign Up and integrates with donation_db users table

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
        window.location.href = 'index.html';
        return;
    }

    // Tab elements
    const signInTab     = document.getElementById('signInTab');
    const signUpTab     = document.getElementById('signUpTab');
    const signInForm    = document.getElementById('signInForm');
    const signUpForm    = document.getElementById('signUpForm');
    const statusMessage = document.getElementById('statusMessage');
  
    // Default to Sign In view
    showTab('signin');
  
    // Tab switching
    signInTab.addEventListener('click', ()  => showTab('signin'));
    signUpTab.addEventListener('click', ()  => showTab('signup'));
  
    // Form handlers
    signInForm.addEventListener('submit', handleSignIn);
    signUpForm.addEventListener('submit', handleSignUp);
});
  
// Toggle between Sign In and Sign Up
function showTab(tab) {
    const signinForm = document.getElementById('signin');
    const signupForm = document.getElementById('signup');
    const signinTab  = document.getElementById('signInTab');
    const signupTab  = document.getElementById('signUpTab');
  
    if (tab === 'signin') {
        signinForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        signinTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        signupForm.classList.remove('hidden');
        signinForm.classList.add('hidden');
        signupTab.classList.add('active');
        signinTab.classList.remove('active');
    }
}
  
// Sign In handler: logs in via email and password
async function handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const status = document.getElementById('statusMessage');

    if (!email || !password) {
        status.textContent = 'Please fill in all fields';
        status.style.color = 'red';
        return;
    }

    status.textContent = 'Signing in...';
    status.style.color = 'blue';

    try {
        console.log('Attempting login with:', { email }); // Debug log

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('Login response status:', res.status); // Debug log

        if (!res.ok) {
            const error = await res.json();
            console.error('Login error:', error); // Debug log
            throw new Error(error.error || 'Invalid email/password');
        }

        const data = await res.json();
        console.log('Login successful, user data:', data); // Debug log

        // Store user session info
        localStorage.setItem('userId', data.id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('fullName', data.full_name);
        localStorage.setItem('email', data.email);
        localStorage.setItem('phone', data.phone || '');
        localStorage.setItem('role', data.role);
        
        // Add a timestamp for session management
        localStorage.setItem('loginTime', new Date().toISOString());

        // Redirect to main page
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Sign In error:', err);
        status.textContent = err.message;
        status.style.color = 'red';
    }
}
  
async function handleSignUp(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const fullName = document.getElementById('signup-name').value.trim();
    const phone    = document.getElementById('signup-phone').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const status   = document.getElementById('statusMessage');
  
    // Validate required fields
    if (!username || !fullName || !email || !password) {
        status.textContent = 'Please fill in all required fields';
        status.style.color = 'red';
        return;
    }

    // Validate username (only letters, numbers, and underscores)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        status.textContent = 'Username can only contain letters, numbers, and underscores';
        status.style.color = 'red';
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        status.textContent = 'Please enter a valid email address';
        status.style.color = 'red';
        return;
    }

    // Validate password length
    if (password.length < 6) {
        status.textContent = 'Password must be at least 6 characters long';
        status.style.color = 'red';
        return;
    }

    status.textContent = 'Registering...';
    status.style.color = 'blue';
  
    try {
        console.log('Sending registration request with:', { username, email, full_name: fullName });

        const res = await fetch('/api/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                full_name: fullName,
                phone: phone || null,
                address: null
            })
        });

        const data = await res.json();
        console.log('Registration response:', { status: res.status, data });

        // Double check if user exists in database
        if (data.id && data.email === email) {
            // Registration successful
            console.log('Registration successful:', data);

            // Clear form
            document.getElementById('signup-username').value = '';
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-phone').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
        
            status.textContent = 'Registration successful! Please sign in.';
            status.style.color = 'green';
            
            // Switch to sign in tab after successful registration
            setTimeout(() => {
                showTab('signin');
            }, 2000);
        } else if (data.error) {
            // Server returned an error message
            throw new Error(data.error);
        } else {
            // Unexpected response
            throw new Error('Registration failed. Please try again.');
        }
    } catch (err) {
        console.error('Sign Up error:', err);
        status.textContent = err.message;
        status.style.color = 'red';
    }
}

  
// Demo login for testing
async function handleDemoLogin() {
    try {
        console.log('Attempting demo login'); // Debug log

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'john@example.com',
                password: 'john123'
            })
        });

        console.log('Demo login response status:', res.status); // Debug log

        if (!res.ok) {
            const error = await res.json();
            console.error('Demo login error:', error); // Debug log
            throw new Error(error.error || 'Demo login failed');
        }

        const data = await res.json();
        console.log('Demo login successful, user data:', data); // Debug log

        // Store user session info
        localStorage.setItem('userId', data.id);
        localStorage.setItem('username', data.username);
        localStorage.setItem('fullName', data.full_name);
        localStorage.setItem('email', data.email);
        localStorage.setItem('phone', data.phone || '');
        localStorage.setItem('role', data.role);

        // Redirect to main page
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Demo login error:', err);
        const status = document.getElementById('statusMessage');
        status.textContent = err.message;
        status.style.color = 'red';
    }
}
  