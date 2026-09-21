document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // AUTH
    // =====================================================

    if (!window.FlowPilotAPI) {
        console.error(
            "FlowPilotAPI is not loaded."
        );

        return;
    }

    if (!FlowPilotAPI.requireAuth()) {
        return;
    }


    // =====================================================
    // FLOWPILOT NORMAL SIDEBAR
    // =====================================================

    /*
     * Use the SAME UI shell used by the other normal
     * FlowPilot pages.
     *
     * Do NOT use the project icon-only shell here.
     */

    try {

        if (
            window.UI &&
            typeof UI.renderShell === "function"
        ) {

            UI.renderShell({
                active: "notifications"
            });

        } else if (
            window.FlowPilotUI &&
            typeof FlowPilotUI.renderShell === "function"
        ) {

            FlowPilotUI.renderShell({
                active: "notifications"
            });

        }

    } catch (error) {

        console.error(
            "FlowPilot sidebar initialization failed:",
            error
        );
    }


    // =====================================================
    // ELEMENTS
    // =====================================================

    const notificationList =
        document.getElementById(
            "notificationList"
        );

    const loadingState =
        document.getElementById(
            "loadingState"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const markAllReadButton =
        document.getElementById(
            "markAllRead"
        );


    // =====================================================
    // STATE
    // =====================================================

    let notifications = [];


    // =====================================================
    // LOAD
    // =====================================================

    async function loadNotifications() {

        showLoading(true);

        try {

            const response =
                await FlowPilotAPI.apiRequest(
                    "/notifications"
                );


            notifications =
                response.notifications ||
                response.data?.notifications ||
                response.data ||
                [];


            if (!Array.isArray(notifications)) {
                notifications = [];
            }


            renderNotifications();

        } catch (error) {

            console.error(
                "Failed to load notifications:",
                error
            );

            showError(
                error.message ||
                "Unable to load notifications."
            );

        } finally {

            showLoading(false);
        }
    }


    // =====================================================
    // RENDER
    // =====================================================

    function renderNotifications() {

        if (!notificationList) {
            return;
        }


        notificationList.innerHTML = "";


        if (notifications.length === 0) {

            if (emptyState) {
                emptyState.style.display =
                    "block";
            }

            return;
        }


        if (emptyState) {
            emptyState.style.display =
                "none";
        }


        notifications.forEach(
            notification => {

                const element =
                    createNotificationElement(
                        notification
                    );

                notificationList.appendChild(
                    element
                );
            }
        );
    }


    // =====================================================
    // CREATE CARD
    // =====================================================

    function createNotificationElement(
        notification
    ) {

        const item =
            document.createElement(
                "article"
            );


        item.className =
            "notification-item";


        if (!notification.is_read) {
            item.classList.add(
                "unread"
            );
        }


        const title =
            escapeHTML(
                notification.title ||
                "Notification"
            );


        const body =
            escapeHTML(
                notification.body ||
                ""
            );


        const time =
            formatDate(
                notification.created_at
            );


        const icon =
            getNotificationIcon(
                notification.type
            );


        item.innerHTML = `

            <div class="notification-icon">
                ${icon}
            </div>


            <div class="notification-content">

                <div class="notification-title-row">

                    <h3>
                        ${title}
                    </h3>

                    ${
                        !notification.is_read
                            ? `
                                <span
                                    class="unread-dot">
                                </span>
                              `
                            : ""
                    }

                </div>


                ${
                    body
                        ? `
                            <p>
                                ${body}
                            </p>
                          `
                        : ""
                }


                <span class="notification-time">
                    ${time}
                </span>

            </div>


            ${
                !notification.is_read
                    ? `
                        <button
                            type="button"
                            class="notification-read-btn"
                            data-id="${notification.id}"
                            title="Mark as read">

                            ✓

                        </button>
                      `
                    : ""
            }

        `;


        // =================================================
        // READ BUTTON
        // =================================================

        const readButton =
            item.querySelector(
                ".notification-read-btn"
            );


        if (readButton) {

            readButton.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            event.currentTarget
                                .dataset.id
                        );

                    await markAsRead(id);
                }
            );
        }


        // =================================================
        // CARD CLICK
        // =================================================

        item.addEventListener(
            "click",
            async () => {

                if (!notification.is_read) {

                    await markAsRead(
                        notification.id
                    );
                }


                if (
                    notification.project_id
                ) {

                    window.location.href =
                        `/project.html?id=${notification.project_id}`;
                }
            }
        );


        return item;
    }


    // =====================================================
    // MARK ONE READ
    // =====================================================

    async function markAsRead(id) {

        try {

            await FlowPilotAPI.apiRequest(
                `/notifications/${id}/read`,
                {
                    method: "PUT"
                }
            );


            const notification =
                notifications.find(
                    item =>
                        Number(item.id) ===
                        Number(id)
                );


            if (notification) {
                notification.is_read = true;
            }


            renderNotifications();

        } catch (error) {

            console.error(
                "Mark notification read failed:",
                error
            );


            showToast(
                error.message ||
                "Unable to mark notification as read.",
                "error"
            );
        }
    }


    // =====================================================
    // MARK ALL READ
    // =====================================================

    async function markAllAsRead() {

        try {

            await FlowPilotAPI.apiRequest(
                "/notifications/read-all",
                {
                    method: "PUT"
                }
            );


            notifications.forEach(
                notification => {
                    notification.is_read = true;
                }
            );


            renderNotifications();


            showToast(
                "All notifications marked as read.",
                "success"
            );

        } catch (error) {

            console.error(
                "Mark all notifications failed:",
                error
            );


            showToast(
                error.message ||
                "Unable to update notifications.",
                "error"
            );
        }
    }


    // =====================================================
    // ICON
    // =====================================================

    function getNotificationIcon(type) {

        const icons = {

            task_assigned: "✓",

            task_created: "+",

            task_updated: "↻",

            task_completed: "✓",

            comment: "💬",

            comment_added: "💬",

            project: "▣",

            project_created: "＋",

            member_added: "＋",

            member_removed: "−",

            deadline: "◷",

            system: "!"

        };


        return (
            icons[type] ||
            "🔔"
        );
    }


    // =====================================================
    // DATE
    // =====================================================

    function formatDate(value) {

        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }


        const now =
            new Date();


        const difference =
            now.getTime() -
            date.getTime();


        const seconds =
            Math.floor(
                difference / 1000
            );


        const minutes =
            Math.floor(
                seconds / 60
            );


        const hours =
            Math.floor(
                minutes / 60
            );


        const days =
            Math.floor(
                hours / 24
            );


        if (seconds < 60) {
            return "Just now";
        }


        if (minutes < 60) {

            return `${minutes} ${
                minutes === 1
                    ? "minute"
                    : "minutes"
            } ago`;
        }


        if (hours < 24) {

            return `${hours} ${
                hours === 1
                    ? "hour"
                    : "hours"
            } ago`;
        }


        if (days < 7) {

            return `${days} ${
                days === 1
                    ? "day"
                    : "days"
            } ago`;
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    // =====================================================
    // LOADING
    // =====================================================

    function showLoading(show) {

        if (!loadingState) {
            return;
        }


        loadingState.style.display =
            show
                ? "block"
                : "none";
    }


    // =====================================================
    // ERROR
    // =====================================================

    function showError(message) {

        if (!notificationList) {
            return;
        }


        if (emptyState) {
            emptyState.style.display =
                "none";
        }


        notificationList.innerHTML = `

            <div class="notification-error">

                <div class="notification-error-icon">
                    !
                </div>


                <h3>
                    Unable to load notifications
                </h3>


                <p>
                    ${escapeHTML(message)}
                </p>


                <button
                    type="button"
                    id="retryNotifications"
                    class="btn btn-primary">

                    Try again

                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryNotifications"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadNotifications
            );
        }
    }


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        message,
        type = "success"
    ) {

        if (
            window.UI &&
            typeof UI.showToast ===
                "function"
        ) {

            UI.showToast(
                message,
                type
            );

            return;
        }


        let toast =
            document.getElementById(
                "notificationToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );


            toast.id =
                "notificationToast";


            toast.className =
                "notification-toast";


            document.body.appendChild(
                toast
            );
        }


        toast.textContent =
            message;


        toast.className =
            `notification-toast ${type} show`;


        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    // =====================================================
    // MARK ALL BUTTON
    // =====================================================

    if (markAllReadButton) {

        markAllReadButton.addEventListener(
            "click",
            markAllAsRead
        );
    }


    // =====================================================
    // START
    // =====================================================

    await loadNotifications();

});