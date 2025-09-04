// =============================
// Local Storage Authentication
// =============================

// Utility to get users from localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

// Utility to save users to localStorage
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// DOM elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');

const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const signupSuccess = document.getElementById('signup-success');
const forgotError = document.getElementById('forgot-error');
const forgotSuccess = document.getElementById('forgot-success');

const formTitle = document.getElementById('form-title');

// Toggle functions
function showForm(form) {
  [loginForm, signupForm, forgotForm].forEach(f => f.classList.remove('active'));
  form.classList.add('active');
  loginError.textContent = '';
  signupError.textContent = '';
  signupSuccess.textContent = '';
  forgotError.textContent = '';
  forgotSuccess.textContent = '';
  if (form === loginForm) {
    formTitle.textContent = 'User Login';
  } else if (form === signupForm) {
    formTitle.textContent = 'User Sign Up';
  } else if (form === forgotForm) {
    formTitle.textContent = 'Reset Password';
  }
}

// Navigation between forms
document.getElementById('to-signup').addEventListener('click', () => showForm(signupForm));
document.getElementById('to-login-from-signup').addEventListener('click', () => showForm(loginForm));
document.getElementById('to-forgot').addEventListener('click', () => showForm(forgotForm));
document.getElementById('to-login-from-forgot').addEventListener('click', () => showForm(loginForm));

// =============================
// Signup
// =============================
signupForm.addEventListener('submit', e => {
  e.preventDefault();
  signupError.textContent = '';
  signupSuccess.textContent = '';

  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!email || !password) {
    signupError.textContent = 'Please enter both email and password.';
    return;
  }

  if (password.length < 6) {
    signupError.textContent = 'Password should be at least 6 characters.';
    return;
  }

  let users = getUsers();
  if (users.find(u => u.email === email)) {
    signupError.textContent = 'Email already registered.';
    return;
  }

  users.push({ email, password });
  saveUsers(users);

  signupSuccess.textContent = 'Sign-up successful! Redirecting...';
  localStorage.setItem("currentUser", email);

  setTimeout(() => {
    window.location.href = 'userHome.html';
  }, 2000);
});

// =============================
// Login
// =============================
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    loginError.textContent = 'Please enter both email and password.';
    return;
  }

  let users = getUsers();
  let user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem("currentUser", email);
    window.location.href = 'userHome.html';
  } else {
    loginError.textContent = 'Invalid Email/Password';
    loginForm.classList.add('shake');
    setTimeout(() => loginForm.classList.remove('shake'), 500);
  }
});

// =============================
// Forgot Password
// =============================
forgotForm.addEventListener('submit', e => {
  e.preventDefault();
  forgotError.textContent = '';
  forgotSuccess.textContent = '';

  const email = document.getElementById('forgot-email').value.trim();

  if (!email) {
    forgotError.textContent = 'Please enter your email address.';
    return;
  }

  let users = getUsers();
  if (users.find(u => u.email === email)) {
    forgotSuccess.textContent = 'Password reset is not supported locally. Please contact admin.';
    // Or: implement a default reset like resetting to "123456"
  } else {
    forgotError.textContent = 'Email not found.';
  }
});

// =============================
// Redirect if logged in
// =============================
if (localStorage.getItem("currentUser")) {
  window.location.href = 'userHome.html';
}

// Initially show login form
showForm(loginForm);
