document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    if (
        !window.FlowPilotAPI ||
        !FlowPilotAPI.requireAuth()
    ) {
        return;
    }

    const UI = window.FlowPilotUI;
    const { apiRequest } = FlowPilotAPI;

    const state = {
        projectId: null,
        project: null,
        tasks: [],
        members: [],
        editingTaskId: null,
        commentingTaskId: null,
        socket: null,
        selectedMember: null,
        comments: []
    };

    const $ = (selector) =>
        document.querySelector(selector);


    function getProjectId() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return params.get("id");
    }


    async function init() {

        state.projectId =
            getProjectId();

        if (!state.projectId) {

            UI.showToast(
                "No project selected.",
                "error"
            );

            window.location.href =
                "/projects.html";

            return;
        }

        UI.renderShell("projects");

        bindEvents();

        initializeSocket();

        await loadWorkspace();
    }


    function bindEvents() {

        /* =====================================================
           ADD TASK
        ===================================================== */

        $("#headerAddTaskBtn")
            ?.addEventListener(
                "click",
                () => {
                    openTaskModal("todo");
                }
            );


        $("#refreshBoardBtn")
            ?.addEventListener(
                "click",
                async () => {

                    const button =
                        $("#refreshBoardBtn");

                    try {

                        button.disabled =
                            true;

                        button.textContent =
                            "Refreshing...";

                        await loadWorkspace();

                        UI.showToast(
                            "Board refreshed.",
                            "success"
                        );

                    } catch (error) {

                        UI.showToast(
                            error.message ||
                            "Unable to refresh board.",
                            "error"
                        );

                    } finally {

                        button.disabled =
                            false;

                        button.textContent =
                            "↻ Refresh";
                    }
                }
            );


        document
            .querySelectorAll(
                "[data-add-status]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        openTaskModal(
                            button.dataset.addStatus ||
                            "todo"
                        );
                    }
                );
            });


        /* =====================================================
           EDIT TASK MODAL
        ===================================================== */

        $("#closeTaskModal")
            ?.addEventListener(
                "click",
                closeTaskModal
            );

        $("#cancelTaskBtn")
            ?.addEventListener(
                "click",
                closeTaskModal
            );

        $("#taskForm")
            ?.addEventListener(
                "submit",
                handleTaskSubmit
            );

        $("#deleteTaskBtn")
            ?.addEventListener(
                "click",
                handleDeleteTask
            );

        $("#taskModal")
            ?.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        $("#taskModal")
                    ) {
                        closeTaskModal();
                    }
                }
            );


        /* =====================================================
           COMMENTS MODAL
        ===================================================== */

        $("#closeCommentModal")
            ?.addEventListener(
                "click",
                closeCommentModal
            );

        $("#cancelCommentBtn")
            ?.addEventListener(
                "click",
                closeCommentModal
            );

        $("#addCommentBtn")
            ?.addEventListener(
                "click",
                handleAddComment
            );

        $("#commentInput")
            ?.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Enter" &&
                        (event.ctrlKey ||
                         event.metaKey)
                    ) {

                        event.preventDefault();

                        handleAddComment();
                    }
                }
            );

        $("#commentModal")
            ?.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        $("#commentModal")
                    ) {
                        closeCommentModal();
                    }
                }
            );


        /* =====================================================
           ADD MEMBER
        ===================================================== */

        $("#addMemberBtn")
            ?.addEventListener(
                "click",
                openMemberModal
            );

        $("#closeMemberModal")
            ?.addEventListener(
                "click",
                closeMemberModal
            );

        $("#cancelMemberBtn")
            ?.addEventListener(
                "click",
                closeMemberModal
            );


        const memberSearchInput =
            $("#memberSearchInput");

        if (memberSearchInput) {

            let searchTimer = null;

            memberSearchInput.addEventListener(
                "input",
                () => {

                    clearTimeout(
                        searchTimer
                    );

                    const query =
                        memberSearchInput.value.trim();

                    if (!query) {

                        renderMemberSearchEmpty(
                            "Start typing to search for a user."
                        );

                        return;
                    }

                    searchTimer =
                        setTimeout(
                            () => {
                                searchUsers(query);
                            },
                            300
                        );
                }
            );
        }


        $("#saveMemberBtn")
            ?.addEventListener(
                "click",
                addSelectedMember
            );


        $("#memberModal")
            ?.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        $("#memberModal")
                    ) {
                        closeMemberModal();
                    }
                }
            );


        /* =====================================================
           ESCAPE
        ===================================================== */

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                if (
                    $("#taskModal") &&
                    !$("#taskModal").hidden
                ) {

                    closeTaskModal();

                    return;
                }

                if (
                    $("#commentModal") &&
                    !$("#commentModal").hidden
                ) {

                    closeCommentModal();

                    return;
                }

                if (
                    $("#memberModal") &&
                    !$("#memberModal").hidden
                ) {

                    closeMemberModal();
                }
            }
        );
    }


    /* =====================================================
       WORKSPACE
    ===================================================== */

    async function loadWorkspace() {

        try {

            await Promise.all([
                loadProject(),
                loadTasks()
            ]);

            renderTeam();

        } catch (error) {

            console.error(
                "Workspace load error:",
                error
            );

            UI.showToast(
                error.message ||
                "Unable to load project.",
                "error"
            );
        }
    }


    async function loadProject() {

        const response =
            await apiRequest(
                `/projects/${state.projectId}`
            );

        const project =
            response.project ||
            response.data?.project ||
            response;

        if (!project) {

            throw new Error(
                "Project could not be loaded."
            );
        }

        state.project =
            project;

        state.members =
            response.members ||
            project.members ||
            project.team_members ||
            project.team ||
            [];

        renderProject();

        populateAssignees();

        renderTeam();
    }


    function renderProject() {

        const project =
            state.project;

        $("#projectName").textContent =
            project.name ||
            "Untitled project";

        $("#projectDescription").textContent =
            project.description ||
            "No project description yet.";

        const mark =
            $("#projectColor");

        if (mark) {

            mark.textContent =
                (
                    project.name ||
                    "F"
                )
                    .charAt(0)
                    .toUpperCase();

            mark.style.background =
                project.color ||
                "#111827";
        }

        const status =
            project.status ||
            "planning";

        const statusBadge =
            $("#projectStatusBadge");

        if (statusBadge) {

            statusBadge.textContent =
                UI.statusLabel(status);

            statusBadge.className =
                `status-badge status-${status}`;
        }

        $("#projectDeadline").textContent =
            project.deadline
                ? `Due ${UI.formatDate(
                    project.deadline
                )}`
                : "No deadline";

        const count =
            state.members.length ||
            Number(project.member_count) ||
            0;

        $("#memberCount").textContent =
            `${count} ${
                count === 1
                    ? "member"
                    : "members"
            }`;

        document.title =
            `${project.name || "Project"} — FlowPilot`;
    }


    /* =====================================================
       TASKS
    ===================================================== */

    async function loadTasks() {

        const response =
            await apiRequest(
                `/tasks?project_id=${encodeURIComponent(
                    state.projectId
                )}`
            );

        const tasks =
            response.tasks ||
            response.data?.tasks ||
            [];

        state.tasks =
            Array.isArray(tasks)
                ? tasks
                : [];

        renderBoard();

        renderHealth();
    }


    function renderBoard() {

        const statuses = [
            "todo",
            "in_progress",
            "in_review",
            "done"
        ];

        statuses.forEach((status) => {

            const container =
                $(`#column-${status}`);

            const count =
                $(`#count-${status}`);

            if (!container) {
                return;
            }

            const tasks =
                state.tasks
                    .filter(
                        (task) =>
                            normalizeStatus(
                                task.status
                            ) === status
                    )
                    .sort(sortTasks);

            if (count) {
                count.textContent =
                    tasks.length;
            }

            if (!tasks.length) {

                container.innerHTML = `
                    <div class="column-empty">
                        No tasks here yet.
                    </div>
                `;

                return;
            }

            container.innerHTML =
                tasks
                    .map(renderTaskCard)
                    .join("");

            bindTaskCards(container);
        });

        bindDropZones();
    }


    function normalizeStatus(status) {

        const value =
            String(
                status || "todo"
            )
                .trim()
                .toLowerCase();

        const allowed = [
            "todo",
            "in_progress",
            "in_review",
            "done"
        ];

        return allowed.includes(value)
            ? value
            : "todo";
    }


    function sortTasks(a, b) {

        const positionA =
            Number(a.position || 0);

        const positionB =
            Number(b.position || 0);

        if (
            positionA !== positionB
        ) {

            return positionA - positionB;
        }

        return (
            new Date(a.created_at || 0) -
            new Date(b.created_at || 0)
        );
    }


    function renderTaskCard(task) {

        const id =
            task.id;

        const title =
            UI.escapeHtml(
                task.title ||
                "Untitled task"
            );

        const description =
            UI.escapeHtml(
                task.description ||
                ""
            );

        const priority =
            String(
                task.priority ||
                "medium"
            );

        const assigneeName =
            getTaskAssigneeName(task);

        const deadline =
            task.deadline;

        const overdue =
            isOverdue(
                deadline,
                task.status
            );

        const avatar =
            assigneeName
                ? UI.avatarHtml(
                    {
                        full_name:
                            assigneeName,

                        avatar_color:
                            task.assignee_color ||
                            task.avatar_color ||
                            "#111827"
                    },
                    "task-avatar"
                )
                : "";

        return `
            <article
                class="task-card"
                draggable="true"
                data-task-id="${id}"
            >

                <div class="task-card-top">

                    <span
                        class="task-priority priority-${UI.escapeHtml(
                            priority
                        )}"
                    >
                        ${UI.escapeHtml(
                            UI.priorityLabel(
                                priority
                            )
                        )}
                    </span>

                    <div class="task-card-actions">

                        <button
                            type="button"
                            class="task-comment-button"
                            data-comment-task="${id}"
                            aria-label="Open comments"
                        >
                            💬 Comments
                        </button>

                        <button
                            type="button"
                            class="task-menu-button"
                            data-edit-task="${id}"
                            aria-label="Edit task"
                        >
                            •••
                        </button>

                    </div>

                </div>

                <h4 class="task-title">
                    ${title}
                </h4>

                ${
                    description
                        ? `
                            <p class="task-description">
                                ${description}
                            </p>
                        `
                        : ""
                }

                <div class="task-footer">

                    <div class="task-assignee">

                        ${
                            assigneeName
                                ? `
                                    ${avatar}

                                    <span class="task-assignee-name">
                                        ${UI.escapeHtml(
                                            assigneeName
                                        )}
                                    </span>
                                `
                                : `
                                    <span class="task-unassigned">
                                        Unassigned
                                    </span>
                                `
                        }

                    </div>

                    ${
                        deadline
                            ? `
                                <span
                                    class="task-deadline ${
                                        overdue
                                            ? "overdue"
                                            : ""
                                    }"
                                >
                                    ${
                                        overdue
                                            ? "Overdue"
                                            : UI.formatDate(
                                                deadline
                                            )
                                    }
                                </span>
                            `
                            : ""
                    }

                </div>

            </article>
        `;
    }


    function bindTaskCards(container) {

        /* =====================================================
           THREE DOTS = EDIT TASK ONLY
        ===================================================== */

        container
            .querySelectorAll(
                "[data-edit-task]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();
                        event.stopPropagation();

                        const taskId =
                            Number(
                                button.dataset.editTask
                            );

                        openTaskModal(
                            null,
                            taskId
                        );
                    }
                );
            });


        /* =====================================================
           COMMENT BUTTON = COMMENTS ONLY
        ===================================================== */

        container
            .querySelectorAll(
                "[data-comment-task]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();
                        event.stopPropagation();

                        const taskId =
                            Number(
                                button.dataset.commentTask
                            );

                        openCommentModal(
                            taskId
                        );
                    }
                );
            });


        /* =====================================================
           DOUBLE CLICK = EDIT TASK
        ===================================================== */

        container
            .querySelectorAll(
                ".task-card"
            )
            .forEach((card) => {

                card.addEventListener(
                    "dragstart",
                    handleDragStart
                );

                card.addEventListener(
                    "dragend",
                    handleDragEnd
                );

                card.addEventListener(
                    "dblclick",
                    (event) => {

                        if (
                            event.target.closest(
                                "button"
                            )
                        ) {
                            return;
                        }

                        const taskId =
                            Number(
                                card.dataset.taskId
                            );

                        openTaskModal(
                            null,
                            taskId
                        );
                    }
                );
            });
    }


    /* =====================================================
       DRAG & DROP
    ===================================================== */

    let draggedTaskId = null;


    function handleDragStart(event) {

        draggedTaskId =
            Number(
                event.currentTarget.dataset.taskId
            );

        event.currentTarget.classList.add(
            "dragging"
        );

        if (event.dataTransfer) {

            event.dataTransfer.effectAllowed =
                "move";

            event.dataTransfer.setData(
                "text/plain",
                String(draggedTaskId)
            );
        }
    }


    function handleDragEnd(event) {

        event.currentTarget.classList.remove(
            "dragging"
        );

        document
            .querySelectorAll(
                ".kanban-column"
            )
            .forEach((column) => {

                column.classList.remove(
                    "drag-over"
                );
            });

        draggedTaskId =
            null;
    }


    function bindDropZones() {

        document
            .querySelectorAll(
                ".kanban-column"
            )
            .forEach((column) => {

                column.addEventListener(
                    "dragover",
                    handleDragOver
                );

                column.addEventListener(
                    "dragleave",
                    handleDragLeave
                );

                column.addEventListener(
                    "drop",
                    handleDrop
                );
            });
    }


    function handleDragOver(event) {

        event.preventDefault();

        event.currentTarget.classList.add(
            "drag-over"
        );

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect =
                "move";
        }
    }


    function handleDragLeave(event) {

        const column =
            event.currentTarget;

        if (
            !column.contains(
                event.relatedTarget
            )
        ) {

            column.classList.remove(
                "drag-over"
            );
        }
    }


    async function handleDrop(event) {

        event.preventDefault();

        const column =
            event.currentTarget;

        column.classList.remove(
            "drag-over"
        );

        const taskId =
            Number(
                event.dataTransfer?.getData(
                    "text/plain"
                ) ||
                draggedTaskId
            );

        const newStatus =
            column.dataset.status;

        if (
            !taskId ||
            !newStatus
        ) {
            return;
        }

        const task =
            state.tasks.find(
                (item) =>
                    Number(item.id) === taskId
            );

        if (!task) {
            return;
        }

        const oldStatus =
            normalizeStatus(
                task.status
            );

        if (
            oldStatus === newStatus
        ) {
            return;
        }

        try {

            await updateTask(
                taskId,
                {
                    status: newStatus
                }
            );

            UI.showToast(
                `Task moved to ${UI.statusLabel(
                    newStatus
                )}.`,
                "success"
            );

        } catch (error) {

            UI.showToast(
                error.message ||
                "Unable to move task.",
                "error"
            );
        }
    }


    function renderHealth() {

        const total =
            state.tasks.length;

        const completed =
            state.tasks.filter(
                (task) =>
                    normalizeStatus(
                        task.status
                    ) === "done"
            ).length;

        const overdue =
            state.tasks.filter(
                (task) =>
                    isOverdue(
                        task.deadline,
                        task.status
                    )
            ).length;

        const progress =
            total > 0
                ? Math.round(
                    (completed / total) * 100
                )
                : 0;

        let score =
            progress;

        if (overdue > 0) {

            score -=
                Math.min(
                    overdue * 8,
                    35
                );
        }

        score =
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            );

        $("#totalTasks").textContent =
            total;

        $("#completedTasks").textContent =
            completed;

        $("#overdueTasks").textContent =
            overdue;

        $("#healthScore").textContent =
            score;

        $("#healthProgress").style.width =
            `${score}%`;

        if (score >= 75) {

            $("#healthText").textContent =
                "On track";

        } else if (score >= 45) {

            $("#healthText").textContent =
                "Needs attention";

        } else if (total > 0) {

            $("#healthText").textContent =
                "At risk";

        } else {

            $("#healthText").textContent =
                "Ready to plan";
        }
    }


    function isOverdue(
        deadline,
        status
    ) {

        if (
            !deadline ||
            normalizeStatus(status) === "done"
        ) {
            return false;
        }

        return (
            new Date(
                `${deadline}T23:59:59`
            ) < new Date()
        );
    }


    /* =====================================================
       TEAM
    ===================================================== */

    function renderTeam() {

        const container =
            $("#teamList");

        if (!container) {
            return;
        }

        if (!state.members.length) {

            container.innerHTML = `
                <div class="workspace-loading">
                    No project members yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            state.members
                .map((member) => {

                    const name =
                        getMemberName(member);

                    const email =
                        member.email || "";

                    const role =
                        member.role || "member";

                    return `
                        <div class="team-member">

                            ${UI.avatarHtml(
                                {
                                    full_name: name,
                                    avatar_color:
                                        member.avatar_color ||
                                        "#111827"
                                }
                            )}

                            <div class="team-member-info">

                                <div class="team-member-name">
                                    ${UI.escapeHtml(name)}
                                </div>

                                <div class="team-member-role">
                                    ${UI.escapeHtml(role)}
                                </div>

                                ${
                                    email
                                        ? `
                                            <div class="team-member-email">
                                                ${UI.escapeHtml(email)}
                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </div>
                    `;
                })
                .join("");
    }


    function getMemberName(member) {

        return (
            member.full_name ||
            member.name ||
            member.username ||
            member.email ||
            "Team member"
        );
    }


    /* =====================================================
       ASSIGNEES
    ===================================================== */

    function populateAssignees() {

        const select =
            $("#taskAssignee");

        if (!select) {
            return;
        }

        select.innerHTML = `
            <option value="">
                Unassigned
            </option>
        `;

        state.members.forEach(
            (member) => {

                const id =
                    member.user_id ??
                    member.id;

                if (!id) {
                    return;
                }

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    String(id);

                option.textContent =
                    getMemberName(member);

                select.appendChild(option);
            }
        );
    }


    /* =====================================================
       ADD MEMBER
    ===================================================== */

    function openMemberModal() {

        const modal =
            $("#memberModal");

        if (!modal) {
            return;
        }

        state.selectedMember =
            null;

        $("#memberSearchInput").value =
            "";

        renderMemberSearchEmpty(
            "Start typing to search for a user."
        );

        updateSelectedMember();

        clearMemberModalError();

        modal.hidden = false;
        modal.style.display = "flex";
        modal.classList.add("active");

        document.body.classList.add(
            "modal-open"
        );

        setTimeout(
            () => {
                $("#memberSearchInput")?.focus();
            },
            80
        );
    }


    function closeMemberModal() {

        const modal =
            $("#memberModal");

        if (!modal) {
            return;
        }

        modal.classList.remove("active");
        modal.style.display = "none";
        modal.hidden = true;

        document.body.classList.remove(
            "modal-open"
        );

        state.selectedMember =
            null;
    }


    async function searchUsers(query) {

        const results =
            $("#memberSearchResults");

        if (!results) {
            return;
        }

        results.innerHTML = `
            <div class="member-search-empty">
                Searching...
            </div>
        `;

        try {

            const response =
                await apiRequest(
                    `/users/search?q=${encodeURIComponent(
                        query
                    )}`
                );

            const users =
                response.users ||
                response.data?.users ||
                response.results ||
                [];

            const currentMemberIds =
                new Set(
                    state.members.map(
                        (member) =>
                            Number(
                                member.user_id ??
                                member.id
                            )
                    )
                );

            const availableUsers =
                users.filter(
                    (user) =>
                        !currentMemberIds.has(
                            Number(user.id)
                        )
                );

            if (!availableUsers.length) {

                renderMemberSearchEmpty(
                    "No available users found."
                );

                return;
            }

            results.innerHTML =
                availableUsers
                    .map(renderMemberSearchResult)
                    .join("");

            results
                .querySelectorAll(
                    "[data-member-id]"
                )
                .forEach(
                    (button) => {

                        button.addEventListener(
                            "click",
                            () => {

                                const userId =
                                    Number(
                                        button.dataset.memberId
                                    );

                                state.selectedMember =
                                    availableUsers.find(
                                        (user) =>
                                            Number(user.id) ===
                                            userId
                                    ) || null;

                                results
                                    .querySelectorAll(
                                        ".member-search-result"
                                    )
                                    .forEach(
                                        (item) =>
                                            item.classList.remove(
                                                "selected"
                                            )
                                    );

                                button.classList.add(
                                    "selected"
                                );

                                updateSelectedMember();
                            }
                        );
                    }
                );

        } catch (error) {

            console.error(
                "User search error:",
                error
            );

            renderMemberSearchEmpty(
                error.message ||
                "Unable to search users."
            );
        }
    }


    function renderMemberSearchResult(user) {

        const name =
            getMemberName(user);

        return `
            <button
                type="button"
                class="member-search-result"
                data-member-id="${Number(user.id)}"
            >

                ${UI.avatarHtml(
                    {
                        full_name: name,
                        avatar_color:
                            user.avatar_color ||
                            "#111827"
                    }
                )}

                <div class="member-search-info">

                    <div class="member-search-name">
                        ${UI.escapeHtml(name)}
                    </div>

                    ${
                        user.username
                            ? `
                                <div class="member-search-username">
                                    ${UI.escapeHtml(
                                        "@" + user.username
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${
                        user.email
                            ? `
                                <div class="member-search-email">
                                    ${UI.escapeHtml(user.email)}
                                </div>
                            `
                            : ""
                    }

                </div>

            </button>
        `;
    }


    function renderMemberSearchEmpty(message) {

        const results =
            $("#memberSearchResults");

        if (!results) {
            return;
        }

        results.innerHTML = `
            <div class="member-search-empty">
                ${UI.escapeHtml(message)}
            </div>
        `;
    }


    function updateSelectedMember() {

        const preview =
            $("#selectedMemberPreview");

        const saveButton =
            $("#saveMemberBtn");

        if (!preview || !saveButton) {
            return;
        }

        if (!state.selectedMember) {

            preview.classList.remove("visible");
            preview.innerHTML = "";
            saveButton.disabled = true;

            return;
        }

        const name =
            getMemberName(
                state.selectedMember
            );

        preview.innerHTML = `
            Selected:
            <strong>
                ${UI.escapeHtml(name)}
            </strong>
        `;

        preview.classList.add("visible");
        saveButton.disabled = false;
    }


    async function addSelectedMember() {

        if (!state.selectedMember) {
            return;
        }

        const selectedUserId =
            Number(
                state.selectedMember.id
            );

        const saveButton =
            $("#saveMemberBtn");

        clearMemberModalError();

        saveButton.disabled = true;
        saveButton.textContent = "Adding...";

        try {

            await apiRequest(
                `/projects/${state.projectId}/members`,
                {
                    method: "POST",
                    body: {
                        user_id: selectedUserId
                    }
                }
            );

            UI.showToast(
                "Member added successfully.",
                "success"
            );

            closeMemberModal();

            await loadProject();

        } catch (error) {

            showMemberModalError(
                error.message ||
                "Unable to add member."
            );

            saveButton.disabled = false;

        } finally {

            saveButton.textContent =
                "Add member";

            if (!state.selectedMember) {
                saveButton.disabled = true;
            }
        }
    }


    function clearMemberModalError() {

        const element =
            $("#memberModalError");

        if (!element) {
            return;
        }

        element.hidden = true;
        element.textContent = "";
    }


    function showMemberModalError(message) {

        const element =
            $("#memberModalError");

        if (!element) {

            UI.showToast(
                message,
                "error"
            );

            return;
        }

        element.textContent =
            message;

        element.hidden = false;
    }


    /* =====================================================
       EDIT / CREATE TASK MODAL
       NO COMMENTS INSIDE THIS MODAL
    ===================================================== */

    function openTaskModal(
        defaultStatus = "todo",
        taskId = null
    ) {

        const modal =
            $("#taskModal");

        const form =
            $("#taskForm");

        if (!modal || !form) {
            return;
        }

        clearTaskModalError();

        state.editingTaskId =
            taskId;

        const deleteButton =
            $("#deleteTaskBtn");


        if (taskId) {

            const task =
                state.tasks.find(
                    (item) =>
                        Number(item.id) ===
                        Number(taskId)
                );

            if (!task) {

                UI.showToast(
                    "Task not found.",
                    "error"
                );

                return;
            }

            $("#taskModalTitle").textContent =
                "Edit task";

            $("#saveTaskBtn").textContent =
                "Save changes";

            deleteButton.hidden =
                false;

            $("#taskId").value =
                task.id;

            $("#taskTitle").value =
                task.title || "";

            $("#taskDescription").value =
                task.description || "";

            $("#taskStatus").value =
                normalizeStatus(task.status);

            $("#taskPriority").value =
                task.priority || "medium";

            $("#taskAssignee").value =
                getTaskAssigneeId(task)
                    ? String(
                        getTaskAssigneeId(task)
                    )
                    : "";

            $("#taskDeadline").value =
                normalizeDateInput(
                    task.deadline
                );

        } else {

            form.reset();

            $("#taskModalTitle").textContent =
                "Create task";

            $("#saveTaskBtn").textContent =
                "Create task";

            $("#taskId").value =
                "";

            $("#taskStatus").value =
                defaultStatus || "todo";

            $("#taskPriority").value =
                "medium";

            $("#taskAssignee").value =
                "";

            deleteButton.hidden =
                true;
        }


        modal.hidden = false;
        modal.style.display = "flex";
        modal.classList.add("active");

        document.body.classList.add(
            "modal-open"
        );

        setTimeout(
            () => {
                $("#taskTitle")?.focus();
            },
            80
        );
    }


    function closeTaskModal() {

        const modal =
            $("#taskModal");

        if (!modal) {
            return;
        }

        modal.classList.remove("active");
        modal.style.display = "none";
        modal.hidden = true;

        document.body.classList.remove(
            "modal-open"
        );

        state.editingTaskId =
            null;

        clearTaskModalError();
    }


    function clearTaskModalError() {

        const element =
            $("#taskModalError");

        if (!element) {
            return;
        }

        element.hidden = true;
        element.textContent = "";
    }


    function showTaskModalError(message) {

        const element =
            $("#taskModalError");

        if (!element) {

            UI.showToast(
                message,
                "error"
            );

            return;
        }

        element.textContent =
            message;

        element.hidden = false;
    }


    /* =====================================================
       COMMENTS MODAL
    ===================================================== */

    async function openCommentModal(taskId) {

        const modal =
            $("#commentModal");

        if (!modal) {
            return;
        }

        const task =
            state.tasks.find(
                (item) =>
                    Number(item.id) ===
                    Number(taskId)
            );

        if (!task) {

            UI.showToast(
                "Task not found.",
                "error"
            );

            return;
        }

        state.commentingTaskId =
            Number(taskId);

        state.comments = [];

        $("#commentModalTaskTitle").textContent =
            task.title ||
            "Task";

        $("#commentsList").innerHTML = `
            <div class="comments-empty">
                Loading comments...
            </div>
        `;

        $("#commentInput").value =
            "";

        modal.hidden = false;
        modal.style.display = "flex";
        modal.classList.add("active");

        document.body.classList.add(
            "modal-open"
        );

        await loadComments(taskId);

        setTimeout(
            () => {
                $("#commentInput")?.focus();
            },
            80
        );
    }


    function closeCommentModal() {

        const modal =
            $("#commentModal");

        if (!modal) {
            return;
        }

        modal.classList.remove("active");
        modal.style.display = "none";
        modal.hidden = true;

        document.body.classList.remove(
            "modal-open"
        );

        state.commentingTaskId =
            null;

        state.comments = [];

        $("#commentInput").value =
            "";

        $("#commentsList").innerHTML = `
            <div class="comments-empty">
                No comments yet.
            </div>
        `;
    }


    async function loadComments(taskId) {

        const list =
            $("#commentsList");

        if (!list) {
            return;
        }

        list.innerHTML = `
            <div class="comments-empty">
                Loading comments...
            </div>
        `;

        try {

            const response =
                await apiRequest(
                    `/comments/task/${taskId}`
                );

            const comments =
                response.comments ||
                response.data?.comments ||
                response.data ||
                [];

            state.comments =
                Array.isArray(comments)
                    ? comments
                    : [];

            renderComments();

        } catch (error) {

            console.error(
                "Load comments error:",
                error
            );

            list.innerHTML = `
                <div class="comments-empty">
                    ${UI.escapeHtml(
                        error.message ||
                        "Unable to load comments."
                    )}
                </div>
            `;
        }
    }


    function renderComments() {

        const list =
            $("#commentsList");

        const count =
            $("#taskCommentsCount");

        if (!list) {
            return;
        }

        if (count) {

            count.textContent =
                `${state.comments.length} ${
                    state.comments.length === 1
                        ? "comment"
                        : "comments"
                }`;
        }

        if (!state.comments.length) {

            list.innerHTML = `
                <div class="comments-empty">
                    No comments yet. Start the conversation.
                </div>
            `;

            return;
        }

        list.innerHTML =
            state.comments
                .map(renderComment)
                .join("");

        list
            .querySelectorAll(
                "[data-delete-comment]"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            deleteComment(
                                Number(
                                    button.dataset.deleteComment
                                )
                            );
                        }
                    );
                }
            );
    }


    function renderComment(comment) {

        const name =
            comment.full_name ||
            comment.username ||
            comment.user_name ||
            "User";

        const body =
            comment.body ||
            comment.comment ||
            "";

        const date =
            comment.created_at
                ? formatCommentDate(
                    comment.created_at
                )
                : "";

        const currentUser =
            FlowPilotAPI.getStoredUser();

        const currentUserId =
            Number(currentUser?.id);

        const commentUserId =
            Number(
                comment.user_id ??
                comment.userId
            );

        const canDelete =
            currentUserId &&
            commentUserId &&
            currentUserId ===
                commentUserId;

        return `
            <div
                class="comment-item"
                data-comment-id="${comment.id}"
            >

                ${UI.avatarHtml(
                    {
                        full_name: name,
                        avatar_color:
                            comment.avatar_color ||
                            "#111827"
                    },
                    "task-avatar"
                )}

                <div class="comment-content">

                    <div class="comment-top">

                        <span class="comment-author">
                            ${UI.escapeHtml(name)}
                        </span>

                        <span class="comment-date">
                            ${UI.escapeHtml(date)}
                        </span>

                    </div>

                    <div class="comment-body">
                        ${UI.escapeHtml(body)}
                    </div>

                    ${
                        canDelete
                            ? `
                                <button
                                    type="button"
                                    class="comment-delete"
                                    data-delete-comment="${comment.id}"
                                >
                                    Delete
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>
        `;
    }


    function formatCommentDate(value) {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        return date.toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    }


    async function handleAddComment() {

        const taskId =
            state.commentingTaskId;

        if (!taskId) {
            return;
        }

        const input =
            $("#commentInput");

        const button =
            $("#addCommentBtn");

        const body =
            input.value.trim();

        if (!body) {

            input.focus();

            return;
        }

        button.disabled = true;
        button.textContent = "Adding...";

        try {

            const response =
                await apiRequest(
                    `/comments/task/${taskId}`,
                    {
                        method: "POST",
                        body: {
                            body
                        }
                    }
                );

            const comment =
                response.comment ||
                response.data?.comment;

            input.value = "";

            if (comment) {

                state.comments.push(
                    comment
                );

                renderComments();

            } else {

                await loadComments(
                    taskId
                );
            }

            UI.showToast(
                "Comment added.",
                "success"
            );

        } catch (error) {

            console.error(
                "Add comment error:",
                error
            );

            UI.showToast(
                error.message ||
                "Unable to add comment.",
                "error"
            );

        } finally {

            button.disabled = false;
            button.textContent = "Add comment";
        }
    }


    async function deleteComment(commentId) {

        const confirmed =
            window.confirm(
                "Delete this comment?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiRequest(
                `/comments/${commentId}`,
                {
                    method: "DELETE"
                }
            );

            state.comments =
                state.comments.filter(
                    (comment) =>
                        Number(comment.id) !==
                        Number(commentId)
                );

            renderComments();

            UI.showToast(
                "Comment deleted.",
                "success"
            );

        } catch (error) {

            console.error(
                "Delete comment error:",
                error
            );

            UI.showToast(
                error.message ||
                "Unable to delete comment.",
                "error"
            );
        }
    }


    /* =====================================================
       SAVE TASK
    ===================================================== */

    async function handleTaskSubmit(event) {

        event.preventDefault();

        clearTaskModalError();

        const title =
            $("#taskTitle")
                .value
                .trim();

        if (!title) {

            showTaskModalError(
                "Task title is required."
            );

            return;
        }

        const body = {

            project_id:
                Number(state.projectId),

            title,

            description:
                $("#taskDescription")
                    .value
                    .trim(),

            status:
                $("#taskStatus").value,

            priority:
                $("#taskPriority").value,

            assignee_id:
                $("#taskAssignee").value
                    ? Number(
                        $("#taskAssignee").value
                    )
                    : null,

            deadline:
                $("#taskDeadline").value
                    ? $("#taskDeadline").value
                    : null
        };

        const saveButton =
            $("#saveTaskBtn");

        const originalText =
            saveButton.textContent;

        saveButton.disabled = true;

        saveButton.textContent =
            state.editingTaskId
                ? "Saving..."
                : "Creating...";

        try {

            if (state.editingTaskId) {

                await apiRequest(
                    `/tasks/${state.editingTaskId}`,
                    {
                        method: "PUT",
                        body
                    }
                );

                UI.showToast(
                    "Task updated successfully.",
                    "success"
                );

            } else {

                await apiRequest(
                    "/tasks",
                    {
                        method: "POST",
                        body
                    }
                );

                UI.showToast(
                    "Task created successfully.",
                    "success"
                );
            }

            closeTaskModal();

            await loadTasks();

        } catch (error) {

            console.error(
                "Task save error:",
                error
            );

            showTaskModalError(
                error.message ||
                "Unable to save task."
            );

        } finally {

            saveButton.disabled = false;
            saveButton.textContent = originalText;
        }
    }


    async function updateTask(taskId, body) {

        const response =
            await apiRequest(
                `/tasks/${taskId}`,
                {
                    method: "PUT",
                    body
                }
            );

        const updatedTask =
            response.task ||
            response.data?.task ||
            response;

        if (
            updatedTask &&
            updatedTask.id
        ) {

            const index =
                state.tasks.findIndex(
                    (task) =>
                        Number(task.id) ===
                        Number(taskId)
                );

            if (index !== -1) {

                state.tasks[index] =
                    updatedTask;
            }

        } else {

            await loadTasks();

            return;
        }

        renderBoard();
        renderHealth();

        return updatedTask;
    }


    async function handleDeleteTask() {

        const taskId =
            state.editingTaskId;

        if (!taskId) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this task? This action cannot be undone."
            );

        if (!confirmed) {
            return;
        }

        const button =
            $("#deleteTaskBtn");

        button.disabled = true;
        button.textContent = "Deleting...";

        try {

            await apiRequest(
                `/tasks/${taskId}`,
                {
                    method: "DELETE"
                }
            );

            closeTaskModal();

            UI.showToast(
                "Task deleted successfully.",
                "success"
            );

            await loadTasks();

        } catch (error) {

            showTaskModalError(
                error.message ||
                "Unable to delete task."
            );

        } finally {

            button.disabled = false;
            button.textContent = "Delete task";
        }
    }


    /* =====================================================
       TASK HELPERS
    ===================================================== */

    function getTaskAssigneeId(task) {

        return (
            task.assignee_id ??
            task.assigneeId ??
            task.assignee?.id ??
            null
        );
    }


    function getTaskAssigneeName(task) {

        return (
            task.assignee_name ||
            task.assignee_full_name ||
            task.assignee_username ||
            task.assignee?.full_name ||
            task.assignee?.name ||
            task.assignee?.username ||
            null
        );
    }


    function normalizeDateInput(value) {

        if (!value) {
            return "";
        }

        return String(value)
            .split("T")[0]
            .split(" ")[0];
    }


    /* =====================================================
       SOCKET.IO
    ===================================================== */

    function initializeSocket() {

        if (
            typeof window.io !== "function"
        ) {

            console.warn(
                "Socket.IO client unavailable."
            );

            return;
        }

        state.socket =
            window.io();


        state.socket.on(
            "connect",
            () => {

                console.log(
                    "FlowPilot realtime connected."
                );

                state.socket.emit(
                    "join:project",
                    Number(state.projectId)
                );
            }
        );


        [
            "task:created",
            "task:updated",
            "task:deleted"
        ]
            .forEach(
                (eventName) => {

                    state.socket.on(
                        eventName,
                        (payload) => {

                            if (
                                isProjectEvent(
                                    payload
                                )
                            ) {

                                loadTasks();
                            }
                        }
                    );
                }
            );


        [
            "project:updated",
            "project:member_added",
            "project:member_removed"
        ]
            .forEach(
                (eventName) => {

                    state.socket.on(
                        eventName,
                        (payload) => {

                            if (
                                isProjectEvent(
                                    payload
                                )
                            ) {

                                loadProject();
                            }
                        }
                    );
                }
            );


        /* =================================================
           REALTIME COMMENTS
        ================================================= */

        [
            "comment:new",
            "comment:created",
            "comment:deleted"
        ]
            .forEach(
                (eventName) => {

                    state.socket.on(
                        eventName,
                        (payload) => {

                            if (
                                !isProjectEvent(
                                    payload
                                )
                            ) {
                                return;
                            }

                            const taskId =
                                Number(
                                    payload?.task_id ??
                                    payload?.taskId ??
                                    payload?.comment?.task_id
                                );

                            if (
                                !taskId ||
                                Number(
                                    state.commentingTaskId
                                ) !== taskId
                            ) {
                                return;
                            }

                            loadComments(taskId);
                        }
                    );
                }
            );
    }


    function isProjectEvent(payload) {

        if (!payload) {
            return true;
        }

        const projectId =
            payload.project_id ??
            payload.projectId ??
            payload.project?.id ??
            payload.task?.project_id ??
            payload.comment?.project_id;

        if (
            projectId === undefined ||
            projectId === null
        ) {
            return true;
        }

        return (
            Number(projectId) ===
            Number(state.projectId)
        );
    }


    init();
});