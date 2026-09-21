/* =========================
   TOAST NOTIFICATIONS
========================= */

function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <span class="toast-message">
            ${escapeHTML(message)}
        </span>
        <button class="toast-close" aria-label="Close notification">
            ×
        </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const removeToast = () => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);
    };

    toast
        .querySelector(".toast-close")
        .addEventListener("click", removeToast);

    setTimeout(removeToast, 3500);
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
}


/* =========================
   DATE FORMATTING
========================= */

function formatPostDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const difference =
        Math.floor((now - date) / 1000);

    if (difference < 60) {
        return "Just now";
    }

    if (difference < 3600) {
        const minutes =
            Math.floor(difference / 60);

        return `${minutes}m`;
    }

    if (difference < 86400) {
        const hours =
            Math.floor(difference / 3600);

        return `${hours}h`;
    }

    if (difference < 604800) {
        const days =
            Math.floor(difference / 86400);

        return `${days}d`;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================
   LOADING STATE
========================= */

function setButtonLoading(button, loading, text = "Loading...") {
    if (!button) {
        return;
    }

    if (loading) {
        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <span class="button-spinner"></span>
            ${text}
        `;
    } else {
        button.disabled = false;

        button.innerHTML =
            button.dataset.originalText || text;
    }
}


/* =========================
   AUTH CHECK
========================= */

function requireAuth() {
    const token =
        localStorage.getItem("social_token");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/* =========================
   LOGOUT
========================= */

function logoutUser() {
    localStorage.removeItem("social_token");
    localStorage.removeItem("social_user");

    window.location.href = "login.html";
}


/* =========================
   AVATAR
========================= */

function getInitials(name) {
    if (!name) {
        return "?";
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================
   PAGE TRANSITION
========================= */

function enablePageTransition() {
    document.body.classList.add("page-ready");
}


/* =========================
   CHARACTER COUNTER
========================= */

function setupCharacterCounter(
    textarea,
    counter,
    maxLength
) {
    if (!textarea || !counter) {
        return;
    }

    const updateCounter = () => {
        const length = textarea.value.length;

        counter.textContent =
            `${length}/${maxLength}`;

        counter.classList.toggle(
            "near-limit",
            length >= maxLength * 0.8
        );

        counter.classList.toggle(
            "at-limit",
            length >= maxLength
        );
    };

    textarea.addEventListener(
        "input",
        updateCounter
    );

    updateCounter();
}


document.addEventListener(
    "DOMContentLoaded",
    enablePageTransition
);