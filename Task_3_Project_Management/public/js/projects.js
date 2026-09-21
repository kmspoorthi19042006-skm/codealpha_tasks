document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    if (
        !window.FlowPilotAPI ||
        !FlowPilotAPI.requireAuth()
    ) {
        return;
    }

    FlowPilotUI.renderShell({
        active: "projects"
    });

    const projectsGrid =
        document.getElementById("projectsGrid");

    const projectCountLabel =
        document.getElementById("projectCountLabel");

    const modal =
        document.getElementById("createProjectModal");

    const openCreateProject =
        document.getElementById("openCreateProject");

    const closeCreateProject =
        document.getElementById("closeCreateProject");

    const cancelCreateProject =
        document.getElementById("cancelCreateProject");

    const createProjectForm =
        document.getElementById("createProjectForm");

    const createProjectButton =
        document.getElementById("createProjectButton");

    const projectFormError =
        document.getElementById("projectFormError");

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    let allProjects = [];
    let currentFilter = "all";


    /* =========================================
       MODAL
    ========================================= */

    function openModal() {

        if (!modal) return;

        modal.classList.add("active");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        const firstInput =
            modal.querySelector(
                "input:not([type='color']), textarea, select"
            );

        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
            }, 100);
        }
    }


    function closeModal() {

        if (!modal) return;

        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        if (createProjectForm) {
            createProjectForm.reset();
        }

        if (projectFormError) {
            projectFormError.textContent = "";
            projectFormError.style.display = "none";
        }

        const colorInput =
            document.getElementById(
                "projectColor"
            );

        if (colorInput) {
            colorInput.value = "#111111";
        }
    }


    if (openCreateProject) {
        openCreateProject.addEventListener(
            "click",
            openModal
        );
    }

    if (closeCreateProject) {
        closeCreateProject.addEventListener(
            "click",
            closeModal
        );
    }

    if (cancelCreateProject) {
        cancelCreateProject.addEventListener(
            "click",
            closeModal
        );
    }

    if (modal) {
        modal.addEventListener(
            "click",
            event => {
                if (event.target === modal) {
                    closeModal();
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape" &&
                modal &&
                modal.classList.contains("active")
            ) {
                closeModal();
            }
        }
    );


    /* =========================================
       FILTERS
    ========================================= */

    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(item => {
                    item.classList.remove(
                        "active"
                    );
                });

                button.classList.add("active");

                currentFilter =
                    button.dataset.filter ||
                    "all";

                renderProjects();
            }
        );

    });


    /* =========================================
       LOAD PROJECTS
    ========================================= */

    async function loadProjects() {

        if (!projectsGrid) return;

        projectsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>Loading projects...</span>
            </div>
        `;

        try {

            const response =
                await FlowPilotAPI.apiRequest(
                    "/projects"
                );

            allProjects =
                Array.isArray(response.projects)
                    ? response.projects
                    : [];

            renderProjects();

        } catch (error) {

            console.error(
                "Projects loading error:",
                error
            );

            projectsGrid.innerHTML = `
                <div class="projects-empty">

                    <div class="projects-empty-icon">
                        !
                    </div>

                    <h3>
                        Unable to load projects
                    </h3>

                    <p>
                        ${FlowPilotUI.escapeHtml(
                            error.message ||
                            "Unable to load projects."
                        )}
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="retryProjects"
                    >
                        Try again
                    </button>

                </div>
            `;

            const retry =
                document.getElementById(
                    "retryProjects"
                );

            if (retry) {
                retry.addEventListener(
                    "click",
                    loadProjects
                );
            }
        }
    }


    /* =========================================
       RENDER
    ========================================= */

    function renderProjects() {

        if (!projectsGrid) return;

        let projects = [...allProjects];

        if (currentFilter !== "all") {

            projects =
                projects.filter(
                    project =>
                        project.status ===
                        currentFilter
                );
        }

        updateProjectCount(
            projects.length
        );

        if (!projects.length) {

            renderEmptyState();

            return;
        }

        projectsGrid.innerHTML =
            projects
                .map(projectCard)
                .join("");

        attachProjectEvents();
    }


    function updateProjectCount(count) {

        if (!projectCountLabel) return;

        projectCountLabel.textContent =
            `${count} project${
                count === 1 ? "" : "s"
            }`;
    }


    /* =========================================
       EMPTY STATE
    ========================================= */

    function renderEmptyState() {

        const message =
            currentFilter === "all"
                ? "Create your first project and start organizing your work."
                : `No ${FlowPilotUI.statusLabel(
                    currentFilter
                ).toLowerCase()} projects found.`;

        projectsGrid.innerHTML = `
            <div class="projects-empty">

                <div class="projects-empty-icon">
                    +
                </div>

                <h3>
                    ${
                        currentFilter === "all"
                            ? "No projects yet"
                            : "Nothing here yet"
                    }
                </h3>

                <p>
                    ${FlowPilotUI.escapeHtml(
                        message
                    )}
                </p>

                ${
                    currentFilter === "all"
                        ? `
                            <button
                                type="button"
                                class="btn btn-primary"
                                id="emptyCreateProject"
                            >
                                Create project
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        const emptyButton =
            document.getElementById(
                "emptyCreateProject"
            );

        if (emptyButton) {
            emptyButton.addEventListener(
                "click",
                openModal
            );
        }
    }


    /* =========================================
       PROJECT CARD
    ========================================= */

    function projectCard(project) {

        const totalTasks =
            Number(
                project.task_count || 0
            );

        const completedTasks =
            Number(
                project.completed_task_count || 0
            );

        const progress =
            totalTasks > 0
                ? Math.round(
                    completedTasks /
                    totalTasks *
                    100
                )
                : 0;

        const members =
            Number(
                project.member_count || 1
            );

        const status =
            project.status || "planning";

        const description =
            project.description ||
            "No project description added yet.";

        const color =
            project.color ||
            "#111111";

        return `
            <article
                class="project-card"
                data-project-id="${project.id}"
            >

                <div
                    class="project-accent"
                    style="background:${FlowPilotUI.escapeHtml(color)}"
                ></div>

                <div class="project-card-body">

                    <div class="project-card-top">

                        <div class="project-card-title">

                            <h3>
                                ${FlowPilotUI.escapeHtml(
                                    project.name
                                )}
                            </h3>

                            ${FlowPilotUI.statusBadge(
                                status
                            )}

                        </div>

                        <button
                            type="button"
                            class="project-delete"
                            data-id="${project.id}"
                            title="Delete project"
                            aria-label="Delete project"
                        >
                            ×
                        </button>

                    </div>

                    <p class="project-card-description">
                        ${FlowPilotUI.escapeHtml(
                            description
                        )}
                    </p>

                    <div class="project-card-meta">

                        <div class="project-metric">
                            <div class="project-metric-value">
                                ${totalTasks}
                            </div>
                            <div class="project-metric-label">
                                ${totalTasks === 1 ? "Task" : "Tasks"}
                            </div>
                        </div>

                        <div class="project-metric">
                            <div class="project-metric-value">
                                ${members}
                            </div>
                            <div class="project-metric-label">
                                ${members === 1 ? "Member" : "Members"}
                            </div>
                        </div>

                        <div class="project-metric">
                            <div class="project-metric-value">
                                ${completedTasks}
                            </div>
                            <div class="project-metric-label">
                                Completed
                            </div>
                        </div>

                    </div>

                </div>

                <div class="project-card-footer">

                    <div class="project-progress">

                        <div class="project-progress-track">

                            <div
                                class="project-progress-fill"
                                style="
                                    width:${progress}%;
                                    background:${FlowPilotUI.escapeHtml(color)};
                                "
                            ></div>

                        </div>

                        <div class="project-progress-label">
                            ${progress}% complete
                        </div>

                    </div>

                    <button
                        type="button"
                        class="project-open"
                        data-id="${project.id}"
                    >
                        Open project →
                    </button>

                </div>

            </article>
        `;
    }


    /* =========================================
       PROJECT EVENTS
    ========================================= */

    function attachProjectEvents() {

        document
            .querySelectorAll(".project-open")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        if (!id) return;

                        window.location.href =
                            `/project.html?id=${id}`;
                    }
                );
            });


        document
            .querySelectorAll(".project-delete")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.stopPropagation();

                        const id =
                            button.dataset.id;

                        if (!id) return;

                        const confirmed =
                            window.confirm(
                                "Delete this project? This will also remove its tasks, comments and activity."
                            );

                        if (!confirmed) return;

                        button.disabled = true;
                        button.textContent = "…";

                        try {

                            await FlowPilotAPI.apiRequest(
                                `/projects/${id}`,
                                {
                                    method: "DELETE"
                                }
                            );

                            FlowPilotUI.showToast(
                                "Project deleted successfully.",
                                "success"
                            );

                            await loadProjects();

                        } catch (error) {

                            FlowPilotUI.showToast(
                                error.message ||
                                "Unable to delete project.",
                                "error"
                            );

                            button.disabled = false;
                            button.textContent = "×";
                        }
                    }
                );
            });
    }


    /* =========================================
       CREATE PROJECT
    ========================================= */

    if (createProjectForm) {

        createProjectForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                if (projectFormError) {
                    projectFormError.textContent = "";
                    projectFormError.style.display = "none";
                }

                const name =
                    document
                        .getElementById("projectName")
                        ?.value
                        .trim() || "";

                const description =
                    document
                        .getElementById("projectDescription")
                        ?.value
                        .trim() || "";

                const status =
                    document
                        .getElementById("projectStatus")
                        ?.value ||
                    "planning";

                const color =
                    document
                        .getElementById("projectColor")
                        ?.value ||
                    "#111111";

                const startDate =
                    document
                        .getElementById("startDate")
                        ?.value ||
                    "";

                const deadline =
                    document
                        .getElementById("deadline")
                        ?.value ||
                    "";

                if (!name) {
                    showFormError(
                        "Please enter a project name."
                    );
                    return;
                }

                if (
                    startDate &&
                    deadline &&
                    deadline < startDate
                ) {
                    showFormError(
                        "Deadline cannot be earlier than the start date."
                    );
                    return;
                }

                createProjectButton.disabled = true;
                createProjectButton.textContent =
                    "Creating...";

                try {

                    const response =
                        await FlowPilotAPI.apiRequest(
                            "/projects",
                            {
                                method: "POST",
                                body: {
                                    name,
                                    description,
                                    status,
                                    color,
                                    start_date:
                                        startDate || null,
                                    deadline:
                                        deadline || null
                                }
                            }
                        );

                    if (!response.success) {
                        throw new Error(
                            response.message ||
                            "Unable to create project."
                        );
                    }

                    closeModal();

                    FlowPilotUI.showToast(
                        "Project created successfully.",
                        "success"
                    );

                    await loadProjects();

                } catch (error) {

                    showFormError(
                        error.message ||
                        "Unable to create project."
                    );

                } finally {

                    createProjectButton.disabled = false;

                    createProjectButton.textContent =
                        "Create project";
                }
            }
        );
    }


    function showFormError(message) {

        if (!projectFormError) {
            FlowPilotUI.showToast(
                message,
                "error"
            );
            return;
        }

        projectFormError.textContent =
            message;

        projectFormError.style.display =
            "block";
    }


    /* =========================================
       BROWSER BACK/FORWARD FIX
    ========================================= */

    window.addEventListener(
        "pageshow",
        event => {

            if (event.persisted) {

                /*
                 * Browser restored Projects page
                 * from back/forward cache.
                 *
                 * Rebuild the shell and reload
                 * the project list.
                 */

                FlowPilotUI.renderShell({
                    active: "projects"
                });

                loadProjects();
            }
        }
    );


    /* =========================================
       INITIAL LOAD
    ========================================= */

    await loadProjects();

});