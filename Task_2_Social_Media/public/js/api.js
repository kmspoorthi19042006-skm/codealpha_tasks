/* =========================================================
   VIBE — API JAVASCRIPT
========================================================= */

const API_BASE_URL =
    "/api";


/* =========================================================
   JSON API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        localStorage.getItem(
            "social_token"
        );


    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Something went wrong"
            );

        }


        return data;


    } catch (error) {

        console.error(
            "API Error:",
            error
        );

        throw error;

    }

}


/* =========================================================
   FORM DATA API REQUEST
========================================================= */

async function apiFormDataRequest(
    endpoint,
    formData,
    options = {}
) {

    const token =
        localStorage.getItem(
            "social_token"
        );


    const headers = {

        ...(options.headers || {})

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    /*
     * IMPORTANT:
     *
     * Do NOT set Content-Type manually.
     *
     * The browser automatically creates
     * the multipart/form-data boundary.
     */


    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {

                    ...options,

                    method:
                        options.method ||
                        "POST",

                    headers,

                    body:
                        formData

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Something went wrong"
            );

        }


        return data;


    } catch (error) {

        console.error(
            "FormData API Error:",
            error
        );

        throw error;

    }

}


/* =========================================================
   AUTH
========================================================= */

async function registerUser(
    userData
) {

    return apiRequest(
        "/auth/register",
        {

            method: "POST",

            body:
                JSON.stringify(
                    userData
                )

        }
    );

}


async function loginUser(
    credentials
) {

    return apiRequest(
        "/auth/login",
        {

            method: "POST",

            body:
                JSON.stringify(
                    credentials
                )

        }
    );

}


async function getCurrentUser() {

    return apiRequest(
        "/auth/me"
    );

}


/* =========================================================
   POSTS
========================================================= */

async function getFeed() {

    return apiRequest(
        "/posts"
    );

}


async function createPost(
    content,
    imageUrl = ""
) {

    return apiRequest(
        "/posts",
        {

            method: "POST",

            body:
                JSON.stringify({

                    content,

                    image_url:
                        imageUrl ||
                        null

                })

        }
    );

}


async function deletePost(
    postId
) {

    return apiRequest(
        `/posts/${postId}`,
        {

            method: "DELETE"

        }
    );

}


/* =========================================================
   LIKES
========================================================= */

async function toggleLike(
    postId
) {

    return apiRequest(
        `/likes/${postId}`,
        {

            method: "POST"

        }
    );

}


async function getLikeCount(
    postId
) {

    return apiRequest(
        `/likes/${postId}`
    );

}


/* =========================================================
   COMMENTS
========================================================= */

async function getComments(
    postId
) {

    return apiRequest(
        `/comments/${postId}`
    );

}


async function addComment(
    postId,
    content
) {

    return apiRequest(
        `/comments/${postId}`,
        {

            method: "POST",

            body:
                JSON.stringify({
                    content
                })

        }
    );

}


async function deleteComment(
    commentId
) {

    return apiRequest(
        `/comments/${commentId}`,
        {

            method: "DELETE"

        }
    );

}


/* =========================================================
   FOLLOWS
========================================================= */

async function toggleFollow(
    userId
) {

    return apiRequest(
        `/follows/${userId}`,
        {

            method: "POST"

        }
    );

}


async function getFollowStatus(
    userId
) {

    return apiRequest(
        `/follows/${userId}/status`
    );

}


async function getFollowers(
    userId
) {

    return apiRequest(
        `/follows/${userId}/followers`
    );

}


async function getFollowing(
    userId
) {

    return apiRequest(
        `/follows/${userId}/following`
    );

}


/* =========================================================
   USERS
========================================================= */

async function getUserProfile(
    userId
) {

    return apiRequest(
        `/users/${userId}`
    );

}


async function getUserPosts(
    userId
) {

    return apiRequest(
        `/users/${userId}/posts`
    );

}


async function searchUsers(
    query
) {

    return apiRequest(
        `/users/search?q=${encodeURIComponent(query)}`
    );

}


/* =========================================================
   UPDATE PROFILE — JSON
========================================================= */

async function updateUserProfile(
    profileData
) {

    return apiRequest(
        "/users/profile",
        {

            method: "PUT",

            body:
                JSON.stringify(
                    profileData
                )

        }
    );

}


/* =========================================================
   UPDATE PROFILE — IMAGE UPLOAD
========================================================= */

async function updateUserProfileWithImage(
    profileData,
    imageFile
) {

    const formData =
        new FormData();


    formData.append(
        "name",
        profileData.name
    );


    formData.append(
        "username",
        profileData.username
    );


    formData.append(
        "bio",
        profileData.bio || ""
    );


    if (imageFile) {

        formData.append(
            "profile_image",
            imageFile
        );

    }


    return apiFormDataRequest(
        "/users/profile",
        formData,
        {
            method: "PUT"
        }
    );

}