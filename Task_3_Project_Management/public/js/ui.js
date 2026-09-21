(function () {
    "use strict";

    // =====================================================
    // HELPERS
    // =====================================================

    function initials(name) {
        if (!name) {
            return "FP";
        }

        const parts = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }


    function formatDate(dateValue) {
        if (!dateValue) {
            return "No date";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "No date";
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


    function formatRelativeDate(dateValue) {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const now = new Date();

        const diff =
            now.getTime() -
            date.getTime();

        const minutes =
            Math.floor(diff / 60000);

        if (minutes < 1) {
            return "just now";
        }

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours =
            Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days =
            Math.floor(hours / 24);

        if (days < 7) {
            return `${days}d ago`;
        }

        return formatDate(dateValue);
    }


    function statusLabel(status) {

        const labels = {

            planning: "Planning",
            active: "Active",
            completed: "Completed",
            archived: "Archived",

            todo: "To do",
            in_progress: "In progress",
            in_review: "In review",
            done: "Done"
        };

        return (
            labels[status] ||
            status ||
            ""
        );
    }


    function priorityLabel(priority) {

        const labels = {

            low: "Low",
            medium: "Medium",
            high: "High",
            urgent: "Urgent"
        };

        return (
            labels[priority] ||
            priority ||
            ""
        );
    }


    function statusBadge(status) {

        let type = "neutral";

        if (
            status === "active" ||
            status === "done" ||
            status === "completed"
        ) {
            type = "success";
        }

        if (
            status === "planning" ||
            status === "in_progress"
        ) {
            type = "info";
        }

        if (status === "in_review") {
            type = "warning";
        }

        if (status === "urgent") {
            type = "danger";
        }

        return `
            <span class="badge badge-${type}">
                ${escapeHtml(
                    statusLabel(status)
                )}
            </span>
        `;
    }


    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        message,
        type = "default"
    ) {

        let container =
            document.querySelector(
                ".toast-container"
            );

        if (!container) {

            container =
                document.createElement(
                    "div"
                );

            container.className =
                "toast-container";

            document.body.appendChild(
                container
            );
        }

        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            `toast ${type}`;

        toast.textContent =
            message;

        container.appendChild(
            toast
        );

        setTimeout(() => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(8px)";

            setTimeout(() => {

                toast.remove();

            }, 180);

        }, 3000);
    }


    // =====================================================
    // AVATAR
    // =====================================================

    function avatarHtml(
        user,
        size = ""
    ) {

        const name =
            user?.full_name ||
            user?.name ||
            user?.username ||
            "FlowPilot";

        const color =
            user?.avatar_color ||
            "#111111";

        return `
            <div
                class="avatar ${escapeHtml(size)}"
                style="background:${escapeHtml(color)}"
                title="${escapeHtml(name)}"
            >
                ${escapeHtml(
                    initials(name)
                )}
            </div>
        `;
    }


    // =====================================================
    // RENDER SHELL
    // =====================================================

    function renderShell(
        options = {}
    ) {

        const active =
            typeof options === "string"
                ? options
                : (
                    options.active ||
                    "dashboard"
                );

        const appShell =
            document.querySelector(
                ".app-shell"
            );

        if (!appShell) {
            return;
        }


        // -------------------------------------------------
        // REMOVE OLD SIDEBARS
        // -------------------------------------------------

        appShell
            .querySelectorAll(
                ".sidebar"
            )
            .forEach(sidebar => {
                sidebar.remove();
            });


        // -------------------------------------------------
        // ALWAYS USE NORMAL LAYOUT
        // -------------------------------------------------

        appShell.classList.remove(
            "project-icon-shell"
        );


        // -------------------------------------------------
        // CURRENT USER
        // -------------------------------------------------

        const user =
            window.FlowPilotAPI
                ?.getStoredUser?.() ||
            {};


        // -------------------------------------------------
        // SIDEBAR
        // -------------------------------------------------

        const sidebar =
            document.createElement(
                "aside"
            );

        sidebar.className =
            "sidebar";


        // =================================================
        // PROJECT WORKSPACE
        // =================================================

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        const isProjectWorkspace =
            currentPage ===
            "project.html";


        if (isProjectWorkspace) {

            sidebar.innerHTML = `

                <a
                    href="/dashboard.html"
                    class="sidebar-logo"
                >

                    <div class="logo-mark">
                        F
                    </div>

                    <div class="logo-text">
                        FlowPilot
                    </div>

                </a>


                <div class="sidebar-section">

                    <div class="sidebar-label">
                        Workspace
                    </div>


                    <nav
                        class="sidebar-nav"
                        aria-label="Project navigation"
                    >

                        <a
                            href="/dashboard.html"
                            class="nav-item"
                        >

                            <span class="nav-icon">
                                ⌂
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </a>


                        <a
                            href="/projects.html"
                            class="nav-item active"
                        >

                            <span class="nav-icon">
                                □
                            </span>

                            <span>
                                Projects
                            </span>

                        </a>


                        <a
                            href="/my-tasks.html"
                            class="nav-item"
                        >

                            <span class="nav-icon">
                                ✓
                            </span>

                            <span>
                                My Tasks
                            </span>

                        </a>

                    </nav>

                </div>


                <div class="sidebar-bottom">

                    <div class="sidebar-user">

                        ${avatarHtml(
                            user,
                            "avatar-sm"
                        )}


                        <div class="sidebar-user-info">

                            <strong>
                                ${escapeHtml(
                                    user.full_name ||
                                    user.username ||
                                    "User"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    user.email ||
                                    ""
                                )}
                            </span>

                        </div>


                        <button
                            class="sidebar-logout"
                            id="logoutButton"
                            type="button"
                            title="Sign out"
                        >
                            ↗
                        </button>

                    </div>

                </div>
            `;

        }


        // =================================================
        // NORMAL PAGES
        // =================================================

        else {

            sidebar.innerHTML = `

                <a
                    href="/dashboard.html"
                    class="sidebar-logo"
                >

                    <div class="logo-mark">
                        F
                    </div>

                    <div class="logo-text">
                        FlowPilot
                    </div>

                </a>


                <div class="sidebar-section">

                    <div class="sidebar-label">
                        Workspace
                    </div>


                    <nav class="sidebar-nav">


                        <!-- DASHBOARD -->

                        <a
                            href="/dashboard.html"
                            class="nav-item ${
                                active ===
                                "dashboard"
                                    ? "active"
                                    : ""
                            }"
                        >

                            <span class="nav-icon">
                                ⌂
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </a>


                        <!-- PROJECTS -->

                        <a
                            href="/projects.html"
                            class="nav-item ${
                                active ===
                                "projects"
                                    ? "active"
                                    : ""
                            }"
                        >

                            <span class="nav-icon">
                                □
                            </span>

                            <span>
                                Projects
                            </span>

                        </a>


                        <!-- MY TASKS -->

                        <a
                            href="/my-tasks.html"
                            class="nav-item ${
                                active ===
                                "tasks"
                                    ? "active"
                                    : ""
                            }"
                        >

                            <span class="nav-icon">
                                ✓
                            </span>

                            <span>
                                My Tasks
                            </span>

                        </a>

                    </nav>

                </div>


                <div class="sidebar-section">

                    <div class="sidebar-label">
                        Personal
                    </div>


                    <nav class="sidebar-nav">


                        <!-- NOTIFICATIONS -->

                        <a
                            href="/notifications.html"
                            class="nav-item ${
                                active ===
                                "notifications"
                                    ? "active"
                                    : ""
                            }"
                        >

                            <span class="nav-icon">
                                ○
                            </span>

                            <span>
                                Notifications
                            </span>

                        </a>


                        <!-- PROFILE -->

                        <a
                            href="/profile.html"
                            class="nav-item ${
                                active ===
                                "profile"
                                    ? "active"
                                    : ""
                            }"
                        >

                            <span class="nav-icon">
                                ◯
                            </span>

                            <span>
                                Profile
                            </span>

                        </a>

                    </nav>

                </div>


                <div class="sidebar-bottom">

                    <div class="sidebar-user">

                        ${avatarHtml(
                            user,
                            "avatar-sm"
                        )}


                        <div class="sidebar-user-info">

                            <strong>
                                ${escapeHtml(
                                    user.full_name ||
                                    user.username ||
                                    "User"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    user.email ||
                                    ""
                                )}
                            </span>

                        </div>


                        <button
                            class="sidebar-logout"
                            id="logoutButton"
                            type="button"
                            title="Sign out"
                        >
                            ↗
                        </button>

                    </div>

                </div>
            `;
        }


        // =================================================
        // INSERT SIDEBAR
        // =================================================

        appShell.prepend(
            sidebar
        );


        // =================================================
        // LOGOUT
        // =================================================

        const logoutButton =
            sidebar.querySelector(
                "#logoutButton"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    if (
                        window.FlowPilotAPI &&
                        typeof
                        window.FlowPilotAPI
                            .logout ===
                        "function"
                    ) {

                        window.FlowPilotAPI.logout();

                    } else {

                        console.error(
                            "FlowPilotAPI.logout() is not available."
                        );

                    }

                }
            );
        }
    }


    // =====================================================
    // EXPORT
    // =====================================================

    window.FlowPilotUI = {

        initials,

        formatDate,

        formatRelativeDate,

        statusLabel,

        priorityLabel,

        statusBadge,

        escapeHtml,

        showToast,

        avatarHtml,

        renderShell
    };

})();