/* =========================================================
   VIBE SHORTS
   CodeAlpha Task 2 - Social Media Platform

   Features:
   - Authentication
   - Load Shorts
   - Category filtering
   - Trending topics
   - Like / unlike Shorts
   - Share Shorts
   - Copy Shorts
   - Delete own Shorts
   - Create Shorts
   - Image preview
   - Interactive Aptitude / Coding / Riddle Challenges
   - Quiz scoring
   - Quiz explanations
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    /* =====================================================
       STATE
       ===================================================== */

    let currentCategory = "all";
    let currentUser = null;
    let shorts = [];

    let isLoadingShorts = false;
    let isSubmittingShort = false;

    // Quiz / Challenge state
    let challengeQuestions = [];
    let challengeIndex = 0;
    let challengeScore = 0;
    let challengeCategory = "";
    let challengeAnswered = false;


    /* =====================================================
       DOM ELEMENTS
       ===================================================== */

    const shortsGrid = document.getElementById("shortsGrid");
    const shortsLoading = document.getElementById("shortsLoading");
    const shortsEmpty = document.getElementById("shortsEmpty");
    const shortsCount = document.getElementById("shortsCount");

    const feedTitle = document.getElementById("feedTitle");

    const categoryPills = document.querySelectorAll(".category-pill");
    const trendingTags = document.querySelectorAll(".trending-tag");

    const refreshShortsBtn = document.getElementById("refreshShorts");

    const profileLink = document.getElementById("profileLink");
    const profileAvatar = document.getElementById("profileAvatar");

    const createShortBtn = document.getElementById("createShortBtn");
    const createShortModal = document.getElementById("createShortModal");
    const closeCreateModal = document.getElementById("closeCreateModal");
    const cancelCreateShort = document.getElementById("cancelCreateShort");

    const createShortForm = document.getElementById("createShortForm");

    const shortTitle = document.getElementById("shortTitle");
    const shortCategory = document.getElementById("shortCategory");
    const shortContent = document.getElementById("shortContent");
    const shortImage = document.getElementById("shortImage");

    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewImg = document.getElementById("imagePreviewImg");

    const contentCharCount = document.getElementById("contentCharCount");

    const toastContainer = document.getElementById("toastContainer");


    /* =====================================================
       CATEGORY INFORMATION
       ===================================================== */

    const categoryInfo = {
        all: {
            title: "Vibe Discover",
            icon: "fa-compass",
            label: "All"
        },

        job: {
            title: "Jobs",
            icon: "fa-briefcase",
            label: "Jobs"
        },

        internship: {
            title: "Internships",
            icon: "fa-user-graduate",
            label: "Internships"
        },

        hackathon: {
            title: "Hackathons",
            icon: "fa-fire",
            label: "Hackathons"
        },

        scholarship: {
            title: "Scholarships",
            icon: "fa-graduation-cap",
            label: "Scholarships"
        },

        education: {
            title: "Education",
            icon: "fa-book-open",
            label: "Education"
        },

        aptitude: {
            title: "Aptitude Arena",
            icon: "fa-brain",
            label: "Aptitude"
        },

        coding: {
            title: "Coding Challenges",
            icon: "fa-code",
            label: "Coding"
        },

        riddle: {
            title: "Riddle Room",
            icon: "fa-puzzle-piece",
            label: "Riddles"
        },

        joke: {
            title: "Developer Jokes",
            icon: "fa-face-laugh",
            label: "Jokes"
        },

        news: {
            title: "Tech News",
            icon: "fa-newspaper",
            label: "News"
        }
    };


    /* =====================================================
       CHALLENGE CATEGORIES
       ===================================================== */

    const challengeCategories = ["aptitude", "coding", "riddle"];


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    try {
        if (typeof requireAuth === "function") {
            await requireAuth();
        }

        await loadCurrentUser();

        setupEventListeners();

        await loadShorts();

    } catch (error) {
        console.error("Shorts initialization error:", error);
        showToast("Unable to load Shorts. Please refresh.", "error");
    }


    /* =====================================================
       LOAD CURRENT USER
       ===================================================== */

    async function loadCurrentUser() {
        try {
            if (typeof apiRequest !== "function") {
                console.warn("apiRequest() is not available.");
                return;
            }

            const response = await apiRequest("/auth/me");

            currentUser =
                response?.user ||
                response ||
                null;

            updateProfileUI();

        } catch (error) {
            console.error("Could not load current user:", error);
        }
    }


    /* =====================================================
       PROFILE UI
       ===================================================== */

    function updateProfileUI() {
        if (!currentUser) {
            return;
        }

        if (profileLink && currentUser.id) {
            profileLink.href = `/profile.html?id=${currentUser.id}`;
        }

        if (profileAvatar) {
            const image =
                currentUser.profile_image ||
                currentUser.profileImage ||
                "";

            if (image) {
                profileAvatar.src = image;
            }
        }
    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function setupEventListeners() {

        /* ---------------------------------------------
           CATEGORY PILLS
           --------------------------------------------- */

        categoryPills.forEach((pill) => {

            pill.addEventListener("click", () => {

                const category =
                    pill.dataset.category || "all";

                selectCategory(category);
            });
        });


        /* ---------------------------------------------
           TRENDING TAGS
           --------------------------------------------- */

        trendingTags.forEach((tag) => {

            tag.addEventListener("click", () => {

                const category =
                    tag.dataset.category ||
                    tag.dataset.tag ||
                    "all";

                selectCategory(category);
            });
        });


        /* ---------------------------------------------
           REFRESH
           --------------------------------------------- */

        if (refreshShortsBtn) {

            refreshShortsBtn.addEventListener("click", async () => {

                await loadShorts();

            });
        }


        /* ---------------------------------------------
           CREATE SHORT
           --------------------------------------------- */

        if (createShortBtn) {

            createShortBtn.addEventListener("click", () => {

                openCreateModal();

            });
        }


        if (closeCreateModal) {

            closeCreateModal.addEventListener("click", () => {

                closeCreateShortModal();

            });
        }


        if (cancelCreateShort) {

            cancelCreateShort.addEventListener("click", () => {

                closeCreateShortModal();

            });
        }


        /* ---------------------------------------------
           CREATE MODAL BACKDROP
           --------------------------------------------- */

        if (createShortModal) {

            createShortModal.addEventListener("click", (event) => {

                if (event.target === createShortModal) {

                    closeCreateShortModal();

                }
            });
        }


        /* ---------------------------------------------
           CONTENT CHARACTER COUNT
           --------------------------------------------- */

        if (shortContent && contentCharCount) {

            shortContent.addEventListener("input", () => {

                contentCharCount.textContent =
                    shortContent.value.length;

            });
        }


        /* ---------------------------------------------
           IMAGE PREVIEW
           --------------------------------------------- */

        if (shortImage) {

            shortImage.addEventListener("input", () => {

                updateImagePreview();

            });
        }


        /* ---------------------------------------------
           CREATE FORM
           --------------------------------------------- */

        if (createShortForm) {

            createShortForm.addEventListener("submit", async (event) => {

                event.preventDefault();

                await createShort();

            });
        }


        /* ---------------------------------------------
           KEYBOARD
           --------------------------------------------- */

        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape") {

                if (
                    createShortModal &&
                    !createShortModal.classList.contains("hidden")
                ) {
                    closeCreateShortModal();
                }

                closeChallengeModal();

            }
        });
    }


    /* =====================================================
       SELECT CATEGORY
       ===================================================== */

    async function selectCategory(category) {

        currentCategory = category || "all";

        updateCategoryUI();

        await loadShorts();
    }


    /* =====================================================
       UPDATE CATEGORY UI
       ===================================================== */

    function updateCategoryUI() {

        categoryPills.forEach((pill) => {

            const category =
                pill.dataset.category || "all";

            pill.classList.toggle(
                "active",
                category === currentCategory
            );
        });


        if (feedTitle) {

            const info =
                categoryInfo[currentCategory] ||
                categoryInfo.all;

            feedTitle.textContent =
                info.title;
        }
    }


    /* =====================================================
       LOAD SHORTS
       ===================================================== */

    async function loadShorts() {

        if (isLoadingShorts) {
            return;
        }

        isLoadingShorts = true;

        showShortsLoading(true);
        hideShortsEmpty();

        try {

            let endpoint = "/shorts?limit=50";

            if (
                currentCategory &&
                currentCategory !== "all"
            ) {

                endpoint +=
                    `&category=${encodeURIComponent(currentCategory)}`;
            }


            if (typeof apiRequest !== "function") {
                throw new Error("apiRequest is not available.");
            }


            const response =
                await apiRequest(endpoint);


            shorts =
                response?.shorts ||
                response?.data ||
                response ||
                [];


            if (!Array.isArray(shorts)) {
                shorts = [];
            }


            renderShorts();

        } catch (error) {

            console.error("Load Shorts error:", error);

            shorts = [];

            showShortsError(
                "Unable to load Shorts right now."
            );

        } finally {

            isLoadingShorts = false;

            showShortsLoading(false);
        }
    }


    /* =====================================================
       RENDER SHORTS
       ===================================================== */

    function renderShorts() {

        if (!shortsGrid) {
            return;
        }


        shortsGrid.innerHTML = "";


        if (!shorts.length) {

            showShortsEmpty();

            updateShortsCount(0);

            return;
        }


        hideShortsEmpty();


        shorts.forEach((short) => {

            const card =
                createShortCard(short);

            shortsGrid.appendChild(card);

        });


        updateShortsCount(shorts.length);
    }


    /* =====================================================
       CREATE SHORT CARD
       ===================================================== */

    function createShortCard(short) {

        const article =
            document.createElement("article");

        article.className = "short-card";

        article.dataset.id = short.id;


        const category =
            short.category || "education";


        const info =
            categoryInfo[category] ||
            categoryInfo.education;


        const authorName =
            escapeHtml(
                short.author_name ||
                short.name ||
                short.username ||
                "Vibe User"
            );


        const username =
            escapeHtml(
                short.username ||
                ""
            );


        const title =
            escapeHtml(
                short.title ||
                info.label
            );


        const content =
            escapeHtml(
                short.content ||
                ""
            );


        const imageUrl =
            short.image_url ||
            short.imageUrl ||
            "";


        const likeCount =
            Number(
                short.likes_count ??
                short.like_count ??
                short.likes ??
                0
            );


        const liked =
            Boolean(
                short.liked_by_me ??
                short.liked ??
                false
            );


        const isOwner =
            Boolean(
                short.is_owner ??
                (
                    currentUser &&
                    Number(short.user_id) ===
                    Number(currentUser.id)
                )
            );


        const formattedDate =
            formatShortDate(
                short.created_at ||
                short.createdAt
            );


        /* ---------------------------------------------
           MEDIA
           --------------------------------------------- */

        let mediaHtml = "";

        if (imageUrl) {

            mediaHtml = `
                <div class="short-media">
                    <img
                        src="${escapeHtml(imageUrl)}"
                        alt="${title}"
                        loading="lazy"
                        onerror="this.parentElement.innerHTML='<div class=&quot;short-placeholder&quot;><i class=&quot;fa-solid ${info.icon}&quot;></i></div>';"
                    >
                </div>
            `;

        } else {

            mediaHtml = `
                <div class="short-media short-placeholder">
                    <i class="fa-solid ${info.icon}"></i>
                </div>
            `;
        }


        /* ---------------------------------------------
           CHALLENGE BUTTON
           --------------------------------------------- */

        let challengeHtml = "";

        if (challengeCategories.includes(category)) {

            const challengeText =
                category === "aptitude"
                    ? "Try Challenge"
                    : category === "coding"
                        ? "Solve Challenge"
                        : "Solve Riddle";


            const challengeIcon =
                category === "aptitude"
                    ? "fa-brain"
                    : category === "coding"
                        ? "fa-code"
                        : "fa-puzzle-piece";


            challengeHtml = `
                <button
                    class="short-challenge-btn"
                    data-action="challenge"
                    data-category="${category}"
                    type="button"
                    title="${challengeText}"
                >
                    <i class="fa-solid ${challengeIcon}"></i>
                    <span>${challengeText}</span>
                </button>
            `;
        }


        /* ---------------------------------------------
           OWNER ACTION
           --------------------------------------------- */

        const deleteHtml =
            isOwner
                ? `
                    <button
                        class="short-action-btn delete-short-btn"
                        data-action="delete"
                        title="Delete Short"
                        type="button"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `
                : "";


        /* ---------------------------------------------
           CARD HTML
           --------------------------------------------- */

        article.innerHTML = `

            ${mediaHtml}

            <div class="short-card-body">

                <div class="short-category-badge ${category}">
                    <i class="fa-solid ${info.icon}"></i>
                    ${info.label}
                </div>


                <div class="short-author">

                    <div class="short-author-avatar">

                        ${
                            short.author_image ||
                            short.profile_image
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            short.author_image ||
                                            short.profile_image
                                        )}"
                                        alt="${authorName}"
                                    >
                                `
                                : `
                                    <span>
                                        ${getInitials(
                                            short.author_name ||
                                            short.name ||
                                            short.username ||
                                            "U"
                                        )}
                                    </span>
                                `
                        }

                    </div>


                    <div class="short-author-info">

                        <strong>
                            ${authorName}
                        </strong>

                        ${
                            username
                                ? `
                                    <span>
                                        @${username}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>


                <h3 class="short-title">
                    ${title}
                </h3>


                <p class="short-content">
                    ${content}
                </p>


                ${
                    challengeHtml
                        ? `
                            <div class="short-challenge-area">
                                ${challengeHtml}
                            </div>
                        `
                        : ""
                }


                <div class="short-meta">

                    <span>
                        <i class="fa-regular fa-clock"></i>
                        ${formattedDate}
                    </span>

                </div>


                <div class="short-actions">

                    <button
                        class="short-action-btn like-short-btn ${
                            liked ? "liked" : ""
                        }"
                        data-action="like"
                        type="button"
                        title="${liked ? "Unlike" : "Like"}"
                    >

                        <i class="${
                            liked
                                ? "fa-solid"
                                : "fa-regular"
                        } fa-heart"></i>

                        <span class="like-count">
                            ${likeCount}
                        </span>

                    </button>


                    <button
                        class="short-action-btn"
                        data-action="share"
                        type="button"
                        title="Share"
                    >
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>


                    <button
                        class="short-action-btn"
                        data-action="copy"
                        type="button"
                        title="Copy"
                    >
                        <i class="fa-regular fa-copy"></i>
                    </button>


                    ${deleteHtml}

                </div>

            </div>
        `;


        /* =================================================
           CARD EVENTS
           ================================================= */

        const likeButton =
            article.querySelector(
                '[data-action="like"]'
            );


        if (likeButton) {

            likeButton.addEventListener(
                "click",
                async () => {

                    await toggleShortLike(
                        short,
                        likeButton
                    );
                }
            );
        }


        const shareButton =
            article.querySelector(
                '[data-action="share"]'
            );


        if (shareButton) {

            shareButton.addEventListener(
                "click",
                async () => {

                    await shareShort(short);
                }
            );
        }


        const copyButton =
            article.querySelector(
                '[data-action="copy"]'
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                async () => {

                    await copyShort(short);
                }
            );
        }


        const deleteButton =
            article.querySelector(
                '[data-action="delete"]'
            );


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                async () => {

                    await deleteShort(short);
                }
            );
        }


        const challengeButton =
            article.querySelector(
                '[data-action="challenge"]'
            );


        if (challengeButton) {

            challengeButton.addEventListener(
                "click",
                async () => {

                    const category =
                        challengeButton.dataset.category;

                    await openChallenge(
                        category
                    );
                }
            );
        }


        return article;
    }


    /* =====================================================
       LIKE SHORT
       ===================================================== */

    async function toggleShortLike(
        short,
        button
    ) {

        if (!short?.id) {
            return;
        }


        try {

            button.disabled = true;


            const response =
                await apiRequest(
                    `/short-likes/${short.id}`,
                    {
                        method: "POST"
                    }
                );


            const liked =
                Boolean(
                    response?.liked
                );


            const count =
                Number(
                    response?.like_count ??
                    response?.likes_count ??
                    0
                );


            short.liked_by_me =
                liked;


            short.likes_count =
                count;


            button.classList.toggle(
                "liked",
                liked
            );


            const icon =
                button.querySelector("i");


            if (icon) {

                icon.className =
                    liked
                        ? "fa-solid fa-heart"
                        : "fa-regular fa-heart";
            }


            const countElement =
                button.querySelector(
                    ".like-count"
                );


            if (countElement) {

                countElement.textContent =
                    count;
            }


            button.classList.remove(
                "like-pop"
            );


            void button.offsetWidth;


            button.classList.add(
                "like-pop"
            );


        } catch (error) {

            console.error(
                "Like Short error:",
                error
            );

            showToast(
                "Unable to update like.",
                "error"
            );

        } finally {

            button.disabled = false;
        }
    }


    /* =====================================================
       SHARE SHORT
       ===================================================== */

    async function shareShort(short) {

        const title =
            short.title ||
            "Vibe Short";


        const text =
            short.content ||
            "";


        const shareData = {
            title,
            text
        };


        try {

            if (
                navigator.share
            ) {

                await navigator.share(
                    shareData
                );

                return;
            }


            await copyText(
                `${title}\n\n${text}`
            );


            showToast(
                "Short copied for sharing.",
                "success"
            );


        } catch (error) {

            if (
                error?.name ===
                "AbortError"
            ) {
                return;
            }


            console.error(
                "Share error:",
                error
            );

            showToast(
                "Unable to share this Short.",
                "error"
            );
        }
    }


    /* =====================================================
       COPY SHORT
       ===================================================== */

    async function copyShort(short) {

        const text =
            `${short.title || ""}\n\n${short.content || ""}`;


        try {

            await copyText(text);


            showToast(
                "Short copied to clipboard.",
                "success"
            );

        } catch (error) {

            console.error(
                "Copy error:",
                error
            );

            showToast(
                "Unable to copy Short.",
                "error"
            );
        }
    }


    /* =====================================================
       CREATE SHORT MODAL
       ===================================================== */

    function openCreateModal() {

        if (!createShortModal) {
            return;
        }


        createShortModal.classList.remove(
            "hidden"
        );


        document.body.classList.add(
            "modal-open"
        );


        if (shortTitle) {
            shortTitle.focus();
        }
    }


    function closeCreateShortModal() {

        if (!createShortModal) {
            return;
        }


        createShortModal.classList.add(
            "hidden"
        );


        document.body.classList.remove(
            "modal-open"
        );


        resetCreateForm();
    }


    /* =====================================================
       RESET CREATE FORM
       ===================================================== */

    function resetCreateForm() {

        if (createShortForm) {
            createShortForm.reset();
        }


        if (contentCharCount) {
            contentCharCount.textContent =
                "0";
        }


        if (imagePreview) {

            imagePreview.classList.add(
                "hidden"
            );
        }


        if (imagePreviewImg) {

            imagePreviewImg.src =
                "";
        }
    }


    /* =====================================================
       IMAGE PREVIEW
       ===================================================== */

    function updateImagePreview() {

        if (
            !shortImage ||
            !imagePreview ||
            !imagePreviewImg
        ) {
            return;
        }


        const url =
            shortImage.value.trim();


        if (!url) {

            imagePreview.classList.add(
                "hidden"
            );

            imagePreviewImg.src =
                "";

            return;
        }


        imagePreviewImg.src =
            url;


        imagePreview.classList.remove(
            "hidden"
        );


        imagePreviewImg.onerror =
            () => {

                imagePreview.classList.add(
                    "hidden"
                );

                showToast(
                    "Unable to load image preview.",
                    "error"
                );
            };
    }


    /* =====================================================
       CREATE SHORT
       ===================================================== */

    async function createShort() {

        if (isSubmittingShort) {
            return;
        }


        const title =
            shortTitle?.value.trim() ||
            "";


        const category =
            shortCategory?.value ||
            "education";


        const content =
            shortContent?.value.trim() ||
            "";


        const imageUrl =
            shortImage?.value.trim() ||
            "";


        if (!content) {

            showToast(
                "Please enter some content.",
                "error"
            );

            shortContent?.focus();

            return;
        }


        if (content.length > 1000) {

            showToast(
                "Content cannot exceed 1000 characters.",
                "error"
            );

            return;
        }


        if (title.length > 200) {

            showToast(
                "Title cannot exceed 200 characters.",
                "error"
            );

            return;
        }


        isSubmittingShort = true;


        try {

            const response =
                await apiRequest(
                    "/shorts",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            title:
                                title || null,

                            content,

                            category,

                            image_url:
                                imageUrl || null
                        })
                    }
                );


            const createdShort =
                response?.short ||
                response?.data ||
                response;


            closeCreateShortModal();


            showToast(
                "Your Short was published! 🚀",
                "success"
            );


            if (createdShort) {

                shorts.unshift(
                    createdShort
                );

                renderShorts();

            } else {

                await loadShorts();
            }


        } catch (error) {

            console.error(
                "Create Short error:",
                error
            );


            showToast(
                error?.message ||
                "Unable to create Short.",
                "error"
            );

        } finally {

            isSubmittingShort = false;
        }
    }


    /* =====================================================
       DELETE SHORT
       ===================================================== */

    async function deleteShort(short) {

        if (!short?.id) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this Short?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/shorts/${short.id}`,
                {
                    method: "DELETE"
                }
            );


            shorts =
                shorts.filter(
                    (item) =>
                        Number(item.id) !==
                        Number(short.id)
                );


            renderShorts();


            showToast(
                "Short deleted successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Delete Short error:",
                error
            );


            showToast(
                error?.message ||
                "Unable to delete Short.",
                "error"
            );
        }
    }


    /* =====================================================
       OPEN INTERACTIVE CHALLENGE
       ===================================================== */

    async function openChallenge(category) {

        if (
            !challengeCategories.includes(
                category
            )
        ) {
            return;
        }


        challengeCategory =
            category;


        challengeQuestions = [];

        challengeIndex = 0;

        challengeScore = 0;

        challengeAnswered = false;


        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "hidden"
        );


        document.body.classList.add(
            "modal-open"
        );


        showChallengeLoading();


        try {

            const response =
                await apiRequest(
                    `/quiz/questions?category=${encodeURIComponent(
                        category
                    )}&limit=5`
                );


            challengeQuestions =
                response?.questions ||
                response?.data ||
                response ||
                [];


            if (
                !Array.isArray(
                    challengeQuestions
                )
            ) {

                challengeQuestions =
                    [];
            }


            if (
                challengeQuestions.length ===
                0
            ) {

                showChallengeMessage(
                    "No challenges are available for this category yet."
                );

                return;
            }


            renderChallengeQuestion();


        } catch (error) {

            console.error(
                "Load challenge error:",
                error
            );


            showChallengeMessage(
                "Unable to load the challenge. Please try again."
            );
        }
    }


    /* =====================================================
       GET CHALLENGE MODAL
       ===================================================== */

    function getChallengeModal() {

        return document.getElementById(
            "challengeModal"
        );
    }


    /* =====================================================
       SHOW CHALLENGE LOADING
       ===================================================== */

    function showChallengeLoading() {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const title =
            modal.querySelector(
                ".challenge-title"
            );


        const body =
            modal.querySelector(
                ".challenge-body"
            );


        if (title) {

            title.textContent =
                getChallengeTitle(
                    challengeCategory
                );
        }


        if (body) {

            body.innerHTML = `
                <div class="challenge-loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading challenge...</p>
                </div>
            `;
        }
    }


    /* =====================================================
       RENDER CHALLENGE QUESTION
       ===================================================== */

    function renderChallengeQuestion() {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const question =
            challengeQuestions[
                challengeIndex
            ];


        if (!question) {

            finishChallenge();

            return;
        }


        challengeAnswered =
            false;


        const title =
            modal.querySelector(
                ".challenge-title"
            );


        const body =
            modal.querySelector(
                ".challenge-body"
            );


        const progress =
            modal.querySelector(
                ".challenge-progress"
            );


        const scoreElement =
            modal.querySelector(
                ".challenge-score"
            );


        if (title) {

            title.textContent =
                getChallengeTitle(
                    challengeCategory
                );
        }


        if (progress) {

            progress.textContent =
                `Question ${
                    challengeIndex + 1
                } of ${
                    challengeQuestions.length
                }`;
        }


        if (scoreElement) {

            scoreElement.textContent =
                `Score: ${challengeScore}`;
        }


        if (!body) {
            return;
        }


        const questionText =
            escapeHtml(
                question.question ||
                "Question unavailable."
            );


        const options = [
            {
                key: "A",
                value:
                    question.option_a
            },

            {
                key: "B",
                value:
                    question.option_b
            },

            {
                key: "C",
                value:
                    question.option_c
            },

            {
                key: "D",
                value:
                    question.option_d
            }
        ];


        body.innerHTML = `

            <div class="challenge-question">

                <div class="challenge-question-number">
                    ${challengeIndex + 1}
                </div>

                <h3>
                    ${questionText}
                </h3>

            </div>


            <div class="challenge-options">

                ${options
                    .map((option) => {

                        const value =
                            escapeHtml(
                                option.value ||
                                ""
                            );

                        return `
                            <button
                                type="button"
                                class="challenge-option"
                                data-option="${option.key}"
                            >

                                <span class="challenge-option-key">
                                    ${option.key}
                                </span>

                                <span class="challenge-option-text">
                                    ${value}
                                </span>

                            </button>
                        `;

                    })
                    .join("")}

            </div>


            <div
                class="challenge-feedback hidden"
                id="challengeFeedback"
            ></div>


            <div class="challenge-footer">

                <button
                    type="button"
                    class="challenge-submit-btn"
                    id="challengeSubmitBtn"
                    disabled
                >
                    Submit Answer
                </button>

            </div>
        `;


        setupChallengeQuestionEvents();
    }


    /* =====================================================
       SETUP QUESTION EVENTS
       ===================================================== */

    function setupChallengeQuestionEvents() {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const optionButtons =
            modal.querySelectorAll(
                ".challenge-option"
            );


        const submitButton =
            modal.querySelector(
                "#challengeSubmitBtn"
            );


        let selectedOption = null;


        optionButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            challengeAnswered
                        ) {
                            return;
                        }


                        optionButtons.forEach(
                            (item) => {

                                item.classList.remove(
                                    "selected"
                                );
                            }
                        );


                        button.classList.add(
                            "selected"
                        );


                        selectedOption =
                            button.dataset.option;


                        if (submitButton) {

                            submitButton.disabled =
                                false;
                        }
                    }
                );
            }
        );


        if (submitButton) {

            submitButton.addEventListener(
                "click",
                async () => {

                    if (
                        !selectedOption ||
                        challengeAnswered
                    ) {
                        return;
                    }


                    await submitChallengeAnswer(
                        selectedOption
                    );
                }
            );
        }
    }


    /* =====================================================
       SUBMIT CHALLENGE ANSWER
       ===================================================== */

    async function submitChallengeAnswer(
        selectedOption
    ) {

        const question =
            challengeQuestions[
                challengeIndex
            ];


        if (!question) {
            return;
        }


        challengeAnswered =
            true;


        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const submitButton =
            modal.querySelector(
                "#challengeSubmitBtn"
            );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Checking...
                `;
        }


        try {

            const response =
                await apiRequest(
                    "/quiz/answer",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            question_id:
                                question.id,

                            selected_option:
                                selectedOption
                        })
                    }
                );


            const result =
                response?.result ||
                response?.data ||
                response;


            const isCorrect =
                Boolean(
                    result?.is_correct
                );


            const points =
                Number(
                    result?.points_earned ??
                    0
                );


            const correctOption =
                result?.correct_option ||
                "";


            const explanation =
                result?.explanation ||
                "";


            if (isCorrect) {

                challengeScore +=
                    points;

            }


            showChallengeAnswer(
                selectedOption,
                correctOption,
                isCorrect,
                points,
                explanation
            );


        } catch (error) {

            console.error(
                "Submit challenge error:",
                error
            );


            challengeAnswered =
                false;


            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Submit Answer";
            }


            showToast(
                error?.message ||
                "Unable to submit answer.",
                "error"
            );
        }
    }


    /* =====================================================
       SHOW CHALLENGE ANSWER
       ===================================================== */

    function showChallengeAnswer(
        selectedOption,
        correctOption,
        isCorrect,
        points,
        explanation
    ) {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const optionButtons =
            modal.querySelectorAll(
                ".challenge-option"
            );


        optionButtons.forEach(
            (button) => {

                const option =
                    button.dataset.option;


                button.disabled =
                    true;


                if (
                    option === correctOption
                ) {

                    button.classList.add(
                        "correct"
                    );
                }


                if (
                    option === selectedOption &&
                    option !== correctOption
                ) {

                    button.classList.add(
                        "wrong"
                    );
                }
            }
        );


        const feedback =
            modal.querySelector(
                "#challengeFeedback"
            );


        if (feedback) {

            feedback.classList.remove(
                "hidden"
            );


            if (isCorrect) {

                feedback.className =
                    "challenge-feedback correct-feedback";


                feedback.innerHTML = `
                    <div class="challenge-feedback-icon">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>

                    <div>
                        <strong>Correct! 🎉</strong>

                        <p>
                            +${points} points
                        </p>

                        ${
                            explanation
                                ? `<small>${escapeHtml(
                                    explanation
                                )}</small>`
                                : ""
                        }
                    </div>
                `;

            } else {

                feedback.className =
                    "challenge-feedback wrong-feedback";


                feedback.innerHTML = `
                    <div class="challenge-feedback-icon">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </div>

                    <div>
                        <strong>Not quite.</strong>

                        ${
                            correctOption
                                ? `
                                    <p>
                                        Correct answer:
                                        <strong>
                                            ${escapeHtml(
                                                correctOption
                                            )}
                                        </strong>
                                    </p>
                                `
                                : ""
                        }

                        ${
                            explanation
                                ? `<small>${escapeHtml(
                                    explanation
                                )}</small>`
                                : ""
                        }
                    </div>
                `;
            }
        }


        const footer =
            modal.querySelector(
                ".challenge-footer"
            );


        if (footer) {

            footer.innerHTML = `

                <button
                    type="button"
                    class="challenge-next-btn"
                    id="challengeNextBtn"
                >
                    ${
                        challengeIndex <
                        challengeQuestions.length - 1
                            ? `
                                Next Question
                                <i class="fa-solid fa-arrow-right"></i>
                              `
                            : `
                                See Results
                                <i class="fa-solid fa-trophy"></i>
                              `
                    }
                </button>

            `;


            const nextButton =
                footer.querySelector(
                    "#challengeNextBtn"
                );


            if (nextButton) {

                nextButton.addEventListener(
                    "click",
                    () => {

                        if (
                            challengeIndex <
                            challengeQuestions.length - 1
                        ) {

                            challengeIndex++;

                            renderChallengeQuestion();

                        } else {

                            finishChallenge();
                        }
                    }
                );
            }
        }


        const scoreElement =
            modal.querySelector(
                ".challenge-score"
            );


        if (scoreElement) {

            scoreElement.textContent =
                `Score: ${challengeScore}`;
        }
    }


    /* =====================================================
       FINISH CHALLENGE
       ===================================================== */

    function finishChallenge() {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const title =
            modal.querySelector(
                ".challenge-title"
            );


        const progress =
            modal.querySelector(
                ".challenge-progress"
            );


        const scoreElement =
            modal.querySelector(
                ".challenge-score"
            );


        const body =
            modal.querySelector(
                ".challenge-body"
            );


        if (title) {

            title.textContent =
                "Challenge Complete! 🎉";
        }


        if (progress) {

            progress.textContent =
                "Completed";
        }


        if (scoreElement) {

            scoreElement.textContent =
                `Final Score: ${challengeScore}`;
        }


        if (!body) {
            return;
        }


        const totalQuestions =
            challengeQuestions.length;


        body.innerHTML = `

            <div class="challenge-result">

                <div class="challenge-result-icon">

                    <i class="fa-solid fa-trophy"></i>

                </div>


                <h2>
                    ${
                        challengeScore > 0
                            ? "Great job! 🔥"
                            : "Keep practicing! 💪"
                    }
                </h2>


                <p>
                    You completed the
                    ${getChallengeTitle(
                        challengeCategory
                    )}
                    challenge.
                </p>


                <div class="challenge-result-stats">

                    <div class="challenge-stat">

                        <strong>
                            ${challengeScore}
                        </strong>

                        <span>
                            Points
                        </span>

                    </div>


                    <div class="challenge-stat">

                        <strong>
                            ${totalQuestions}
                        </strong>

                        <span>
                            Questions
                        </span>

                    </div>

                </div>


                <div class="challenge-result-actions">

                    <button
                        type="button"
                        class="challenge-retry-btn"
                        id="challengeRetryBtn"
                    >
                        <i class="fa-solid fa-rotate-right"></i>
                        Try Again
                    </button>


                    <button
                        type="button"
                        class="challenge-close-result-btn"
                        id="challengeCloseResultBtn"
                    >
                        Done
                    </button>

                </div>

            </div>
        `;


        const retryButton =
            body.querySelector(
                "#challengeRetryBtn"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                async () => {

                    await openChallenge(
                        challengeCategory
                    );
                }
            );
        }


        const closeButton =
            body.querySelector(
                "#challengeCloseResultBtn"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => {

                    closeChallengeModal();

                }
            );
        }
    }


    /* =====================================================
       CHALLENGE TITLE
       ===================================================== */

    function getChallengeTitle(
        category
    ) {

        switch (category) {

            case "aptitude":
                return "Aptitude Challenge";

            case "coding":
                return "Coding Challenge";

            case "riddle":
                return "Riddle Challenge";

            default:
                return "Challenge";
        }
    }


    /* =====================================================
       SHOW CHALLENGE MESSAGE
       ===================================================== */

    function showChallengeMessage(
        message
    ) {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        const body =
            modal.querySelector(
                ".challenge-body"
            );


        if (!body) {
            return;
        }


        body.innerHTML = `

            <div class="challenge-message">

                <div class="challenge-message-icon">

                    <i class="fa-solid fa-circle-info"></i>

                </div>

                <p>
                    ${escapeHtml(message)}
                </p>

                <button
                    type="button"
                    id="challengeMessageClose"
                    class="challenge-close-result-btn"
                >
                    Close
                </button>

            </div>

        `;


        const closeButton =
            body.querySelector(
                "#challengeMessageClose"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => {

                    closeChallengeModal();

                }
            );
        }
    }


    /* =====================================================
       CLOSE CHALLENGE MODAL
       ===================================================== */

    function closeChallengeModal() {

        const modal =
            getChallengeModal();


        if (!modal) {
            return;
        }


        modal.classList.add(
            "hidden"
        );


        document.body.classList.remove(
            "modal-open"
        );


        challengeQuestions = [];

        challengeIndex = 0;

        challengeScore = 0;

        challengeCategory = "";

        challengeAnswered = false;
    }


    /* =====================================================
       UI HELPERS
       ===================================================== */

    function showShortsLoading(show) {

        if (!shortsLoading) {
            return;
        }


        if (show) {

            shortsLoading.classList.remove(
                "hidden"
            );

        } else {

            shortsLoading.classList.add(
                "hidden"
            );
        }
    }


    function showShortsEmpty() {

        if (!shortsEmpty) {
            return;
        }


        shortsEmpty.classList.remove(
            "hidden"
        );
    }


    function hideShortsEmpty() {

        if (!shortsEmpty) {
            return;
        }


        shortsEmpty.classList.add(
            "hidden"
        );
    }


    function showShortsError(
        message
    ) {

        if (!shortsGrid) {
            return;
        }


        shortsGrid.innerHTML = `

            <div class="shorts-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

                <button
                    type="button"
                    id="retryShortsBtn"
                >
                    <i class="fa-solid fa-rotate-right"></i>
                    Try Again
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryShortsBtn"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                async () => {

                    await loadShorts();

                }
            );
        }
    }


    function updateShortsCount(
        count
    ) {

        if (!shortsCount) {
            return;
        }


        shortsCount.textContent =
            `${count} ${
                count === 1
                    ? "Short"
                    : "Shorts"
            }`;
    }


    /* =====================================================
       DATE FORMAT
       ===================================================== */

    function formatShortDate(
        dateValue
    ) {

        if (!dateValue) {
            return "Just now";
        }


        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Just now";
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


        if (seconds < 60) {
            return "Just now";
        }


        const minutes =
            Math.floor(
                seconds / 60
            );


        if (minutes < 60) {

            return `${minutes}m ago`;
        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours < 24) {

            return `${hours}h ago`;
        }


        const days =
            Math.floor(
                hours / 24
            );


        if (days < 7) {

            return `${days}d ago`;
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

    /* =====================================================
       GLOBAL DATE FALLBACK
       ===================================================== */

    if (
        typeof window.formatPostDate !==
        "function"
    ) {

        window.formatPostDate =
            formatShortDate;
    }


    /* =====================================================
       TEXT HELPERS
       ===================================================== */

    function escapeHtml(
        value
    ) {

        if (
            typeof value ===
            "undefined" ||
            value === null
        ) {
            return "";
        }


        if (
            typeof window.escapeHtml ===
            "function"
        ) {

            return window.escapeHtml(
                String(value)
            );
        }


        return String(value)
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


    function getInitials(
        name
    ) {

        const words =
            String(name)
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (!words.length) {
            return "U";
        }


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


    async function copyText(
        text
    ) {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            return;
        }


        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        const successful =
            document.execCommand(
                "copy"
            );


        textarea.remove();


        if (!successful) {

            throw new Error(
                "Copy failed."
            );
        }
    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(
        message,
        type = "info"
    ) {

        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message,
                type
            );

            return;
        }


        if (!toastContainer) {

            console.log(
                `[${type}] ${message}`
            );

            return;
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `toast toast-${type}`;


        const icon =
            type === "success"
                ? "fa-circle-check"
                : type === "error"
                    ? "fa-circle-exclamation"
                    : "fa-circle-info";


        toast.innerHTML = `

            <i class="fa-solid ${icon}"></i>

            <span>
                ${escapeHtml(message)}
            </span>

        `;


        toastContainer.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.classList.add(
                    "toast-hide"
                );


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            3000
        );
    }

});