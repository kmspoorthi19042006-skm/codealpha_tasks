/* =========================
   AUTHENTICATION
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupLogin();
        setupRegister();
        setupPasswordToggles();
        setupPasswordStrength();

    }
);


/* =========================
   LOGIN
========================= */

function setupLogin() {

    const form =
        document.getElementById("loginForm");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const button =
                document.getElementById(
                    "loginButton"
                );

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;


            try {

                setButtonLoading(
                    button,
                    true,
                    "Signing in..."
                );


                const data =
                    await loginUser({
                        email,
                        password
                    });


                localStorage.setItem(
                    "social_token",
                    data.token
                );


                localStorage.setItem(
                    "social_user",
                    JSON.stringify(data.user)
                );


                showToast(
                    "Welcome back! Redirecting..."
                );


                setTimeout(
                    () => {
                        window.location.href =
                            "shorts.html";
                    },
                    700
                );


            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Sign in"
                );

            }

        }
    );
}


/* =========================
   REGISTER
========================= */

function setupRegister() {

    const form =
        document.getElementById(
            "registerForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const button =
                document.getElementById(
                    "registerButton"
                );


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "registerEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    .value;


            if (password.length < 6) {

                showToast(
                    "Password must be at least 6 characters.",
                    "error"
                );

                return;
            }


            try {

                setButtonLoading(
                    button,
                    true,
                    "Creating account..."
                );


                const data =
                    await registerUser({
                        name,
                        username,
                        email,
                        password
                    });


                localStorage.setItem(
                    "social_token",
                    data.token
                );


                localStorage.setItem(
                    "social_user",
                    JSON.stringify(data.user)
                );


                showToast(
                    "Account created successfully!"
                );


                setTimeout(
                    () => {
                        window.location.href =
                            "shorts.html";
                    },
                    700
                );


            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Create account"
                );

            }

        }
    );
}


/* =========================
   PASSWORD TOGGLE
========================= */

function setupPasswordToggles() {

    const toggles = [
        {
            button:
                "passwordToggle",

            input:
                "password"
        },

        {
            button:
                "registerPasswordToggle",

            input:
                "registerPassword"
        }
    ];


    toggles.forEach(
        ({ button, input }) => {

            const toggle =
                document.getElementById(
                    button
                );

            const field =
                document.getElementById(
                    input
                );


            if (!toggle || !field) {
                return;
            }


            toggle.addEventListener(
                "click",
                () => {

                    const isPassword =
                        field.type ===
                        "password";


                    field.type =
                        isPassword
                            ? "text"
                            : "password";


                    toggle.textContent =
                        isPassword
                            ? "Hide"
                            : "Show";


                    toggle.setAttribute(
                        "aria-label",
                        isPassword
                            ? "Hide password"
                            : "Show password"
                    );

                }
            );

        }
    );
}


/* =========================
   PASSWORD STRENGTH
========================= */

function setupPasswordStrength() {

    const input =
        document.getElementById(
            "registerPassword"
        );

    const strength =
        document.getElementById(
            "passwordStrength"
        );


    if (!input || !strength) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            const value =
                input.value;


            strength.className =
                "password-strength";


            if (!value) {
                return;
            }


            let score = 0;


            if (value.length >= 6) {
                score++;
            }


            if (value.length >= 10) {
                score++;
            }


            if (
                /[A-Z]/.test(value) &&
                /[0-9]/.test(value)
            ) {
                score++;
            }


            if (score === 1) {

                strength.classList.add(
                    "weak"
                );

                strength.querySelector(
                    "small"
                ).textContent =
                    "Weak password";

            } else if (score === 2) {

                strength.classList.add(
                    "medium"
                );

                strength.querySelector(
                    "small"
                ).textContent =
                    "Good password";

            } else if (score >= 3) {

                strength.classList.add(
                    "strong"
                );

                strength.querySelector(
                    "small"
                ).textContent =
                    "Strong password";
            }

        }
    );
}