(function () {
    "use strict";

    const API =
        window.FlowPilotAPI;

    const UI =
        window.FlowPilotUI;

    // ========================================
    // AUTH
    // ========================================

    if (!API.requireAuth()) {
        return;
    }

    UI.renderShell({
        active: "dashboard"
    });

    // ========================================
    // GREETING
    // ========================================

    function getGreeting() {

        const hour =
            new Date().getHours();

        if (hour < 12) {
            return "Good morning";
        }

        if (hour < 17) {
            return "Good afternoon";
        }

        return "Good evening";
    }

    function renderGreeting() {

        const user =
            API.getStoredUser() || {};

        const heading =
            document.getElementById(
                "welcomeHeading"
            );

        if (!heading) return;

        const firstName =
            (
                user.full_name ||
                user.username ||
                "there"
            )
                .trim()
                .split(/\s+/)[0];

        heading.textContent =
            `${getGreeting()}, ${firstName}.`;
    }

    // ========================================
    // PROJECT DATA
    // ========================================

    let projects = [];

    async function loadProjects() {

        const container =
            document.getElementById(
                "projectList"
            );

        try {

            const data =
                await API.apiRequest(
                    "/projects"
                );

            projects =
                data.projects || [];

            renderProjects();

            calculateStats();

        } catch (error) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h3>
                        Couldn't load projects
                    </h3>

                    <p>
                        ${UI.escapeHtml(
                            error.message
                        )}
                    </p>

                </div>
            `;
        }
    }

    // ========================================
    // PROJECTS
    // ========================================

    function renderProjects() {

        const container =
            document.getElementById(
                "projectList"
            );

        if (!projects.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        +
                    </div>

                    <h3>
                        No projects yet
                    </h3>

                    <p>
                        Create your first project and
                        start turning plans into progress.
                    </p>

                    <a
                        href="/projects.html#create"
                        class="btn btn-primary"
                        style="margin-top:16px;"
                    >
                        Create project
                    </a>

                </div>
            `;

            return;
        }

        const visibleProjects =
            projects.slice(0, 6);

        container.innerHTML =
            visibleProjects
                .map(project => {

                    const total =
                        Number(
                            project.task_count || 0
                        );

                    const completed =
                        Number(
                            project.completed_task_count || 0
                        );

                    const progress =
                        total > 0
                            ? Math.round(
                                (
                                    completed /
                                    total
                                ) * 100
                            )
                            : 0;

                    return `
                        <a
                            href="/project.html?id=${project.id}"
                            class="project-row"
                        >

                            <div class="project-info">

                                <div
                                    class="project-color"
                                    style="background:${
                                        UI.escapeHtml(
                                            project.color ||
                                            "#111111"
                                        )
                                    }"
                                ></div>

                                <div
                                    style="min-width:0;"
                                >

                                    <div class="project-name">
                                        ${UI.escapeHtml(
                                            project.name
                                        )}
                                    </div>

                                    <div class="project-description">
                                        ${UI.escapeHtml(
                                            project.description ||
                                            "No description"
                                        )}
                                    </div>

                                </div>

                            </div>

                            <div class="project-progress">

                                <div class="progress-track">

                                    <div
                                        class="progress-fill"
                                        style="width:${progress}%"
                                    ></div>

                                </div>

                                <div class="progress-label">
                                    ${progress}% · ${completed}/${total} tasks
                                </div>

                            </div>

                            <div class="project-status">
                                ${UI.statusBadge(
                                    project.status
                                )}
                            </div>

                        </a>
                    `;

                })
                .join("");
    }

    // ========================================
    // STATS
    // ========================================

    function calculateStats() {

        const projectCount =
            projects.length;

        let totalTasks = 0;
        let completedTasks = 0;

        projects.forEach(project => {

            totalTasks += Number(
                project.task_count || 0
            );

            completedTasks += Number(
                project.completed_task_count || 0
            );

        });

        const openTasks =
            Math.max(
                totalTasks -
                completedTasks,
                0
            );

        const completion =
            totalTasks > 0
                ? Math.round(
                    (
                        completedTasks /
                        totalTasks
                    ) * 100
                )
                : 0;

        document.getElementById(
            "projectCount"
        ).textContent =
            projectCount;

        document.getElementById(
            "openTaskCount"
        ).textContent =
            openTasks;

        document.getElementById(
            "completedTaskCount"
        ).textContent =
            completedTasks;

        document.getElementById(
            "completionRate"
        ).textContent =
            `${completion}%`;
    }

    // ========================================
    // ACTIVITY
    // ========================================

    async function loadActivity() {

        const container =
            document.getElementById(
                "activityList"
            );

        /*
         * Activity will be powered by the
         * project activity endpoint once
         * the dashboard analytics API is added.
         *
         * For now, derive useful activity
         * from the projects already available.
         */

        if (!projects.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        ·
                    </div>

                    <h3>
                        No activity yet
                    </h3>

                    <p>
                        Project activity will appear here
                        as your workspace starts moving.
                    </p>
                </div>
            `;

            return;
        }

        const activity =
            projects
                .slice(0, 5)
                .map(project => ({
                    project,
                    message:
                        `Project "${project.name}" is ${UI.statusLabel(
                            project.status
                        ).toLowerCase()}.`
                }));

        container.innerHTML =
            activity
                .map(item => {

                    const project =
                        item.project;

                    return `
                        <a
                            href="/project.html?id=${project.id}"
                            class="activity-item"
                        >

                            ${UI.avatarHtml(
                                {
                                    full_name:
                                        project.name,
                                    avatar_color:
                                        project.color ||
                                        "#111111"
                                },
                                "avatar-sm"
                            )}

                            <div class="activity-content">

                                <div class="activity-message">
                                    ${UI.escapeHtml(
                                        item.message
                                    )}
                                </div>

                                <div class="activity-time">
                                    Updated ${UI.formatRelativeDate(
                                        project.updated_at
                                    )}
                                </div>

                            </div>

                        </a>
                    `;

                })
                .join("");
    }

    // ========================================
    // START
    // ========================================

    async function init() {

        renderGreeting();

        await loadProjects();

        await loadActivity();
    }

    init();

})();