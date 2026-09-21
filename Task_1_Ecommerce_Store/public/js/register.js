// =========================================================
// SHOPSPHERE REGISTER PAGE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
const registerForm = document.getElementById("register-form");
const registerButton = document.getElementById("register-btn");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");

const togglePassword = document.getElementById("toggle-password");
const toggleConfirmPassword = document.getElementById("toggle-confirm-password");

// ---------------------------------------------------------
// SHOW / HIDE PASSWORD
// ---------------------------------------------------------
togglePassword?.addEventListener("click", () => {
const isPassword = passwordInput.type === "password";
passwordInput.type = isPassword ? "text" : "password";

togglePassword.innerHTML = isPassword  
  ? '<i class="fa-solid fa-eye-slash"></i>'  
  : '<i class="fa-solid fa-eye"></i>';

});

// ---------------------------------------------------------
// SHOW / HIDE CONFIRM PASSWORD
// ---------------------------------------------------------
toggleConfirmPassword?.addEventListener("click", () => {
const isPassword = confirmPasswordInput.type === "password";
confirmPasswordInput.type = isPassword ? "text" : "password";

toggleConfirmPassword.innerHTML = isPassword  
  ? '<i class="fa-solid fa-eye-slash"></i>'  
  : '<i class="fa-solid fa-eye"></i>';

});

// ---------------------------------------------------------
// FORM SUBMISSION
// ---------------------------------------------------------
registerForm?.addEventListener("submit", async (event) => {
event.preventDefault();

const name = nameInput.value.trim();  
const email = emailInput.value.trim();  
const password = passwordInput.value;  
const confirmPassword = confirmPasswordInput.value;  

// -----------------------------------------------------  
// BASIC VALIDATION  
// -----------------------------------------------------  
if (!name || !email || !password || !confirmPassword) {  
  showRegisterMessage("Please fill in all fields.", "error");  
  return;  
}  

if (name.length < 2) {  
  showRegisterMessage("Please enter a valid name.", "error");  
  return;  
}  

if (password.length < 6) {  
  showRegisterMessage("Password must be at least 6 characters long.", "error");  
  return;  
}  

if (password !== confirmPassword) {  
  showRegisterMessage("Passwords do not match.", "error");  
  return;  
}  

try {  
  setRegisterButtonState("loading");  

  await registerUser(name, email, password);  

  showRegisterMessage("Account created successfully! Redirecting to login...", "success");  

  setTimeout(() => {  
    window.location.href = "login.html";  
  }, 1000);  
} catch (error) {  
  console.error("Registration failed:", error);  

  showRegisterMessage(error.message || "Unable to create your account.", "error");  

  setRegisterButtonState("default");  
}

});

// ---------------------------------------------------------
// BUTTON STATE HANDLER
// ---------------------------------------------------------
function setRegisterButtonState(state) {
if (!registerButton) return;

if (state === "loading") {  
  registerButton.disabled = true;  
  registerButton.innerHTML = `  
    <i class="fa-solid fa-spinner fa-spin"></i>  
    Creating Account...  
  `;  
} else {  
  registerButton.disabled = false;  
  registerButton.innerHTML = `  
    <span>Create Account</span>  
    <i class="fa-solid fa-arrow-right"></i>  
  `;  
}

}
});

// =========================================================
// REGISTER MESSAGE HANDLER
// =========================================================
function showRegisterMessage(message, type) {
const messageBox = document.getElementById("register-message");
if (!messageBox) return;

messageBox.textContent = message;
messageBox.className =' auth-message ${type}';
messageBox.setAttribute("aria-live", "polite");
}

