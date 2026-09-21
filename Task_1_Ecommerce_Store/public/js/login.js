// =========================================================
// SHOPSPHERE LOGIN PAGE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginButton = document.getElementById("login-btn");
  const messageBox = document.getElementById("login-message");

  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");

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
  // LOGIN FORM SUBMISSION
  // ---------------------------------------------------------
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginMessage("Please enter your email and password.", "error");
      return;
    }

    try {
      setButtonState("loading");

      const data = await loginUser(email, password);

      showLoginMessage("Login successful! Redirecting...", "success");

      // Handle redirect if present
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

      setTimeout(() => {
        window.location.href = redirect || "index.html";
      }, 800);
    } catch (error) {
      console.error("Login failed:", error);

      showLoginMessage(error.message || "Invalid email or password.", "error");

      setButtonState("default");
    }
  });

  // ---------------------------------------------------------
  // BUTTON STATE HANDLER
  // ---------------------------------------------------------
  function setButtonState(state) {
    if (!loginButton) return;

    if (state === "loading") {
      loginButton.disabled = true;
      loginButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Signing In...
      `;
    } else {
      loginButton.disabled = false;
      loginButton.innerHTML = `
        <i class="fa-solid fa-right-to-bracket"></i>
        Sign In
      `;
    }
  }
});

// =========================================================
// LOGIN MESSAGE HANDLER
// =========================================================
function showLoginMessage(message, type) {
  const messageBox = document.getElementById("login-message");
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
  messageBox.setAttribute("aria-live", "polite");
}