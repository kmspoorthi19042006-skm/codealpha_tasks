/* =========================================================
   VIBE — FEED JAVASCRIPT
   Connects the frontend to the Express + MySQL API
========================================================= */

let currentUser = null;
let activeCommentPostId = null;
let searchTimeout = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    requireAuth();

    enablePageTransition();

    setupEventListeners();

    setupCharacterCounter(
        document.getElementById("postContent"),
        document.getElementById("characterCount"),
        2000
    );

    await initializeFeed();
});


/* =========================================================
   INITIALIZE USER + FEED
========================================================= */

async function initializeFeed() {

    try {

        const storedUser =
            localStorage.getItem("social_user");

        if (storedUser) {
            currentUser = JSON.parse(storedUser);
        }

        /*
         * Get the authenticated user from backend.
         */
        const response =
            await getCurrentUser();

        currentUser =
            response.user ||
            response.data ||
            response;

        localStorage.setItem(
            "social_user",
            JSON.stringify(currentUser)
        );

        /*
         * Update all user information
         * in the interface.
         */
        updateUserInterface();

        /*
         * Load posts.
         */
        await loadFeed();

        /*
         * IMPORTANT:
         * Load the real profile statistics
         * from the database.
         */
        await refreshProfileStats();

    } catch (error) {

        console.error(
            "Feed initialization error:",
            error
        );

        showToast(
            error.message ||
            "Unable to load your feed.",
            "error"
        );
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* -----------------------------------------------------
       CREATE POST
    ----------------------------------------------------- */

    const createPostForm =
        document.getElementById(
            "createPostForm"
        );

    createPostForm?.addEventListener(
        "submit",
        handleCreatePost
    );


    /* -----------------------------------------------------
       CLEAR COMPOSER
    ----------------------------------------------------- */

    document
        .getElementById("clearPostBtn")
        ?.addEventListener(
            "click",
            clearComposer
        );


    /* -----------------------------------------------------
       SIDEBAR CREATE
    ----------------------------------------------------- */

    document
        .getElementById("sidebarCreateBtn")
        ?.addEventListener(
            "click",
            focusComposer
        );


    /* -----------------------------------------------------
       EMPTY STATE CREATE
    ----------------------------------------------------- */

    document
        .getElementById("emptyCreateBtn")
        ?.addEventListener(
            "click",
            focusComposer
        );


    /* -----------------------------------------------------
       REFRESH
    ----------------------------------------------------- */

    document
        .getElementById("refreshBtn")
        ?.addEventListener(
            "click",
            handleRefresh
        );


    /* -----------------------------------------------------
       SEARCH
    ----------------------------------------------------- */

    document
        .getElementById("searchNavBtn")
        ?.addEventListener(
            "click",
            openSearch
        );

    document
        .getElementById("sideSearchBtn")
        ?.addEventListener(
            "click",
            openSearch
        );

    document
        .getElementById("mobileSearchBtn")
        ?.addEventListener(
            "click",
            openSearch
        );

    document
        .getElementById("closeSearchBtn")
        ?.addEventListener(
            "click",
            closeSearch
        );


    /* -----------------------------------------------------
       SEARCH INPUT
    ----------------------------------------------------- */

    document
        .getElementById("userSearchInput")
        ?.addEventListener(
            "input",
            handleSearchInput
        );


    /* -----------------------------------------------------
       PROFILE
    ----------------------------------------------------- */

    document
        .getElementById("profileNavLink")
        ?.addEventListener(
            "click",
            goToMyProfile
        );

    document
        .getElementById("sidebarProfileBtn")
        ?.addEventListener(
            "click",
            goToMyProfile
        );

    document
        .getElementById("mobileProfileBtn")
        ?.addEventListener(
            "click",
            goToMyProfile
        );

    document
        .getElementById("viewProfileBtn")
        ?.addEventListener(
            "click",
            goToMyProfile
        );


    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            handleLogout
        );


    /* -----------------------------------------------------
       COMMENTS
    ----------------------------------------------------- */

    document
        .getElementById("closeCommentModal")
        ?.addEventListener(
            "click",
            closeCommentModal
        );

    document
        .getElementById("commentForm")
        ?.addEventListener(
            "submit",
            handleAddComment
        );


    /* -----------------------------------------------------
       CLOSE COMMENT MODAL WHEN CLICKING OUTSIDE
    ----------------------------------------------------- */

    document
        .getElementById("commentModal")
        ?.addEventListener(
            "click",
            (event) => {

                if (
                    event.target.id ===
                    "commentModal"
                ) {
                    closeCommentModal();
                }
            }
        );


    /* -----------------------------------------------------
       ESCAPE KEY
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeSearch();

                closeCommentModal();

                closeAllPostMenus();
            }
        }
    );
}


/* =========================================================
   USER INTERFACE
========================================================= */

function updateUserInterface() {

    if (!currentUser) {
        return;
    }

    const name =
        currentUser.name || "User";

    const username =
        currentUser.username || "username";

    const initials =
        getInitials(name);


    /* -----------------------------------------------------
       SIDEBAR
    ----------------------------------------------------- */

    setText(
        "sidebarUserName",
        name
    );

    setText(
        "sidebarUsername",
        `@${username}`
    );

    setText(
        "sidebarAvatarText",
        initials
    );


    /* -----------------------------------------------------
       COMPOSER
    ----------------------------------------------------- */

    setText(
        "composerName",
        `Share something, ${name.split(" ")[0]}`
    );

    setText(
        "composerAvatarText",
        initials
    );


    /* -----------------------------------------------------
       MOBILE
    ----------------------------------------------------- */

    setText(
        "mobileAvatarText",
        initials
    );


    /* -----------------------------------------------------
       RIGHT SIDEBAR
    ----------------------------------------------------- */

    setText(
        "rightUserName",
        name
    );

    setText(
        "rightUsername",
        `@${username}`
    );

    setText(
        "rightAvatarText",
        initials
    );


    /* -----------------------------------------------------
       PROFILE LINK
    ----------------------------------------------------- */

    if (currentUser.id) {

        const profileUrl =
            `profile.html?id=${currentUser.id}`;

        const profileLink =
            document.getElementById(
                "profileNavLink"
            );

        if (profileLink) {
            profileLink.href =
                profileUrl;
        }
    }
}


/* =========================================================
   LOAD FEED
========================================================= */

async function loadFeed() {

    const postsList =
        document.getElementById(
            "postsList"
        );

    const loading =
        document.getElementById(
            "feedLoading"
        );

    const empty =
        document.getElementById(
            "feedEmpty"
        );


    if (!postsList || !loading || !empty) {
        return;
    }


    loading.hidden = false;

    empty.hidden = true;


    try {

        const response =
            await getFeed();


        const posts =
            response.posts ||
            response.data?.posts ||
            response.data ||
            response;


        loading.hidden = true;


        if (
            !Array.isArray(posts) ||
            posts.length === 0
        ) {

            postsList.innerHTML = "";

            empty.hidden = false;

            updateProfileCounts([]);

            return;
        }


        postsList.innerHTML =
            posts
                .map(
                    (post, index) =>
                        renderPost(
                            post,
                            index
                        )
                )
                .join("");


        updateProfileCounts(
            posts
        );

        animatePosts();

    } catch (error) {

        loading.hidden = true;

        postsList.innerHTML = `
            <div class="feed-loading">
                <p>
                    Unable to load posts.
                    Please try refreshing.
                </p>
            </div>
        `;

        showToast(
            error.message ||
            "Failed to load feed.",
            "error"
        );
    }
}


/* =========================================================
   RENDER POST
========================================================= */

function renderPost(
    post,
    index = 0
) {

    const authorName =
        post.name ||
        post.author_name ||
        "User";

    const username =
        post.username ||
        "username";

    const content =
        post.content ||
        "";

    const imageUrl =
        post.image_url ||
        "";


    const initials =
        getInitials(
            authorName
        );


    const likeCount =
        Number(
            post.like_count || 0
        );


    const commentCount =
        Number(
            post.comment_count || 0
        );


    const liked =
        Boolean(
            post.liked_by_me ||
            post.likedByMe
        );


    /*
     * Check whether this is our own post.
     */
    const isOwner =
        Number(post.user_id) ===
        Number(currentUser?.id);


    /*
     * Follow status comes from backend.
     */
    const following =
        Boolean(
            post.following_by_me ||
            post.followingByMe
        );


    const postDate =
        formatPostDate(
            post.created_at ||
            post.createdAt
        );


    return `
        <article
            class="post-card"
            data-post-id="${post.id}"
            style="
                animation-delay:
                ${Math.min(index * 45, 300)}ms
            "
        >

            <!-- =========================================
                 POST HEADER
            ========================================== -->

            <div class="post-header">

                <!-- Avatar -->

                <button
                    class="avatar avatar-md"
                    type="button"
                    onclick="openUserProfile(${post.user_id})"
                    aria-label="View profile"
                >
                    <span>
                        ${escapeHTML(initials)}
                    </span>
                </button>


                <!-- Author -->

                <button
                    class="post-author"
                    type="button"
                    onclick="openUserProfile(${post.user_id})"
                    style="
                        border:0;
                        background:none;
                        padding:0;
                        text-align:left;
                        cursor:pointer;
                    "
                >

                    <strong>
                        ${escapeHTML(authorName)}
                    </strong>

                    <span>
                        @${escapeHTML(username)}
                    </span>

                </button>


                <!-- Time -->

                <span class="post-time">
                    ${escapeHTML(postDate)}
                </span>


                <!-- =====================================
                     FOLLOW BUTTON
                ====================================== -->

                ${
                    !isOwner
                    ? `
                        <button
                            type="button"
                            class="
                                follow-btn
                                ${following ? "following" : ""}
                            "
                            id="follow-btn-${post.user_id}"
                            onclick="handleFollow(${post.user_id})"
                        >
                            ${
                                following
                                    ? "Following"
                                    : "Follow"
                            }
                        </button>
                    `
                    : ""
                }


                <!-- =====================================
                     OWNER MENU
                ====================================== -->

                ${
                    isOwner
                    ? `
                        <div class="post-menu">

                            <button
                                class="post-menu-btn"
                                type="button"
                                onclick="togglePostMenu(${post.id})"
                                aria-label="Post options"
                            >
                                •••
                            </button>


                            <div
                                class="post-dropdown"
                                id="post-menu-${post.id}"
                                hidden
                            >

                                <button
                                    type="button"
                                    class="delete-action"
                                    onclick="handleDeletePost(${post.id})"
                                >
                                    Delete post
                                </button>

                            </div>

                        </div>
                    `
                    : ""
                }

            </div>


            <!-- =========================================
                 POST CONTENT
            ========================================== -->

            <div class="post-content">
                ${escapeHTML(content)}
            </div>


            <!-- =========================================
                 POST IMAGE
            ========================================== -->

            ${
                imageUrl
                ? `
                    <img
                        class="post-image"
                        src="${escapeHTML(imageUrl)}"
                        alt="Post image"
                        loading="lazy"
                        onerror="
                            this.style.display='none'
                        "
                    >
                `
                : ""
            }


            <!-- =========================================
                 POST STATS
            ========================================== -->

            <div class="post-stats">

                <span>

                    <span>♡</span>

                    <span
                        id="like-count-${post.id}"
                    >
                        ${likeCount}
                    </span>

                    ${
                        likeCount === 1
                            ? "like"
                            : "likes"
                    }

                </span>


                <span>

                    <span>💬</span>

                    <span
                        id="comment-count-${post.id}"
                    >
                        ${commentCount}
                    </span>

                    ${
                        commentCount === 1
                            ? "comment"
                            : "comments"
                    }

                </span>

            </div>


            <!-- =========================================
                 POST ACTIONS
            ========================================== -->

            <div class="post-actions">

                <!-- LIKE -->

                <button
                    type="button"
                    class="
                        post-action-btn
                        ${liked ? "liked" : ""}
                    "
                    id="like-btn-${post.id}"
                    onclick="handleLike(${post.id})"
                >

                    <span class="action-icon">
                        ${liked ? "♥" : "♡"}
                    </span>

                    <span>
                        ${liked ? "Liked" : "Like"}
                    </span>

                </button>


                <!-- COMMENT -->

                <button
                    type="button"
                    class="post-action-btn"
                    onclick="openCommentModal(${post.id})"
                >

                    <span class="action-icon">
                        ♧
                    </span>

                    <span>
                        Comment
                    </span>

                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   CREATE POST
========================================================= */

async function handleCreatePost(
    event
) {

    event.preventDefault();


    const textarea =
        document.getElementById(
            "postContent"
        );

    const publishBtn =
        document.getElementById(
            "publishBtn"
        );


    const content =
        textarea.value.trim();


    if (!content) {

        showToast(
            "Write something before publishing.",
            "warning"
        );

        textarea.focus();

        return;
    }


    if (content.length > 2000) {

        showToast(
            "Your post is too long.",
            "warning"
        );

        return;
    }


    try {

        setButtonLoading(
            publishBtn,
            true,
            "Publishing..."
        );


        await createPost(
            content
        );


        textarea.value = "";

        textarea.dispatchEvent(
            new Event("input")
        );


        showToast(
            "Your post is live ✦",
            "success"
        );


        await loadFeed();

        await refreshProfileStats();

    } catch (error) {

        showToast(
            error.message ||
            "Unable to publish your post.",
            "error"
        );

    } finally {

        setButtonLoading(
            publishBtn,
            false,
            "Publish"
        );
    }
}


/* =========================================================
   CLEAR COMPOSER
========================================================= */

function clearComposer() {

    const textarea =
        document.getElementById(
            "postContent"
        );

    if (!textarea) {
        return;
    }


    textarea.value = "";

    textarea.dispatchEvent(
        new Event("input")
    );

    textarea.focus();
}


/* =========================================================
   FOCUS COMPOSER
========================================================= */

function focusComposer() {

    const composer =
        document.getElementById(
            "composerCard"
        );

    const textarea =
        document.getElementById(
            "postContent"
        );


    composer?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    setTimeout(() => {

        textarea?.focus();

    }, 350);
}


/* =========================================================
   LIKE / UNLIKE
========================================================= */

async function handleLike(
    postId
) {

    const button =
        document.getElementById(
            `like-btn-${postId}`
        );

    const countElement =
        document.getElementById(
            `like-count-${postId}`
        );


    if (!button || !countElement) {
        return;
    }


    button.disabled = true;


    try {

        const response =
            await toggleLike(
                postId
            );


        const liked =
            Boolean(
                response.liked ??
                response.isLiked ??
                response.data?.liked
            );


        const currentCount =
            Number(
                countElement.textContent
            ) || 0;


        let count;


        if (
            response.like_count !== undefined
        ) {

            count =
                Number(
                    response.like_count
                );

        } else if (
            response.likeCount !== undefined
        ) {

            count =
                Number(
                    response.likeCount
                );

        } else if (
            response.data?.like_count !== undefined
        ) {

            count =
                Number(
                    response.data.like_count
                );

        } else {

            count =
                liked
                    ? currentCount + 1
                    : Math.max(
                        0,
                        currentCount - 1
                    );
        }


        updateLikeUI(
            postId,
            liked,
            count
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to update like.",
            "error"
        );

    } finally {

        button.disabled = false;
    }
}


/* =========================================================
   UPDATE LIKE UI
========================================================= */

function updateLikeUI(
    postId,
    liked,
    count
) {

    const button =
        document.getElementById(
            `like-btn-${postId}`
        );

    const countElement =
        document.getElementById(
            `like-count-${postId}`
        );


    if (button) {

        button.classList.toggle(
            "liked",
            liked
        );


        button.innerHTML = `
            <span class="action-icon">
                ${liked ? "♥" : "♡"}
            </span>

            <span>
                ${liked ? "Liked" : "Like"}
            </span>
        `;
    }


    if (countElement) {

        countElement.textContent =
            count;


        const parent =
            countElement.parentElement;


        if (parent) {

            const suffix =
                count === 1
                    ? "like"
                    : "likes";


            parent.lastChild.textContent =
                suffix;
        }
    }
}


/* =========================================================
   FOLLOW / UNFOLLOW
========================================================= */

async function handleFollow(
    userId
) {

    const button =
        document.getElementById(
            `follow-btn-${userId}`
        );


    if (!button) {
        return;
    }


    button.disabled = true;


    try {

        const response =
            await toggleFollow(
                userId
            );


        const following =
            Boolean(
                response.following ??
                response.isFollowing ??
                response.data?.following ??
                response.data?.isFollowing
            );


        /*
         * Update button immediately.
         */

        button.classList.toggle(
            "following",
            following
        );


        button.textContent =
            following
                ? "Following"
                : "Follow";


        /*
         * IMPORTANT:
         * Refresh the feed so the Follow
         * state comes from the database.
         */
        await loadFeed();


        /*
         * IMPORTANT:
         * Refresh the right-side profile
         * statistics from the database.
         */
        await refreshProfileStats();


        showToast(
            following
                ? "You are now following this user."
                : "You unfollowed this user.",
            "success"
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to update follow status.",
            "error"
        );

    } finally {

        /*
         * The feed was re-rendered, so the
         * old button may no longer exist.
         * This is safe because we check it.
         */

        const newButton =
            document.getElementById(
                `follow-btn-${userId}`
            );

        if (newButton) {
            newButton.disabled = false;
        }
    }
}


/* =========================================================
   REFRESH RIGHT-SIDE PROFILE STATISTICS
========================================================= */

async function refreshProfileStats() {

    if (!currentUser?.id) {
        return;
    }


    try {

        /*
         * Ask the backend for the authenticated
         * user's latest profile information.
         *
         * This gives us the real database values
         * for posts, followers and following.
         */

        const response =
            await getUserProfile(
                currentUser.id
            );


        /*
         * Support different backend response
         * structures.
         */

        const profile =
            response.user ||
            response.profile ||
            response.data?.user ||
            response.data?.profile ||
            response.data ||
            response;


        /*
         * Extract database counts.
         */

        const postsCount =
            Number(
                profile.posts_count ??
                profile.postsCount ??
                0
            );


        const followersCount =
            Number(
                profile.followers_count ??
                profile.followersCount ??
                0
            );


        const followingCount =
            Number(
                profile.following_count ??
                profile.followingCount ??
                0
            );


        /*
         * Update right-side profile card.
         */

        setText(
            "rightPostsCount",
            postsCount
        );


        setText(
            "rightFollowersCount",
            followersCount
        );


        setText(
            "rightFollowingCount",
            followingCount
        );


        /*
         * Also update stored user information
         * if the backend returned useful data.
         */

        currentUser = {
            ...currentUser,
            ...profile
        };


        localStorage.setItem(
            "social_user",
            JSON.stringify(currentUser)
        );


    } catch (error) {

        console.error(
            "Unable to refresh profile statistics:",
            error
        );
    }
}


/* =========================================================
   POST MENU
========================================================= */

function togglePostMenu(
    postId
) {

    const menu =
        document.getElementById(
            `post-menu-${postId}`
        );


    if (!menu) {
        return;
    }


    document
        .querySelectorAll(
            ".post-dropdown"
        )
        .forEach(
            (item) => {

                if (item !== menu) {
                    item.hidden = true;
                }

            }
        );


    menu.hidden =
        !menu.hidden;
}


/* =========================================================
   CLOSE ALL POST MENUS
========================================================= */

function closeAllPostMenus() {

    document
        .querySelectorAll(
            ".post-dropdown"
        )
        .forEach(
            (menu) => {

                menu.hidden = true;

            }
        );
}


/* =========================================================
   DELETE POST
========================================================= */

async function handleDeletePost(
    postId
) {

    const confirmed =
        window.confirm(
            "Delete this post? This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    try {

        await deletePost(
            postId
        );


        const card =
            document.querySelector(
                `[data-post-id="${postId}"]`
            );


        if (card) {

            card.style.opacity =
                "0";

            card.style.transform =
                "translateY(-8px) scale(.98)";

            card.style.transition =
                "all 220ms ease";


            setTimeout(
                async () => {

                    card.remove();


                    const remaining =
                        document.querySelectorAll(
                            ".post-card"
                        ).length;


                    if (remaining === 0) {

                        document.getElementById(
                            "feedEmpty"
                        ).hidden = false;
                    }


                    await refreshProfileStats();

                },
                220
            );
        }


        showToast(
            "Post deleted.",
            "success"
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to delete your post.",
            "error"
        );
    }
}


/* =========================================================
   COMMENTS
========================================================= */

async function openCommentModal(
    postId
) {

    activeCommentPostId =
        postId;


    const modal =
        document.getElementById(
            "commentModal"
        );

    const list =
        document.getElementById(
            "commentsList"
        );


    if (!modal || !list) {
        return;
    }


    modal.hidden = false;

    document.body.style.overflow =
        "hidden";


    list.innerHTML = `
        <div class="feed-loading">

            <div class="loading-spinner"></div>

            <p>
                Loading comments...
            </p>

        </div>
    `;


    try {

        await loadComments(
            postId
        );

    } catch (error) {

        list.innerHTML = `
            <div class="search-empty">
                Unable to load comments.
            </div>
        `;


        showToast(
            error.message ||
            "Unable to load comments.",
            "error"
        );
    }


    setTimeout(
        () => {

            document
                .getElementById(
                    "commentInput"
                )
                ?.focus();

        },
        200
    );
}


/* =========================================================
   LOAD COMMENTS
========================================================= */

async function loadComments(
    postId
) {

    const list =
        document.getElementById(
            "commentsList"
        );


    const response =
        await getComments(
            postId
        );


    const comments =
        response.comments ||
        response.data?.comments ||
        response.data ||
        response;


    if (
        !Array.isArray(comments) ||
        comments.length === 0
    ) {

        list.innerHTML = `
            <div class="search-empty">
                No comments yet.
                Start the conversation.
            </div>
        `;

        return;
    }


    list.innerHTML =
        comments
            .map(renderComment)
            .join("");
}


/* =========================================================
   RENDER COMMENT
========================================================= */

function renderComment(
    comment
) {

    const name =
        comment.name ||
        comment.user_name ||
        "User";


    const username =
        comment.username ||
        "username";


    const content =
        comment.content ||
        "";


    const initials =
        getInitials(
            name
        );


    const isOwner =
        Number(comment.user_id) ===
        Number(currentUser?.id);


    const date =
        formatPostDate(
            comment.created_at ||
            comment.createdAt
        );


    return `
        <div
            class="comment-item"
            data-comment-id="${comment.id}"
        >

            <div class="avatar avatar-sm">

                <span>
                    ${escapeHTML(initials)}
                </span>

            </div>


            <div class="comment-body">

                <div class="comment-body-header">

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span>
                        @${escapeHTML(username)}
                    </span>

                    <span>
                        • ${escapeHTML(date)}
                    </span>

                </div>


                <div class="comment-text">
                    ${escapeHTML(content)}
                </div>

            </div>


            ${
                isOwner
                    ? `
                        <button
                            class="comment-delete"
                            type="button"
                            onclick="handleDeleteComment(${comment.id})"
                        >
                            Delete
                        </button>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   ADD COMMENT
========================================================= */

async function handleAddComment(
    event
) {

    event.preventDefault();


    if (!activeCommentPostId) {
        return;
    }


    const postId =
        activeCommentPostId;


    const input =
        document.getElementById(
            "commentInput"
        );

    const button =
        document.getElementById(
            "commentSubmitBtn"
        );


    if (!input) {
        return;
    }


    const content =
        input.value.trim();


    if (!content) {

        input.focus();

        return;
    }


    if (content.length > 500) {

        showToast(
            "Comment cannot exceed 500 characters.",
            "warning"
        );

        return;
    }


    try {

        setButtonLoading(
            button,
            true,
            "Sending..."
        );


        await addComment(
            postId,
            content
        );


        input.value = "";


        await loadComments(
            postId
        );


        await refreshCommentCount(
            postId
        );


        showToast(
            "Comment added.",
            "success"
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to add comment.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Send"
        );
    }
}


/* =========================================================
   DELETE COMMENT
========================================================= */

async function handleDeleteComment(
    commentId
) {

    const confirmed =
        window.confirm(
            "Delete this comment?"
        );


    if (!confirmed) {
        return;
    }


    const postId =
        activeCommentPostId;


    try {

        await deleteComment(
            commentId
        );


        const item =
            document.querySelector(
                `[data-comment-id="${commentId}"]`
            );


        if (item) {
            item.remove();
        }


        if (postId) {

            await refreshCommentCount(
                postId
            );
        }


        const remaining =
            document.querySelectorAll(
                "#commentsList .comment-item"
            ).length;


        if (remaining === 0) {

            document.getElementById(
                "commentsList"
            ).innerHTML = `
                <div class="search-empty">
                    No comments yet.
                    Start the conversation.
                </div>
            `;
        }


        showToast(
            "Comment deleted.",
            "success"
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to delete comment.",
            "error"
        );
    }
}


/* =========================================================
   REFRESH COMMENT COUNT
========================================================= */

async function refreshCommentCount(
    postId
) {

    try {

        const response =
            await getFeed();


        const posts =
            response.posts ||
            response.data?.posts ||
            response.data ||
            response;


        if (!Array.isArray(posts)) {
            return;
        }


        const currentPost =
            posts.find(
                post =>
                    Number(post.id) ===
                    Number(postId)
            );


        if (!currentPost) {
            return;
        }


        const actualCount =
            Number(
                currentPost.comment_count || 0
            );


        updateCommentCount(
            postId,
            actualCount,
            true
        );

    } catch (error) {

        console.error(
            "Unable to refresh comment count:",
            error
        );
    }
}


/* =========================================================
   UPDATE COMMENT COUNT
========================================================= */

function updateCommentCount(
    postId,
    value,
    absolute = false
) {

    const countElement =
        document.getElementById(
            `comment-count-${postId}`
        );


    if (!countElement) {
        return;
    }


    const current =
        Number(
            countElement.textContent || 0
        );


    const updated =
        absolute
            ? Number(value)
            : Math.max(
                0,
                current + Number(value)
            );


    countElement.textContent =
        updated;


    const parent =
        countElement.parentElement;


    if (parent) {

        parent.lastChild.textContent =
            updated === 1
                ? "comment"
                : "comments";
    }
}


/* =========================================================
   CLOSE COMMENT MODAL
========================================================= */

function closeCommentModal() {

    const modal =
        document.getElementById(
            "commentModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;


    document.body.style.overflow =
        "";


    activeCommentPostId =
        null;


    const input =
        document.getElementById(
            "commentInput"
        );


    if (input) {
        input.value = "";
    }
}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {

    const panel =
        document.getElementById(
            "searchPanel"
        );

    const input =
        document.getElementById(
            "userSearchInput"
        );


    if (!panel) {
        return;
    }


    panel.hidden = false;


    setTimeout(
        () => {
            input?.focus();
        },
        150
    );


    panel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================================================
   CLOSE SEARCH
========================================================= */

function closeSearch() {

    const panel =
        document.getElementById(
            "searchPanel"
        );


    if (!panel) {
        return;
    }


    panel.hidden = true;


    const input =
        document.getElementById(
            "userSearchInput"
        );


    if (input) {
        input.value = "";
    }


    const results =
        document.getElementById(
            "searchResults"
        );


    if (results) {
        results.innerHTML = "";
    }
}


/* =========================================================
   SEARCH INPUT
========================================================= */

function handleSearchInput(
    event
) {

    const query =
        event.target.value.trim();


    clearTimeout(
        searchTimeout
    );


    if (query.length < 2) {

        const results =
            document.getElementById(
                "searchResults"
            );

        if (results) {
            results.innerHTML = "";
        }

        return;
    }


    searchTimeout =
        setTimeout(
            () => {
                performUserSearch(
                    query
                );
            },
            300
        );
}


/* =========================================================
   PERFORM SEARCH
========================================================= */

async function performUserSearch(
    query
) {

    const results =
        document.getElementById(
            "searchResults"
        );


    if (!results) {
        return;
    }


    results.innerHTML = `
        <div class="search-empty">
            Searching...
        </div>
    `;


    try {

        const response =
            await searchUsers(
                query
            );


        const users =
            response.users ||
            response.data?.users ||
            response.data ||
            response;


        if (
            !Array.isArray(users) ||
            users.length === 0
        ) {

            results.innerHTML = `
                <div class="search-empty">
                    No people found for
                    "${escapeHTML(query)}"
                </div>
            `;

            return;
        }


        results.innerHTML =
            users
                .map(
                    renderSearchUser
                )
                .join("");


    } catch (error) {

        results.innerHTML = `
            <div class="search-empty">
                Search failed.
            </div>
        `;


        console.error(
            "User search error:",
            error
        );
    }
}


/* =========================================================
   RENDER SEARCH USER
========================================================= */

function renderSearchUser(
    user
) {

    const name =
        user.name ||
        "User";


    const username =
        user.username ||
        "username";


    const initials =
        getInitials(
            name
        );


    return `
        <button
            type="button"
            class="search-result"
            onclick="openUserProfile(${user.id})"
        >

            <div class="avatar avatar-sm">

                <span>
                    ${escapeHTML(initials)}
                </span>

            </div>


            <div class="search-result-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <span>
                    @${escapeHTML(username)}
                </span>

            </div>


            <span>
                →
            </span>

        </button>
    `;
}


/* =========================================================
   PROFILE NAVIGATION
========================================================= */

function goToMyProfile() {

    if (!currentUser?.id) {
        return;
    }


    window.location.href =
        `profile.html?id=${currentUser.id}`;
}


function openUserProfile(
    userId
) {

    if (!userId) {
        return;
    }


    window.location.href =
        `profile.html?id=${userId}`;
}


/* =========================================================
   REFRESH
========================================================= */

async function handleRefresh() {

    const button =
        document.getElementById(
            "refreshBtn"
        );


    if (button) {

        button.disabled = true;

        button.style.transition =
            "transform 400ms ease";

        button.style.transform =
            "rotate(360deg)";
    }


    try {

        await loadFeed();

        await refreshProfileStats();


        showToast(
            "Feed refreshed successfully.",
            "success"
        );

    } finally {

        if (button) {

            setTimeout(
                () => {

                    button.style.transform =
                        "";

                    button.disabled =
                        false;

                },
                400
            );
        }
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function handleLogout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to log out?"
        );


    if (!confirmed) {
        return;
    }


    logoutUser();
}


/* =========================================================
   PROFILE COUNTS
========================================================= */

function updateProfileCounts(
    posts
) {

    /*
     * Only calculate Posts here.
     *
     * Followers and Following are NOT
     * calculated from the visible feed.
     *
     * They come from the database through
     * refreshProfileStats().
     */

    const ownPosts =
        Array.isArray(posts)
            ? posts.filter(
                post =>
                    Number(post.user_id) ===
                    Number(currentUser?.id)
            )
            : [];


    /*
     * This is only a temporary visual update.
     * The real database value is loaded immediately
     * through refreshProfileStats().
     */

    setText(
        "rightPostsCount",
        ownPosts.length
    );
}


/* =========================================================
   POST ANIMATION
========================================================= */

function animatePosts() {

    const posts =
        document.querySelectorAll(
            ".post-card"
        );


    posts.forEach(
        (post, index) => {

            post.style.animationDelay =
                `${Math.min(index * 45, 300)}ms`;

        }
    );
}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {
        element.textContent =
            value;
    }
}