document.addEventListener("DOMContentLoaded", async () => {

    if (
        !window.FlowPilotAPI ||
        !FlowPilotAPI.isLoggedIn()
    ) {
        window.location.replace("/login.html");
        return;
    }

    if (window.FlowPilotUI) {
        FlowPilotUI.renderShell({
            active: "tasks"
        });
    }

    const tasksList =
        document.getElementById("tasksList");

    const todoCount =
        document.getElementById("todoCount");

    const progressCount =
        document.getElementById("progressCount");

    const reviewCount =
        document.getElementById("reviewCount");

    const doneCount =
        document.getElementById("doneCount");

    const taskTotal =
        document.getElementById("taskTotal");


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function statusLabel(status) {

        const labels = {
            todo: "To do",
            in_progress: "In progress",
            in_review: "In review",
            done: "Completed"
        };

        return labels[status] || status;
    }


    function priorityLabel(priority) {

        const labels = {
            low: "Low",
            medium: "Medium",
            high: "High",
            urgent: "Urgent"
        };

        return labels[priority] || priority;
    }


    function statusClass(status) {

        const classes = {
            todo: "task-status-todo",
            in_progress: "task-status-progress",
            in_review: "task-status-review",
            done: "task-status-done"
        };

        return classes[status] ||
            "task-status-todo";
    }


    function priorityClass(priority) {

        const classes = {
            low: "task-priority-low",
            medium: "task-priority-medium",
            high: "task-priority-high",
            urgent: "task-priority-urgent"
        };

        return classes[priority] ||
            "task-priority-medium";
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "No deadline";
        }

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "No deadline";
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


    function isOverdue(task) {

        if (
            !task.deadline ||
            task.status === "done"
        ) {
            return false;
        }

        const deadline =
            new Date(task.deadline);

        if (Number.isNaN(deadline.getTime())) {
            return false;
        }

        deadline.setHours(
            23,
            59,
            59,
            999
        );

        return deadline < new Date();
    }


    function renderStats(tasks) {

        const todo =
            tasks.filter(
                task => task.status === "todo"
            ).length;

        const progress =
            tasks.filter(
                task =>
                    task.status === "in_progress"
            ).length;

        const review =
            tasks.filter(
                task =>
                    task.status === "in_review"
            ).length;

        const done =
            tasks.filter(
                task =>
                    task.status === "done"
            ).length;


        todoCount.textContent =
            String(todo);

        progressCount.textContent =
            String(progress);

        reviewCount.textContent =
            String(review);

        doneCount.textContent =
            String(done);

        taskTotal.textContent =
            `${tasks.length} ${
                tasks.length === 1
                    ? "task"
                    : "tasks"
            }`;
    }


    function renderTasks(tasks) {

        if (!tasks.length) {

            tasksList.innerHTML = `
                <div class="empty-tasks">

                    <h3>No tasks assigned</h3>

                    <p>
                        Tasks assigned to you will appear here.
                    </p>

                </div>
            `;

            return;
        }


        tasksList.innerHTML =
            tasks.map(task => {

                const overdue =
                    isOverdue(task);

                return `
                    <article
                        class="task-card"
                        data-task-id="${task.id}"
                    >

                        <div class="task-top">

                            <div>

                                <h3 class="task-title">
                                    ${escapeHtml(
                                        task.title
                                    )}
                                </h3>

                                ${
                                    task.description
                                        ? `
                                            <p class="task-description">
                                                ${escapeHtml(
                                                    task.description
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                            </div>

                        </div>


                        <div class="task-meta">

                            <span
                                class="
                                    task-badge
                                    ${statusClass(
                                        task.status
                                    )}
                                "
                            >
                                ${escapeHtml(
                                    statusLabel(
                                        task.status
                                    )
                                )}
                            </span>


                            <span
                                class="
                                    task-badge
                                    ${priorityClass(
                                        task.priority
                                    )}
                            "
                            >
                                ${escapeHtml(
                                    priorityLabel(
                                        task.priority
                                    )
                                )}
                            </span>

                        </div>


                        ${
                            task.project_name
                                ? `
                                    <div class="task-project">
                                        Project:
                                        <strong>
                                            ${escapeHtml(
                                                task.project_name
                                            )}
                                        </strong>
                                    </div>
                                `
                                : ""
                        }


                        <div
                            class="
                                task-deadline
                                ${
                                    overdue
                                        ? "overdue"
                                        : ""
                                }
                            "
                        >
                            ${
                                overdue
                                    ? "Overdue · "
                                    : "Deadline · "
                            }

                            ${escapeHtml(
                                formatDate(
                                    task.deadline
                                )
                            )}
                        </div>

                    </article>
                `;

            }).join("");
    }


    async function loadTasks() {

        try {

            tasksList.innerHTML = `
                <div class="loading">

                    <div class="spinner"></div>

                    <span>
                        Loading tasks...
                    </span>

                </div>
            `;


            const user =
                FlowPilotAPI.getStoredUser();


            if (!user || !user.id) {

                throw new Error(
                    "User information is unavailable."
                );
            }


            /*
             * The backend already supports
             * assignee_id filtering.
             */

            const response =
                await FlowPilotAPI.apiRequest(
                    `/tasks?assignee_id=${user.id}`
                );


            let tasks = [];

            if (Array.isArray(response)) {

                tasks = response;

            } else if (
                Array.isArray(response.tasks)
            ) {

                tasks = response.tasks;

            } else if (
                Array.isArray(response.data)
            ) {

                tasks = response.data;
            }


            renderStats(tasks);

            renderTasks(tasks);

        } catch (error) {

            console.error(
                "My Tasks error:",
                error
            );

            tasksList.innerHTML = `
                <div class="task-error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to load your tasks."
                    )}
                </div>
            `;
        }
    }


    await loadTasks();
});