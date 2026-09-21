// =========================================================
// SHOPSPHERE AUTHENTICATION
// =========================================================

// =========================================================
// GET LOGGED-IN USER
// =========================================================

function getLoggedInUser() {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Invalid user data:", error);
        return null;
    }
}

// =========================================================
// CHECK LOGIN STATUS
// =========================================================

function isLoggedIn() {
    return !!localStorage.getItem("token");
}

// =========================================================
// LOGIN
// =========================================================

async function loginUser(email, password) {

    try {

        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (data.token) {
            localStorage.setItem("token", data.token);
        }

        if (data.user) {
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
        }

        return data;

    } catch (error) {

        console.error("Login error:", error);

        throw error;
    }
}

// =========================================================
// REGISTER
// =========================================================

async function registerUser(name, email, password) {

    try {

        const data = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        return data;

    } catch (error) {

        console.error("Registration error:", error);

        throw error;
    }
}

// =========================================================
// LOGOUT
// =========================================================

function logoutUser() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}

// =========================================================
// GET USER ID
// =========================================================

function getUserId() {

    const user = getLoggedInUser();

    if (!user) {
        return null;
    }

    return user.id;
}

// =========================================================
// PROTECT PAGE
// =========================================================

function requireLogin() {

    if (!isLoggedIn()) {

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}