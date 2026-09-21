/* =========================================================
   VIBE — PROFILE PAGE
   Professional profile experience
========================================================= */

let profileUserId = null;
let profileUser = null;
let profilePosts = [];
let loggedInUser = null;

let selectedProfileImage = null;
let removeProfileImage = false;


/* =========================================================
   SAFE HTML
========================================================= */

function profileEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   USER ID HELPER
========================================================= */

function getUserId(user) {

    return Number(
        user?.id ??
        user?.user_id ??
        user?.userId ??
        user?.data?.id ??
        user?.data?.user_id ??
        0
    );

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("✅ profile.js loaded");

        setupProfileEvents();

        const authenticated =
            requireAuth();

        if (authenticated === false) {
            return;
        }

        try {

            const response =
                await getCurrentUser();

            loggedInUser =
                response?.user ||
                response?.data ||
                response;

            console.log(
                "Logged in user:",
                loggedInUser
            );


            const params =
                new URLSearchParams(
                    window.location.search
                );

            const requestedId =
                params.get("id");


            if (requestedId) {

                profileUserId =
                    Number(requestedId);

            } else {

                profileUserId =
                    getUserId(
                        loggedInUser
                    );

            }


            if (!profileUserId) {

                showProfileToast(
                    "Could not determine profile."
                );

                return;
            }


            await initializeProfile();

        } catch (error) {

            console.error(
                "Profile initialization error:",
                error
            );

            showProfileToast(
                error.message ||
                "Could not load profile."
            );

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeProfile() {

    await loadProfile();

    await loadProfilePosts();

}


/* =========================================================
   EVENTS
========================================================= */

function setupProfileEvents() {

    /* -----------------------------------------
       BACK TO FEED
    ----------------------------------------- */

    const backFeed =
        document.querySelector(
            ".back-feed"
        );

    if (backFeed) {

        backFeed.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.location.href =
                    "/feed.html";

            }
        );

    }


    /* -----------------------------------------
       REFRESH
    ----------------------------------------- */

    const refreshBtn =
        document.getElementById(
            "refreshProfileBtn"
        );

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                if (refreshBtn.disabled) {
                    return;
                }

                refreshBtn.disabled = true;

                refreshBtn.classList.add(
                    "loading"
                );

                try {

                    await loadProfile();
                    await loadProfilePosts();

                    showProfileToast(
                        "Profile refreshed."
                    );

                } catch (error) {

                    console.error(
                        "Refresh error:",
                        error
                    );

                    showProfileToast(
                        "Could not refresh profile."
                    );

                } finally {

                    refreshBtn.disabled = false;

                    refreshBtn.classList.remove(
                        "loading"
                    );

                }

            }
        );

    }


    /* -----------------------------------------
       EDIT PROFILE
    ----------------------------------------- */

    const editBtn =
        document.getElementById(
            "editProfileBtn"
        );

    if (editBtn) {

        editBtn.addEventListener(
            "click",
            openEditProfileModal
        );

    }


    /* -----------------------------------------
       CLOSE MODAL
    ----------------------------------------- */

    const closeBtn =
        document.getElementById(
            "closeEditProfileBtn"
        );

    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closeEditProfileModal
        );

    }


    /* -----------------------------------------
       CANCEL
    ----------------------------------------- */

    const cancelBtn =
        document.getElementById(
            "cancelEditProfileBtn"
        );

    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            closeEditProfileModal
        );

    }


    /* -----------------------------------------
       MODAL BACKDROP
    ----------------------------------------- */

    const modal =
        document.getElementById(
            "editProfileModal"
        );

    if (modal) {

        const backdrop =
            modal.querySelector(
                ".modal-backdrop"
            );

        if (backdrop) {

            backdrop.addEventListener(
                "click",
                closeEditProfileModal
            );

        }

    }


    /* -----------------------------------------
       ESCAPE KEY
    ----------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeEditProfileModal();

            }

        }
    );


    /* -----------------------------------------
       EDIT PROFILE FORM
    ----------------------------------------- */

    const form =
        document.getElementById(
            "editProfileForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleProfileUpdate
        );

    }


    /* -----------------------------------------
       BIO COUNTER
    ----------------------------------------- */

    const bio =
        document.getElementById(
            "editBio"
        );

    if (bio) {

        bio.addEventListener(
            "input",
            updateBioCounter
        );

    }


    /* -----------------------------------------
       PROFILE IMAGE
    ----------------------------------------- */

    const imageInput =
        document.getElementById(
            "profileImageInput"
        );

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            handleProfileImageSelection
        );

    }


    /* -----------------------------------------
       REMOVE PROFILE IMAGE
    ----------------------------------------- */

    const removeBtn =
        document.getElementById(
            "removeProfileImageBtn"
        );

    if (removeBtn) {

        removeBtn.addEventListener(
            "click",
            handleRemoveProfileImage
        );

    }


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    const emptyFeedBtn =
        document.querySelector(
            ".profile-empty .primary-button"
        );

    if (emptyFeedBtn) {

        emptyFeedBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.location.href =
                    "/feed.html";

            }
        );

    }


    /* -----------------------------------------
       PROFILE POST EVENTS
       Delegated because posts are dynamic
    ----------------------------------------- */

    document.addEventListener(
        "click",
        handleDynamicProfileClick
    );

}


/* =========================================================
   DYNAMIC PROFILE CLICK HANDLER
========================================================= */

async function handleDynamicProfileClick(event) {

    const editBtn =
        event.target.closest(
            "#editProfileBtn"
        );

    if (editBtn) {

        openEditProfileModal();

        return;
    }


    const logoutBtn =
        event.target.closest(
            "#profileLogoutBtn"
        );

    if (logoutBtn) {

        handleProfileLogout();

        return;
    }


    const followBtn =
        event.target.closest(
            "#profileFollowBtn"
        );

    if (followBtn) {

        await handleProfileFollow();

        return;
    }


    const likeBtn =
        event.target.closest(
            "[data-profile-like]"
        );

    if (likeBtn) {

        await handleProfileLike(
            likeBtn
        );

        return;
    }


    const commentsBtn =
        event.target.closest(
            "[data-profile-comments-toggle]"
        );

    if (commentsBtn) {

        await toggleProfileComments(
            commentsBtn
        );

        return;
    }


    const commentSubmitBtn =
        event.target.closest(
            "[data-profile-comment-submit]"
        );

    if (commentSubmitBtn) {

        await submitProfileComment(
            commentSubmitBtn
        );

        return;
    }


    const deleteCommentBtn =
        event.target.closest(
            "[data-profile-delete-comment]"
        );

    if (deleteCommentBtn) {

        await handleDeleteProfileComment(
            deleteCommentBtn
        );

        return;
    }


    const deletePostBtn =
        event.target.closest(
            "[data-delete-post]"
        );

    if (deletePostBtn) {

        await handleDeletePost(
            deletePostBtn
        );

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    try {

        const response =
            await getUserProfile(
                profileUserId
            );


        profileUser =
            response?.user ||
            response?.profile ||
            response?.data?.user ||
            response?.data?.profile ||
            response?.data ||
            response;


        console.log(
            "Profile:",
            profileUser
        );


        if (!profileUser) {

            throw new Error(
                "Profile data not found."
            );

        }


        renderProfile();

    } catch (error) {

        console.error(
            "Load profile error:",
            error
        );

        showProfileToast(
            error.message ||
            "Could not load profile."
        );

        throw error;

    }

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile() {

    if (!profileUser) {
        return;
    }


    const name =
        profileUser.name ||
        profileUser.full_name ||
        "Vibe User";


    const username =
        profileUser.username ||
        "user";


    const bio =
        profileUser.bio ||
        "No bio yet.";


    setText(
        "profileName",
        name
    );


    setText(
        "profileUsername",
        `@${username}`
    );


    setText(
        "profileBio",
        bio
    );


    setText(
        "postsCount",
        profileUser.post_count ??
        profileUser.posts_count ??
        0
    );


    setText(
        "followersCount",
        profileUser.follower_count ??
        profileUser.followers_count ??
        0
    );


    setText(
        "followingCount",
        profileUser.following_count ??
        profileUser.followingCount ??
        0
    );


    renderProfileAvatar();

    renderProfileAction();

}


/* =========================================================
   PROFILE AVATAR
========================================================= */

function renderProfileAvatar() {

    const avatar =
        document.getElementById(
            "profileAvatar"
        );

    if (!avatar) {
        return;
    }


    const name =
        profileUser?.name ||
        profileUser?.username ||
        "VU";


    const initials =
        getProfileInitials(
            name
        );


    const profileImage =
        profileUser?.profile_image ||
        profileUser?.profileImage ||
        profileUser?.avatar_url ||
        "";


    if (profileImage) {

        avatar.innerHTML = `
            <img
                src="${profileEscapeHTML(profileImage)}"
                alt="${profileEscapeHTML(name)}"
                loading="eager"
            >

            <span
                class="avatar-fallback"
                style="display:none;"
            >
                ${profileEscapeHTML(initials)}
            </span>
        `;


        const image =
            avatar.querySelector("img");


        if (image) {

            image.addEventListener(
                "error",
                () => {

                    image.style.display =
                        "none";

                    const fallback =
                        avatar.querySelector(
                            ".avatar-fallback"
                        );

                    if (fallback) {
                        fallback.style.display =
                            "grid";
                    }

                },
                { once: true }
            );

        }

    } else {

        avatar.innerHTML = `
            <span>
                ${profileEscapeHTML(initials)}
            </span>
        `;

    }

}


/* =========================================================
   PROFILE ACTION
========================================================= */

function renderProfileAction() {

    const action =
        document.getElementById(
            "profileAction"
        );

    if (!action) {

        console.error(
            "❌ profileAction element not found"
        );

        return;
    }


    const currentId =
        getUserId(
            loggedInUser
        );


    const viewedId =
        getUserId(
            profileUser
        ) ||
        Number(profileUserId);


    const isOwnProfile =
        currentId > 0 &&
        viewedId > 0 &&
        currentId === viewedId;


    console.log(
        "Current ID:",
        currentId,
        "Viewed ID:",
        viewedId,
        "Own profile:",
        isOwnProfile
    );


    /* =====================================================
       OWN PROFILE
    ===================================================== */

    if (isOwnProfile) {

        action.innerHTML = `
            <div class="profile-own-actions">

                <button
                    type="button"
                    class="profile-edit-btn"
                    id="editProfileBtn"
                >
                    <i class="fa-solid fa-pen"></i>
                    <span>Edit Profile</span>
                </button>

                <button
                    type="button"
                    class="profile-logout-btn"
                    id="profileLogoutBtn"
                >
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span>Logout</span>
                </button>

            </div>
        `;

        return;
    }


    /* =====================================================
       OTHER USER
    ===================================================== */

    const following =
        Boolean(
            profileUser?.following_by_me ??
            profileUser?.is_following ??
            false
        );


    action.innerHTML = `
        <button
            type="button"
            class="profile-follow-btn ${
                following ? "following" : ""
            }"
            id="profileFollowBtn"
            ${following ? 'aria-pressed="true"' : 'aria-pressed="false"'}
        >

            <i class="fa-solid ${
                following
                    ? "fa-user-check"
                    : "fa-user-plus"
            }"></i>

            <span>
                ${
                    following
                        ? "Following"
                        : "Follow"
                }
            </span>

        </button>
    `;

}


/* =========================================================
   FOLLOW / UNFOLLOW
========================================================= */

async function handleProfileFollow() {

    const currentId =
        getUserId(
            loggedInUser
        );


    const viewedId =
        getUserId(
            profileUser
        ) ||
        Number(profileUserId);


    if (
        currentId &&
        viewedId &&
        currentId === viewedId
    ) {

        showProfileToast(
            "You cannot follow yourself."
        );

        return;
    }


    const button =
        document.getElementById(
            "profileFollowBtn"
        );


    if (!button) {
        return;
    }


    if (button.disabled) {
        return;
    }


    button.disabled = true;


    const originalHTML =
        button.innerHTML;


    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Updating...</span>
    `;


    try {

        const response =
            await toggleFollow(
                viewedId
            );


        console.log(
            "Follow response:",
            response
        );


        showProfileToast(
            response?.message ||
            "Follow status updated."
        );


        await loadProfile();

    } catch (error) {

        console.error(
            "Follow error:",
            error
        );


        button.innerHTML =
            originalHTML;


        showProfileToast(
            error.message ||
            "Could not update follow status."
        );

    } finally {

        if (
            document.body.contains(button)
        ) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function handleProfileLogout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    if (
        typeof logoutUser ===
        "function"
    ) {

        logoutUser();

        return;
    }


    localStorage.removeItem(
        "social_token"
    );

    localStorage.removeItem(
        "social_user"
    );


    window.location.href =
        "/login.html";

}


/* =========================================================
   EDIT PROFILE MODAL
========================================================= */

function openEditProfileModal() {

    if (!profileUser) {

        showProfileToast(
            "Profile is still loading."
        );

        return;
    }


    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (!modal) {

        console.error(
            "Edit profile modal not found."
        );

        return;
    }


    setValue(
        "editName",
        profileUser.name ||
        profileUser.full_name ||
        ""
    );


    setValue(
        "editUsername",
        profileUser.username ||
        ""
    );


    setValue(
        "editBio",
        profileUser.bio ||
        ""
    );


    selectedProfileImage =
        null;


    removeProfileImage =
        false;


    updateBioCounter();

    renderPhotoPreview();


    modal.hidden =
        false;


    document.body.style.overflow =
        "hidden";


    setTimeout(
        () => {

            const input =
                document.getElementById(
                    "editName"
                );

            if (input) {
                input.focus();
            }

        },
        100
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeEditProfileModal() {

    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden =
        true;


    document.body.style.overflow =
        "";


    const input =
        document.getElementById(
            "profileImageInput"
        );


    if (input) {
        input.value = "";
    }


    selectedProfileImage =
        null;


    removeProfileImage =
        false;

}


/* =========================================================
   BIO COUNTER
========================================================= */

function updateBioCounter() {

    const bio =
        document.getElementById(
            "editBio"
        );


    const counter =
        document.getElementById(
            "bioCounter"
        );


    if (!bio || !counter) {
        return;
    }


    counter.textContent =
        `${bio.value.length}/500`;

}


/* =========================================================
   IMAGE SELECTION
========================================================= */

function handleProfileImageSelection(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showProfileToast(
            "Please choose a JPG, PNG or WEBP image."
        );


        event.target.value =
            "";


        return;
    }


    const maxSize =
        5 * 1024 * 1024;


    if (
        file.size >
        maxSize
    ) {

        showProfileToast(
            "Image must be smaller than 5 MB."
        );


        event.target.value =
            "";


        return;
    }


    selectedProfileImage =
        file;


    removeProfileImage =
        false;


    const removeBtn =
        document.getElementById(
            "removeProfileImageBtn"
        );


    if (removeBtn) {
        removeBtn.hidden =
            false;
    }


    renderPhotoPreview();

}


/* =========================================================
   REMOVE PROFILE IMAGE
========================================================= */

function handleRemoveProfileImage() {

    selectedProfileImage =
        null;


    removeProfileImage =
        true;


    const input =
        document.getElementById(
            "profileImageInput"
        );


    if (input) {
        input.value =
            "";
    }


    const removeBtn =
        document.getElementById(
            "removeProfileImageBtn"
        );


    if (removeBtn) {

        removeBtn.hidden =
            true;

    }


    renderPhotoPreview();

}


/* =========================================================
   PHOTO PREVIEW
========================================================= */

function renderPhotoPreview() {

    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (!preview) {
        return;
    }


    const initials =
        getProfileInitials(
            profileUser?.name ||
            profileUser?.username ||
            "VU"
        );


    if (selectedProfileImage) {

        const reader =
            new FileReader();


        reader.onload =
            event => {

                preview.innerHTML = `
                    <img
                        src="${event.target.result}"
                        alt="Profile preview"
                    >
                `;

            };


        reader.readAsDataURL(
            selectedProfileImage
        );


        return;
    }


    if (
        removeProfileImage
    ) {

        preview.innerHTML = `
            <span>
                ${profileEscapeHTML(initials)}
            </span>
        `;


        return;
    }


    const existingImage =
        profileUser?.profile_image ||
        profileUser?.profileImage ||
        profileUser?.avatar_url ||
        "";


    if (existingImage) {

        preview.innerHTML = `
            <img
                src="${profileEscapeHTML(existingImage)}"
                alt="Profile photo"
            >
        `;


        return;
    }


    preview.innerHTML = `
        <span>
            ${profileEscapeHTML(initials)}
        </span>
    `;

}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function handleProfileUpdate(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "editName"
        )?.value.trim();


    const username =
        document.getElementById(
            "editUsername"
        )?.value.trim();


    const bio =
        document.getElementById(
            "editBio"
        )?.value.trim();


    if (!name) {

        showProfileToast(
            "Name is required."
        );

        return;
    }


    if (!username) {

        showProfileToast(
            "Username is required."
        );

        return;
    }


    if (
        username.length < 3
    ) {

        showProfileToast(
            "Username must contain at least 3 characters."
        );

        return;
    }


    const saveBtn =
        document.getElementById(
            "saveProfileBtn"
        );


    if (saveBtn) {

        saveBtn.disabled =
            true;


        saveBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;

    }


    try {

        const profileData = {
            name,
            username,
            bio
        };


        if (
            typeof updateUserProfileWithImage ===
            "function"
        ) {

            await updateUserProfileWithImage(
                profileData,
                selectedProfileImage,
                removeProfileImage
            );

        } else {

            await updateUserProfile(
                profileData
            );

        }


        showProfileToast(
            "Profile updated successfully."
        );


        closeEditProfileModal();


        await loadProfile();


    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        showProfileToast(
            error.message ||
            "Could not update profile."
        );


    } finally {

        if (saveBtn) {

            saveBtn.disabled =
                false;


            saveBtn.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Save Changes
            `;

        }

    }

}


/* =========================================================
   LOAD PROFILE POSTS
========================================================= */

async function loadProfilePosts() {

    const loading =
        document.getElementById(
            "profileLoading"
        );

    const empty =
        document.getElementById(
            "profileEmpty"
        );


    if (loading) {

        loading.hidden = false;

        loading.style.display = "flex";

    }


    if (empty) {

        empty.hidden = true;

    }


    try {

        const response =
            await getUserPosts(
                profileUserId
            );


        profilePosts =
            response?.posts ||
            response?.data?.posts ||
            response?.data ||
            response ||
            [];


        if (
            !Array.isArray(
                profilePosts
            )
        ) {

            profilePosts = [];

        }


        renderProfilePosts();


    } catch (error) {

        console.error(
            "Load posts error:",
            error
        );


        profilePosts = [];

        renderProfilePosts();


        showProfileToast(
            "Could not load profile posts."
        );


    } finally {

        if (loading) {

            loading.hidden = true;

            loading.style.display = "none";

        }

    }

}


/* =========================================================
   RENDER PROFILE POSTS
========================================================= */

function renderProfilePosts() {

    const container =
        document.getElementById(
            "profilePosts"
        );


    const empty =
        document.getElementById(
            "profileEmpty"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !profilePosts.length
    ) {

        if (empty) {
            empty.hidden =
                false;
        }

        return;
    }


    if (empty) {
        empty.hidden =
            true;
    }


    profilePosts.forEach(
        post => {

            container.insertAdjacentHTML(
                "beforeend",
                createPostHTML(post)
            );

        }
    );


    restoreLikedStates();

}


/* =========================================================
   CREATE PROFILE POST
========================================================= */

function createPostHTML(post) {

    const name =
        post.name ||
        post.author_name ||
        post.author?.name ||
        profileUser?.name ||
        "User";


    const username =
        post.username ||
        post.author_username ||
        post.author?.username ||
        profileUser?.username ||
        "user";


    const content =
        post.content ||
        "";


    const initials =
        getProfileInitials(
            name
        );


    const date =
        formatProfileDate(
            post.created_at
        );


    const image =
        post.image_url ||
        post.image ||
        "";


    const isOwnPost =
        Number(post.user_id) ===
        getUserId(loggedInUser);


    const liked =
        Boolean(
            post.liked_by_me ??
            post.liked ??
            false
        );


    /*
       IMPORTANT:
       Use ?? instead of || so a real
       database value of 0 stays 0.
    */

    const likeCount =
        Number(
            post.like_count ??
            post.likes_count ??
            0
        );


    const commentCount =
        Number(
            post.comment_count ??
            post.comments_count ??
            0
        );


    const postImage =
        post.profile_image ||
        post.author?.profile_image ||
        "";


    return `

        <article
            class="profile-post-card"
            data-post-id="${profileEscapeHTML(post.id)}"
        >

            <div class="post-card-header">

                <div class="post-author">

                    <div class="post-mini-avatar">

                        ${
                            postImage
                                ? `
                                    <img
                                        src="${profileEscapeHTML(postImage)}"
                                        alt=""
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <span>
                                        ${profileEscapeHTML(initials)}
                                    </span>
                                `
                        }

                    </div>


                    <div>

                        <div class="post-author-name">
                            ${profileEscapeHTML(name)}
                        </div>


                        <div class="post-date">
                            @${profileEscapeHTML(username)}
                            ·
                            ${profileEscapeHTML(date)}
                        </div>

                    </div>

                </div>


                ${
                    isOwnPost
                        ? `
                            <button
                                type="button"
                                class="post-delete-btn"
                                data-delete-post="${profileEscapeHTML(post.id)}"
                                title="Delete post"
                                aria-label="Delete post"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `
                        : ""
                }

            </div>


            <p class="post-content">
                ${profileEscapeHTML(content)}
            </p>


            ${
                image
                    ? `
                        <img
                            class="post-image"
                            src="${profileEscapeHTML(image)}"
                            alt="Post image"
                            loading="lazy"
                        >
                    `
                    : ""
            }


            <div class="post-footer">

                <button
                    type="button"
                    class="profile-post-action ${
                        liked
                            ? "liked"
                            : ""
                    }"
                    data-profile-like="${profileEscapeHTML(post.id)}"
                    aria-label="${
                        liked
                            ? "Unlike post"
                            : "Like post"
                    }"
                    aria-pressed="${
                        liked
                            ? "true"
                            : "false"
                    }"
                >

                    <i class="fa-${
                        liked
                            ? "solid"
                            : "regular"
                    } fa-heart"></i>

                    <span data-like-count>
                        ${likeCount}
                    </span>

                </button>


                <button
                    type="button"
                    class="profile-post-action"
                    data-profile-comments-toggle="${profileEscapeHTML(post.id)}"
                    aria-expanded="false"
                >

                    <i class="fa-regular fa-comment"></i>

                    <span data-comment-count>
                        ${commentCount}
                    </span>

                </button>

            </div>


            <div
                class="profile-comments"
                data-profile-comments="${profileEscapeHTML(post.id)}"
                hidden
            >

                <div
                    class="profile-comments-list"
                    data-profile-comments-list
                >
                    <div class="profile-comments-loading">
                        Loading comments...
                    </div>
                </div>


                <div class="profile-comment-form">

                    <input
                        type="text"
                        maxlength="500"
                        placeholder="Write a comment..."
                        data-profile-comment-input="${profileEscapeHTML(post.id)}"
                        aria-label="Write a comment"
                    >

                    <button
                        type="button"
                        class="primary-button"
                        data-profile-comment-submit="${profileEscapeHTML(post.id)}"
                    >
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   RESTORE LIKED STATES
========================================================= */

async function restoreLikedStates() {

    /*
       The profile API already supplies liked_by_me.
       No additional requests are necessary.
    */

}


/* =========================================================
   LIKE PROFILE POST
========================================================= */

async function handleProfileLike(button) {

    const postId =
        button.dataset.profileLike;


    if (!postId) {
        return;
    }


    if (button.disabled) {
        return;
    }


    button.disabled =
        true;


    /*
       Find the actual post in our local
       frontend state.
    */

    const post =
        profilePosts.find(
            item =>
                Number(item.id) ===
                Number(postId)
        );


    /*
       Remember the previous state so that
       we can safely recover if the API fails.
    */

    const previousLiked =
        post
            ? Boolean(
                post.liked_by_me ??
                post.liked ??
                false
            )
            : button.classList.contains(
                "liked"
            );


    const previousCount =
        post
            ? Number(
                post.like_count ??
                post.likes_count ??
                0
            )
            : Number(
                button.querySelector(
                    "[data-like-count]"
                )?.textContent || 0
            );


    try {

        const response =
            await toggleLike(
                postId
            );


        console.log(
            "Like response:",
            response
        );


        /*
           Get the new like state from backend.
        */

        const liked =
            Boolean(
                response?.liked ??
                response?.data?.liked ??
                false
            );


        /*
           IMPORTANT:
           Determine the new count.

           If backend returns a count,
           use it.

           Otherwise calculate locally
           from the previous state.
        */

        let newLikeCount;


        const backendCount =
            response?.like_count ??
            response?.likes_count ??
            response?.data?.like_count ??
            response?.data?.likes_count ??
            response?.count ??
            response?.data?.count;


        if (
            backendCount !== undefined &&
            backendCount !== null
        ) {

            newLikeCount =
                Number(
                    backendCount
                );

        } else {

            /*
               No count returned by API.

               If we changed:
               false → true = +1
               true → false = -1
            */

            newLikeCount =
                previousLiked === liked
                    ? previousCount
                    : liked
                        ? previousCount + 1
                        : Math.max(
                            0,
                            previousCount - 1
                        );

        }


        /*
           Update local post state.
        */

        if (post) {

            post.liked_by_me =
                liked;

            post.liked =
                liked;

            post.like_count =
                Math.max(
                    0,
                    newLikeCount
                );

            post.likes_count =
                Math.max(
                    0,
                    newLikeCount
                );

        }


        /*
           Update button state immediately.
        */

        button.classList.toggle(
            "liked",
            liked
        );


        button.setAttribute(
            "aria-pressed",
            liked
                ? "true"
                : "false"
        );


        button.setAttribute(
            "aria-label",
            liked
                ? "Unlike post"
                : "Like post"
        );


        /*
           Update heart icon.
        */

        const icon =
            button.querySelector(
                "i"
            );


        if (icon) {

            icon.className =
                liked
                    ? "fa-solid fa-heart"
                    : "fa-regular fa-heart";

        }


        /*
           Update visible count immediately.
        */

        const countElement =
            button.querySelector(
                "[data-like-count]"
            );


        if (countElement) {

            countElement.textContent =
                Math.max(
                    0,
                    newLikeCount
                );

        }


        showProfileToast(
            liked
                ? "Post liked."
                : "Like removed."
        );


    } catch (error) {

        console.error(
            "Like error:",
            error
        );


        /*
           Restore local state if API fails.
        */

        if (post) {

            post.liked_by_me =
                previousLiked;

            post.liked =
                previousLiked;

            post.like_count =
                previousCount;

            post.likes_count =
                previousCount;

        }


        showProfileToast(
            error.message ||
            "Could not update like."
        );


    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
   TOGGLE COMMENTS
========================================================= */

async function toggleProfileComments(button) {

    const postId =
        button.dataset
            .profileCommentsToggle;


    if (!postId) {
        return;
    }


    const section =
        document.querySelector(
            `[data-profile-comments="${CSS.escape(String(postId))}"]`
        );


    if (!section) {
        return;
    }


    const isOpen =
        !section.hidden;


    section.hidden =
        isOpen;


    button.setAttribute(
        "aria-expanded",
        isOpen
            ? "false"
            : "true"
    );


    if (!isOpen) {

        await loadProfileComments(
            postId
        );

    }

}


/* =========================================================
   LOAD COMMENTS
========================================================= */

async function loadProfileComments(postId) {

    const section =
        document.querySelector(
            `[data-profile-comments="${CSS.escape(String(postId))}"]`
        );


    if (!section) {
        return;
    }


    const list =
        section.querySelector(
            "[data-profile-comments-list]"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="profile-comments-loading">
            Loading comments...
        </div>
    `;


    try {

        const response =
            await getComments(
                postId
            );


        const comments =
            response?.comments ||
            response?.data ||
            response ||
            [];


        if (
            !Array.isArray(
                comments
            ) ||
            !comments.length
        ) {

            list.innerHTML = `
                <div class="profile-no-comments">
                    No comments yet. Be the first to comment.
                </div>
            `;

            return;
        }


        list.innerHTML =
            comments
                .map(
                    comment =>
                        createCommentHTML(
                            comment
                        )
                )
                .join("");


    } catch (error) {

        console.error(
            "Load comments error:",
            error
        );


        list.innerHTML = `
            <div class="profile-no-comments">
                Could not load comments.
            </div>
        `;

    }

}


/* =========================================================
   COMMENT HTML
========================================================= */

function createCommentHTML(comment) {

    const commentUserId =
        getUserId(
            comment
        ) ||
        Number(
            comment.user_id
        );


    const currentUserId =
        getUserId(
            loggedInUser
        );


    const name =
        comment.name ||
        comment.user_name ||
        comment.author?.name ||
        comment.username ||
        "User";


    const username =
        comment.username ||
        comment.author?.username ||
        "";


    const content =
        comment.content ||
        "";


    const date =
        formatProfileDate(
            comment.created_at
        );


    const initials =
        getProfileInitials(
            name
        );


    const image =
        comment.profile_image ||
        comment.author?.profile_image ||
        "";


    const canDelete =
        commentUserId > 0 &&
        currentUserId > 0 &&
        commentUserId === currentUserId;


    return `

        <div
            class="profile-comment"
            data-comment-id="${profileEscapeHTML(comment.id)}"
        >

            <div class="profile-comment-avatar">

                ${
                    image
                        ? `
                            <img
                                src="${profileEscapeHTML(image)}"
                                alt=""
                                loading="lazy"
                            >
                        `
                        : `
                            <span>
                                ${profileEscapeHTML(initials)}
                            </span>
                        `
                }

            </div>


            <div class="profile-comment-body">

                <div class="profile-comment-top">

                    <div>

                        <strong>
                            ${profileEscapeHTML(name)}
                        </strong>

                        ${
                            username
                                ? `
                                    <span>
                                        @${profileEscapeHTML(username)}
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    ${
                        canDelete
                            ? `
                                <button
                                    type="button"
                                    class="profile-comment-delete"
                                    data-profile-delete-comment="${profileEscapeHTML(comment.id)}"
                                    title="Delete comment"
                                    aria-label="Delete comment"
                                >
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            `
                            : ""
                    }

                </div>


                <p>
                    ${profileEscapeHTML(content)}
                </p>


                <small>
                    ${profileEscapeHTML(date)}
                </small>

            </div>

        </div>

    `;

}


/* =========================================================
   SUBMIT COMMENT
========================================================= */

async function submitProfileComment(button) {

    const postId =
        button.dataset
            .profileCommentSubmit;


    if (!postId) {
        return;
    }


    const section =
        document.querySelector(
            `[data-profile-comments="${CSS.escape(String(postId))}"]`
        );


    if (!section) {
        return;
    }


    const input =
        section.querySelector(
            `[data-profile-comment-input="${CSS.escape(String(postId))}"]`
        );


    if (!input) {
        return;
    }


    const content =
        input.value.trim();


    if (!content) {

        showProfileToast(
            "Write a comment first."
        );

        input.focus();

        return;
    }


    if (
        content.length >
        500
    ) {

        showProfileToast(
            "Comment must be 500 characters or less."
        );

        return;
    }


    if (button.disabled) {
        return;
    }


    button.disabled =
        true;


    const originalHTML =
        button.innerHTML;


    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
    `;


    try {

        const response =
            await addComment(
                postId,
                content
            );


        /*
           Update local post state immediately.
        */

        const post =
            profilePosts.find(
                item =>
                    Number(item.id) ===
                    Number(postId)
            );


        const currentCount =
            post
                ? Number(
                    post.comment_count ??
                    post.comments_count ??
                    0
                )
                : getVisibleProfileCommentCount(
                    postId
                );


        /*
           If backend provides the new count,
           use it. Otherwise +1 locally.
        */

        const backendCount =
            response?.comment_count ??
            response?.comments_count ??
            response?.data?.comment_count ??
            response?.data?.comments_count ??
            response?.count ??
            response?.data?.count;


        const newCount =
            backendCount !== undefined &&
            backendCount !== null
                ? Number(
                    backendCount
                )
                : currentCount + 1;


        if (post) {

            post.comment_count =
                Math.max(
                    0,
                    newCount
                );

            post.comments_count =
                Math.max(
                    0,
                    newCount
                );

        }


        /*
           Clear input.
        */

        input.value =
            "";


        /*
           Reload visible comments.
        */

        await loadProfileComments(
            postId
        );


        /*
           Update count immediately.
        */

        setProfileCommentCount(
            postId,
            newCount
        );


        showProfileToast(
            "Comment added."
        );


    } catch (error) {

        console.error(
            "Add comment error:",
            error
        );


        showProfileToast(
            error.message ||
            "Could not add comment."
        );


    } finally {

        button.disabled =
            false;


        button.innerHTML =
            originalHTML;

    }

}


/* =========================================================
   GET VISIBLE COMMENT COUNT
========================================================= */

function getVisibleProfileCommentCount(
    postId
) {

    const section =
        document.querySelector(
            `[data-profile-comments="${CSS.escape(String(postId))}"]`
        );


    if (!section) {
        return 0;
    }


    const card =
        section.closest(
            ".profile-post-card"
        );


    if (!card) {
        return 0;
    }


    const count =
        card.querySelector(
            "[data-comment-count]"
        );


    return Number(
        count?.textContent || 0
    );

}


/* =========================================================
   SET COMMENT COUNT
========================================================= */

function setProfileCommentCount(
    postId,
    value
) {

    const section =
        document.querySelector(
            `[data-profile-comments="${CSS.escape(String(postId))}"]`
        );


    if (!section) {
        return;
    }


    const card =
        section.closest(
            ".profile-post-card"
        );


    if (!card) {
        return;
    }


    const count =
        card.querySelector(
            "[data-comment-count]"
        );


    if (count) {

        count.textContent =
            Math.max(
                0,
                Number(value) || 0
            );

    }

}


/* =========================================================
   UPDATE COMMENT COUNT
========================================================= */

function updateProfileCommentCount(
    postId,
    amount
) {

    const post =
        profilePosts.find(
            item =>
                Number(item.id) ===
                Number(postId)
        );


    let currentCount =
        post
            ? Number(
                post.comment_count ??
                post.comments_count ??
                0
            )
            : getVisibleProfileCommentCount(
                postId
            );


    const newCount =
        Math.max(
            0,
            currentCount + Number(amount || 0)
        );


    if (post) {

        post.comment_count =
            newCount;

        post.comments_count =
            newCount;

    }


    setProfileCommentCount(
        postId,
        newCount
    );

}


/* =========================================================
   DELETE COMMENT
========================================================= */

async function handleDeleteProfileComment(
    button
) {

    const commentId =
        button.dataset
            .profileDeleteComment;


    if (!commentId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this comment?"
        );


    if (!confirmed) {
        return;
    }


    if (button.disabled) {
        return;
    }


    button.disabled =
        true;


    try {

        await deleteComment(
            commentId
        );


        const comment =
            button.closest(
                ".profile-comment"
            );


        const section =
            button.closest(
                ".profile-comments"
            );


        const postId =
            section?.dataset
                .profileComments;


        if (comment) {
            comment.remove();
        }


        /*
           Immediately decrease the count.
        */

        if (postId) {

            updateProfileCommentCount(
                postId,
                -1
            );

        }


        /*
           If there are now no comments,
           show the empty message.
        */

        if (section) {

            const list =
                section.querySelector(
                    "[data-profile-comments-list]"
                );


            if (
                list &&
                !list.querySelector(
                    ".profile-comment"
                )
            ) {

                list.innerHTML = `
                    <div class="profile-no-comments">
                        No comments yet. Be the first to comment.
                    </div>
                `;

            }

        }


        showProfileToast(
            "Comment deleted."
        );


    } catch (error) {

        console.error(
            "Delete comment error:",
            error
        );


        button.disabled =
            false;


        showProfileToast(
            error.message ||
            "Could not delete comment."
        );

    }

}


/* =========================================================
   DELETE POST
========================================================= */

async function handleDeletePost(
    button
) {

    const postId =
        button.dataset.deletePost;


    if (!postId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this post?"
        );


    if (!confirmed) {
        return;
    }


    if (button.disabled) {
        return;
    }


    button.disabled =
        true;


    try {

        await deletePost(
            postId
        );


        showProfileToast(
            "Post deleted."
        );


        await loadProfile();

        await loadProfilePosts();


    } catch (error) {

        console.error(
            "Delete post error:",
            error
        );


        button.disabled =
            false;


        showProfileToast(
            error.message ||
            "Could not delete post."
        );

    }

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
            value ?? "";

    }

}


function setValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


function getProfileInitials(
    value
) {

    const words =
        String(
            value ||
            "VU"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {
        return "VU";
    }


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


function formatProfileDate(
    dateValue
) {

    if (!dateValue) {
        return "Recently";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recently";

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   PROFILE TOAST
========================================================= */

function showProfileToast(
    message
) {

    const toast =
        document.getElementById(
            "profileToast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.profileToastTimer
    );


    window.profileToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}