const API_BASE = "/api";

const TOKEN_KEY = "flowpilot_token";
const USER_KEY = "flowpilot_user";

// ========================================
// TOKEN
// ========================================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(
        TOKEN_KEY,
        token
    );
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// ========================================
// USER
// ========================================

function getStoredUser() {
    try {
        return JSON.parse(
            localStorage.getItem(USER_KEY)
        );
    } catch {
        return null;
    }
}

function setStoredUser(user) {
    localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
    );
}

// ========================================
// API REQUEST
// ========================================

async function apiRequest(
    endpoint,
    options = {}
) {
    const {
        method = "GET",
        body,
        headers = {}
    } = options;

    const config = {
        method,
        headers: {
            ...headers
        }
    };

    if (body !== undefined) {
        config.headers["Content-Type"] =
            "application/json";

        config.body =
            JSON.stringify(body);
    }

    const token = getToken();

    if (token) {
        config.headers.Authorization =
            `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE}${endpoint}`,
            config
        );
    } catch (error) {
        throw new Error(
            "Unable to connect to FlowPilot server."
        );
    }

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {

        if (response.status === 401) {
            clearAuth();
        }

        throw new Error(
            data.message ||
            "Something went wrong."
        );
    }

    return data;
}

// ========================================
// AUTH HELPERS
// ========================================

function isLoggedIn() {
    return Boolean(getToken());
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href =
            "/login.html";
        return false;
    }

    return true;
}

function logout() {
    clearAuth();

    window.location.href =
        "/login.html";
}

// ========================================
// FETCH CURRENT USER
// ========================================

async function fetchCurrentUser() {
    const data =
        await apiRequest(
            "/auth/me"
        );

    if (data.user) {
        setStoredUser(
            data.user
        );
    }

    return data.user;
}

// ========================================
// EXPORT GLOBAL API
// ========================================

window.FlowPilotAPI = {
    API_BASE,

    getToken,
    setToken,

    getStoredUser,
    setStoredUser,

    clearAuth,
    isLoggedIn,
    requireAuth,
    logout,

    apiRequest,
    fetchCurrentUser
};