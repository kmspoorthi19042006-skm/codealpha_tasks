document.addEventListener("DOMContentLoaded", () => {

    console.log("FlowPilot auth.js loaded");


    /* =========================================================
       PASSWORD SHOW / HIDE
    ========================================================= */

    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");

    if (passwordInput && passwordToggle) {

        passwordToggle.addEventListener("click", () => {

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword ? "text" : "password";

            passwordToggle.textContent =
                isPassword ? "Hide" : "Show";

            passwordToggle.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );

            passwordToggle.setAttribute(
                "aria-pressed",
                String(isPassword)
            );

        });

    }


    /* =========================================================
       REGISTER
    ========================================================= */

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                console.log("Register form submitted");


                const fullName =
                    document
                        .getElementById("fullName")
                        .value
                        .trim();

                const username =
                    document
                        .getElementById("username")
                        .value
                        .trim();

                const email =
                    document
                        .getElementById("email")
                        .value
                        .trim();

                const password =
                    document
                        .getElementById("password")
                        .value;


                const button =
                    document.getElementById(
                        "registerButton"
                    );


                /* ---------------------------------------------
                   VALIDATION
                --------------------------------------------- */

                if (!fullName) {
                    showMessage(
                        "Please enter your full name.",
                        "error"
                    );
                    return;
                }

                if (username.length < 3) {
                    showMessage(
                        "Username must be at least 3 characters.",
                        "error"
                    );
                    return;
                }

                if (!email) {
                    showMessage(
                        "Please enter your email address.",
                        "error"
                    );
                    return;
                }

                if (password.length < 6) {
                    showMessage(
                        "Password must be at least 6 characters.",
                        "error"
                    );
                    return;
                }


                /* ---------------------------------------------
                   LOADING STATE
                --------------------------------------------- */

                button.disabled = true;
                button.textContent = "Creating account...";


                try {

                    console.log(
                        "Sending registration request..."
                    );


                    /* -----------------------------------------
                       API REQUEST
                    ----------------------------------------- */

                    const response =
                        await FlowPilotAPI.apiRequest(
                            "/auth/register",
                            {
                                method: "POST",

                                body: {
                                    full_name: fullName,
                                    username: username,
                                    email: email,
                                    password: password
                                }
                            }
                        );


                    console.log(
                        "Registration response:",
                        response
                    );


                    /* -----------------------------------------
                       SUCCESS
                    ----------------------------------------- */

                    if (
                        response.success &&
                        response.token
                    ) {

                        FlowPilotAPI.setToken(
                            response.token
                        );

                        if (response.user) {

                            FlowPilotAPI.setStoredUser(
                                response.user
                            );

                        }

                        showMessage(
                            "Account created successfully. Opening your workspace...",
                            "success"
                        );


                        setTimeout(() => {

                            window.location.href =
                                "/dashboard.html";

                        }, 700);

                        return;
                    }


                    /* -----------------------------------------
                       SUCCESS WITHOUT TOKEN
                    ----------------------------------------- */

                    if (response.success) {

                        showMessage(
                            "Account created successfully. Please sign in.",
                            "success"
                        );

                        setTimeout(() => {

                            window.location.href =
                                "/login.html";

                        }, 1000);

                        return;
                    }


                    throw new Error(
                        response.message ||
                        "Registration failed."
                    );


                } catch (error) {

                    console.error(
                        "Registration error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to create account.",
                        "error"
                    );

                    button.disabled = false;
                    button.textContent =
                        "Create account";
                }

            }
        );

    }


    /* =========================================================
       LOGIN
    ========================================================= */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const emailInput =
                    document.getElementById("email");

                const passwordInput =
                    document.getElementById("password");

                const button =
                    document.getElementById("loginButton");

                if (!emailInput || !passwordInput) {
                    return;
                }

                const email =
                    emailInput.value.trim();

                const password =
                    passwordInput.value;


                if (!email || !password) {

                    showMessage(
                        "Please enter your email and password.",
                        "error"
                    );

                    return;
                }


                if (button) {
                    button.disabled = true;
                    button.textContent = "Signing in...";
                }


                try {

                    const response =
                        await FlowPilotAPI.apiRequest(
                            "/auth/login",
                            {
                                method: "POST",

                                body: {
                                    email,
                                    password
                                }
                            }
                        );


                    if (
                        response.success &&
                        response.token
                    ) {

                        FlowPilotAPI.setToken(
                            response.token
                        );

                        if (response.user) {

                            FlowPilotAPI.setStoredUser(
                                response.user
                            );

                        }

                        window.location.href =
                            "/dashboard.html";

                        return;
                    }


                    throw new Error(
                        response.message ||
                        "Login failed."
                    );


                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to sign in.",
                        "error"
                    );

                    if (button) {
                        button.disabled = false;
                        button.textContent = "Sign in";
                    }

                }

            }
        );

    }

});


/* =========================================================
   MESSAGE HELPER
========================================================= */

function showMessage(message, type) {

    const element =
        document.getElementById("authError");

    if (!element) {

        alert(message);

        return;
    }


    element.textContent = message;

    element.style.display = "block";

    element.className =
        `auth-message ${type}`;


    if (type === "success") {

        element.style.color = "#166534";
        element.style.background = "#f0fdf4";
        element.style.border =
            "1px solid #bbf7d0";

    } else {

        element.style.color = "#991b1b";
        element.style.background = "#fef2f2";
        element.style.border =
            "1px solid #fecaca";

    }

}