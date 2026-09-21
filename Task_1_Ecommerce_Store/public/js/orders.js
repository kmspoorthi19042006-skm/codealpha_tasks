// =========================================================
// SHOPSPHERE ORDERS PAGE
// =========================================================

let userOrders = [];


// =========================================================
// LOAD ORDERS
// =========================================================

async function loadOrders() {

    const loading =
        document.getElementById("orders-loading");

    const content =
        document.getElementById("orders-content");

    const emptyOrders =
        document.getElementById("empty-orders");

    const errorBox =
        document.getElementById("orders-error");


    // Login required

    if (!requireLogin()) {
        return;
    }


    loading?.classList.remove("hidden");

    content?.classList.add("hidden");

    emptyOrders?.classList.add("hidden");

    errorBox?.classList.add("hidden");


    try {

        /*
         * IMPORTANT:
         * The backend identifies the logged-in user
         * from the JWT token.
         *
         * We do NOT send userId in the URL.
         */

        const data =
            await apiRequest("/orders");


        userOrders =
            data.orders || [];


        // Update cart number

        updateOrdersCartCount();


        // =====================================================
        // NO ORDERS
        // =====================================================

        if (userOrders.length === 0) {

            loading?.classList.add("hidden");

            emptyOrders?.classList.remove("hidden");

            return;
        }


        // =====================================================
        // RENDER ORDERS
        // =====================================================

        renderOrders();


        loading?.classList.add("hidden");

        content?.classList.remove("hidden");


    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        loading?.classList.add("hidden");


        showOrdersError(
            error.message ||
            "Unable to load your orders."
        );
    }
}


// =========================================================
// RENDER ORDERS
// =========================================================

function renderOrders() {

    const container =
        document.getElementById(
            "orders-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        userOrders.map(order => {

            const total =
                Number(order.total_amount);


            const date =
                formatOrderDate(
                    order.created_at
                );


            const statusClass =
                getStatusClass(
                    order.status
                );


            return `

                <article
                    class="order-card"
                    data-order-id="${order.id}">


                    <!-- ORDER HEADER -->

                    <div class="order-card-header">

                        <div class="order-number">

                            <span>
                                ORDER
                            </span>

                            <strong>
                                #${order.id}
                            </strong>

                        </div>


                        <span
                            class="order-status ${statusClass}">

                            <i class="fa-solid fa-circle"></i>

                            ${escapeHTML(order.status)}

                        </span>

                    </div>


                    <!-- ORDER INFORMATION -->

                    <div class="order-card-info">


                        <div class="order-info-item">

                            <span>
                                <i class="fa-regular fa-calendar"></i>
                                Order Date
                            </span>

                            <strong>
                                ${date}
                            </strong>

                        </div>


                        <div class="order-info-item">

                            <span>
                                <i class="fa-solid fa-location-dot"></i>
                                Shipping Address
                            </span>

                            <strong
                                title="${escapeHTML(
                                    order.shipping_address
                                )}">

                                ${escapeHTML(
                                    order.shipping_address
                                )}

                            </strong>

                        </div>


                        <div class="order-info-item">

                            <span>
                                <i class="fa-solid fa-indian-rupee-sign"></i>
                                Order Total
                            </span>

                            <strong>
                                ₹${total.toLocaleString("en-IN")}
                            </strong>

                        </div>


                    </div>


                    <!-- ORDER FOOTER -->

                    <div class="order-card-footer">

                        <span class="order-footer-note">

                            <i class="fa-solid fa-shield-halved"></i>

                            Securely processed order

                        </span>


                        <a
                            href="order-details.html?id=${order.id}"
                            class="order-view-btn">

                            View Order

                            <i class="fa-solid fa-arrow-right"></i>

                        </a>

                    </div>


                </article>

            `;

        }).join("");


    updateOrdersCount();
}


// =========================================================
// ORDER COUNT
// =========================================================

function updateOrdersCount() {

    const countElement =
        document.getElementById(
            "orders-count"
        );


    if (!countElement) {
        return;
    }


    const count =
        userOrders.length;


    countElement.textContent =
        `${count} ${
            count === 1
                ? "order"
                : "orders"
        }`;
}


// =========================================================
// CART COUNT
// =========================================================

async function updateOrdersCartCount() {

    const cartCount =
        document.getElementById(
            "cart-count"
        );


    if (!cartCount) {
        return;
    }


    /*
     * The backend identifies the logged-in user
     * from the JWT token.
     *
     * Do NOT send userId here.
     */

    if (!localStorage.getItem("token")) {

        cartCount.textContent = "0";

        return;
    }


    try {

        const data =
            await apiRequest("/cart");


        const items =
            data.cart || [];


        const count =
            items.reduce(
                (total, item) =>
                    total +
                    Number(item.quantity || 0),
                0
            );


        cartCount.textContent =
            count;


    } catch (error) {

        console.error(
            "Orders cart count error:",
            error
        );

        cartCount.textContent = "0";
    }
}


// =========================================================
// STATUS CLASS
// =========================================================

function getStatusClass(status) {

    switch (status) {

        case "Pending":
            return "status-pending";

        case "Processing":
            return "status-processing";

        case "Shipped":
            return "status-shipped";

        case "Delivered":
            return "status-delivered";

        case "Cancelled":
            return "status-cancelled";

        default:
            return "status-pending";
    }
}


// =========================================================
// DATE FORMAT
// =========================================================

function formatOrderDate(dateValue) {

    if (!dateValue) {
        return "Date unavailable";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
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


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// ERROR
// =========================================================

function showOrdersError(message) {

    const loading =
        document.getElementById(
            "orders-loading"
        );

    const content =
        document.getElementById(
            "orders-content"
        );

    const emptyOrders =
        document.getElementById(
            "empty-orders"
        );

    const errorBox =
        document.getElementById(
            "orders-error"
        );

    const errorMessage =
        document.getElementById(
            "orders-error-message"
        );


    loading?.classList.add("hidden");

    content?.classList.add("hidden");

    emptyOrders?.classList.add("hidden");


    if (errorMessage) {

        errorMessage.textContent =
            message;
    }


    errorBox?.classList.remove(
        "hidden"
    );
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadOrders();


        document
            .getElementById(
                "retry-orders-btn"
            )
            ?.addEventListener(
                "click",
                loadOrders
            );

    }
);