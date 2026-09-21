document.addEventListener("DOMContentLoaded", async () => {

    if (!window.FlowPilotAPI || !FlowPilotAPI.isLoggedIn()) {
        window.location.replace("/login.html");
        return;
    }

    // =========================================================
    // LOGOUT - DIRECT HANDLER
    // =========================================================

    document.addEventListener(
        "click",
        function (event) {

            const logoutButton =
                event.target.closest("#logoutButton");

            if (!logoutButton) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            localStorage.removeItem("flowpilot_token");
            localStorage.removeItem("flowpilot_user");

            sessionStorage.removeItem("flowpilot_token");
            sessionStorage.removeItem("flowpilot_user");

            window.location.replace("/login.html");
        },
        true
    );

    // =========================================================
    // STATE
    // =========================================================

    const state = {
        user: null,
        projectCount: 0,
        assignedTaskCount: 0
    };

    // =========================================================
    // SIDEBAR
    // =========================================================

    if (window.FlowPilotUI) {
        FlowPilotUI.renderShell({
            active: "profile"
        });
    }

    // =========================================================
    // ELEMENTS
    // =========================================================

    const profileName =
        document.getElementById("profileName");

    const profileUsername =
        document.getElementById("profileUsername");

    const profileEmail =
        document.getElementById("profileEmail");

    const profileBio =
        document.getElementById("profileBio");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const fullNameInput =
        document.getElementById("fullName");

    const usernameInput =
        document.getElementById("username");

    const bioInput =
        document.getElementById("bio");

    const profileForm =
        document.getElementById("profileForm");

    const cancelEdit =
        document.getElementById("cancelEdit");

    const pictureInput =
        document.getElementById("pictureInput");

    const projectCountElement =
        document.getElementById("projectCount");

    const taskCountElement =
        document.getElementById("taskCount");

    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // =========================================================
    // AVATAR
    // =========================================================

    function renderAvatar(user) {

        if (!profileAvatar || !user) {
            return;
        }

        if (user.profile_picture) {

            profileAvatar.innerHTML = `
                <img
                    src="${user.profile_picture}"
                    alt="${escapeHtml(
                        user.full_name || "Profile"
                    )}"
                >
            `;

            return;
        }

        const initials =
            (user.full_name ||
                user.username ||
                "U")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(word =>
                    word
                        .charAt(0)
                        .toUpperCase()
                )
                .join("");

        profileAvatar.textContent = initials;
    }

    // =========================================================
    // STATS
    // =========================================================

    function renderStats() {

        if (projectCountElement) {

            projectCountElement.textContent =
                String(state.projectCount);
        }

        if (taskCountElement) {

            taskCountElement.textContent =
                String(state.assignedTaskCount);
        }
    }

    // =========================================================
    // PROFILE DISPLAY
    // =========================================================

    function renderProfile(user) {

        if (!user) {
            return;
        }

        state.user = {
            ...state.user,
            ...user
        };

        if (profileName) {

            profileName.textContent =
                state.user.full_name || "—";
        }

        if (profileUsername) {

            profileUsername.textContent =
                state.user.username
                    ? `@${state.user.username}`
                    : "—";
        }

        if (profileEmail) {

            profileEmail.textContent =
                state.user.email || "—";
        }

        if (profileBio) {

            profileBio.textContent =
                state.user.bio ||
                "No bio added yet.";
        }

        if (fullNameInput) {

            fullNameInput.value =
                state.user.full_name || "";
        }

        if (usernameInput) {

            usernameInput.value =
                state.user.username || "";
        }

        if (bioInput) {

            bioInput.value =
                state.user.bio || "";
        }

        renderAvatar(state.user);

        renderStats();
    }

    // =========================================================
    // LOAD USER STATISTICS
    // =========================================================

    async function loadUserStatistics() {

        if (!state.user || !state.user.id) {
            return;
        }

        try {

            const response =
                await FlowPilotAPI.apiRequest(
                    `/users/${state.user.id}`
                );

            if (
                response &&
                response.success &&
                response.user
            ) {

                state.projectCount =
                    Number(
                        response.user.project_count
                    ) || 0;

                state.assignedTaskCount =
                    Number(
                        response.user.assigned_task_count
                    ) || 0;
            }

            renderStats();

        } catch (error) {

            console.error(
                "Load statistics error:",
                error
            );

            renderStats();
        }
    }

    // =========================================================
    // LOAD PROFILE
    // =========================================================

    async function loadProfile() {

        try {

            const response =
                await FlowPilotAPI.apiRequest(
                    "/auth/me"
                );

            if (
                !response ||
                !response.user
            ) {

                throw new Error(
                    "Unable to load profile."
                );
            }

            state.user =
                response.user;

            FlowPilotAPI.setStoredUser(
                response.user
            );

            renderProfile(
                response.user
            );

            await loadUserStatistics();

        } catch (error) {

            console.error(
                "Load profile error:",
                error
            );
        }
    }

    // =========================================================
    // SAVE PROFILE
    // =========================================================

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                if (!state.user) {
                    return;
                }

                const fullName =
                    fullNameInput?.value.trim() || "";

                const username =
                    usernameInput?.value.trim() || "";

                const bio =
                    bioInput?.value.trim() || "";

                if (!fullName) {

                    alert(
                        "Full name is required."
                    );

                    return;
                }

                if (!username) {

                    alert(
                        "Username is required."
                    );

                    return;
                }

                try {

                    const response =
                        await FlowPilotAPI.apiRequest(
                            "/auth/profile",
                            {
                                method: "PUT",

                                body: {
                                    full_name:
                                        fullName,

                                    username:
                                        username,

                                    bio:
                                        bio
                                }
                            }
                        );

                    if (
                        response &&
                        response.success &&
                        response.user
                    ) {

                        state.user = {
                            ...state.user,
                            ...response.user
                        };

                        FlowPilotAPI.setStoredUser(
                            state.user
                        );

                        renderProfile(
                            state.user
                        );

                        await loadUserStatistics();

                        alert(
                            "Profile updated successfully."
                        );

                    } else {

                        throw new Error(
                            response?.message ||
                            "Profile update failed."
                        );
                    }

                } catch (error) {

                    console.error(
                        "Save profile error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Failed to update profile."
                    );
                }
            }
        );
    }

    // =========================================================
    // CANCEL EDIT
    // =========================================================

    if (cancelEdit) {

        cancelEdit.addEventListener(
            "click",
            function () {

                if (!state.user) {
                    return;
                }

                renderProfile(
                    state.user
                );
            }
        );
    }

    // =========================================================
    // PROFILE PICTURE
    // =========================================================

    if (pictureInput) {

        pictureInput.addEventListener(
            "change",
            async function () {

                const file =
                    pictureInput.files?.[0];

                if (!file) {
                    return;
                }

                try {

                    const formData =
                        new FormData();

                    formData.append(
                        "profile_picture",
                        file
                    );

                    const token =
                        FlowPilotAPI.getToken();

                    const response =
                        await fetch(
                            "/api/auth/profile/picture",
                            {
                                method: "POST",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                },

                                body: formData
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Profile picture upload failed."
                        );
                    }

                    if (data.user) {

                        state.user = {
                            ...state.user,
                            ...data.user
                        };

                        FlowPilotAPI.setStoredUser(
                            state.user
                        );

                        renderProfile(
                            state.user
                        );
                    }

                } catch (error) {

                    console.error(
                        "Profile picture error:",
                        error
                    );

                    alert(
                        error.message ||
                        "Failed to upload profile picture."
                    );
                }
            }
        );
    }

    // =========================================================
    // START
    // =========================================================

    await loadProfile();
});