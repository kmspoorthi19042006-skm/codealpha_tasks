// =========================================================
// SHOPSPHERE PROFILE PAGE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // Make sure the customer is logged in
    if (!requireLogin()) {
        return;
    }


    // Get logged-in user
    const user = getLoggedInUser();


    if (!user) {
        window.location.href = "login.html";
        return;
    }


    // Display user information
    const profileName =
        document.getElementById("profile-name");

    const profileEmail =
        document.getElementById("profile-email");

    const detailName =
        document.getElementById("detail-name");

    const detailEmail =
        document.getElementById("detail-email");

    const detailRole =
        document.getElementById("detail-role");


    const userName =
        user.name || "Customer";

    const userEmail =
        user.email || "No email available";

    const userRole =
        user.role || "user";


    if (profileName) {
        profileName.textContent = userName;
    }

    if (profileEmail) {
        profileEmail.textContent = userEmail;
    }

    if (detailName) {
        detailName.textContent = userName;
    }

    if (detailEmail) {
        detailEmail.textContent = userEmail;
    }

    if (detailRole) {
        detailRole.textContent =
            userRole === "admin"
                ? "Administrator"
                : "Customer";
    }


    // Update cart count
    updateProfileCartCount();


    // Logout
    const logoutButton =
        document.getElementById("logout-btn");


    logoutButton?.addEventListener("click", () => {

        const confirmed = confirm(
            "Are you sure you want to logout?"
        );


        if (!confirmed) {
            return;
        }


        logoutUser();

    });

});


// =========================================================
// CART COUNT
// =========================================================

async function updateProfileCartCount() {

    const cartCount =
        document.getElementById("cart-count");


    if (!cartCount) {
        return;
    }


    const userId =
        getUserId();


    if (!userId) {

        cartCount.textContent = "0";

        return;
    }


    try {

        const data =
            await apiRequest(`/cart/${userId}`);


        const items =
            data.cart || [];


        const count =
            items.reduce(
                (total, item) =>
                    total + Number(item.quantity || 0),
                0
            );


        cartCount.textContent =
            count;


    } catch (error) {

        console.error(
            "Profile cart count error:",
            error
        );

        cartCount.textContent = "0";

    }

}