document.addEventListener("DOMContentLoaded", () => {

    // Make sure the user is logged in
    if (!requireLogin()) {
        return;
    }

    loadOrderDetails();
    updateCartCount();
});


// ============================================
// LOAD ORDER DETAILS
// ============================================

async function loadOrderDetails() {

    const loading = document.getElementById("order-loading");
    const errorBox = document.getElementById("order-error");
    const content = document.getElementById("order-content");

    try {

        // Get order ID from URL
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("id");

        if (!orderId) {
            throw new Error("No order ID was provided.");
        }

        // Get order from backend
        const data = await apiRequest(`/orders/${orderId}`);

        if (!data.success || !data.order) {
            throw new Error(data.message || "Order not found.");
        }

        // Hide loading
        loading.classList.add("hidden");

        // Show content
        content.classList.remove("hidden");

        renderOrder(data.order, data.items || []);

    } catch (error) {

        console.error("Load order details error:", error);

        loading.classList.add("hidden");
        content.classList.add("hidden");
        errorBox.classList.remove("hidden");

        const errorMessage =
            document.getElementById("order-error-message");

        if (errorMessage) {
            errorMessage.textContent =
                error.message || "Unable to load order details.";
        }
    }
}


// ============================================
// RENDER ORDER
// ============================================

function renderOrder(order, items) {

    // Order ID
    document.getElementById("order-id").textContent =
        `#${order.id}`;


    // Order date
    document.getElementById("order-date").textContent =
        formatDate(order.created_at);


    // Status
    const statusElement =
        document.getElementById("order-status");

    statusElement.textContent = order.status;

    statusElement.className =
        `status-badge status-${order.status.toLowerCase()}`;


    // Shipping address
    document.getElementById("shipping-address").textContent =
        order.shipping_address;


    // Items count
    const totalQuantity = items.reduce(
        (total, item) => total + Number(item.quantity),
        0
    );

    document.getElementById("items-count").textContent =
        `${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`;


    // Render items
    renderOrderItems(items);


    // Calculate subtotal
    const subtotal = items.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    );


    // Same shipping rule used in cart and checkout
    const shipping =
        subtotal === 0 || subtotal >= 999
            ? 0
            : 49;


    const total = subtotal + shipping;


    // Display amounts
    document.getElementById("order-subtotal").textContent =
        formatCurrency(subtotal);

    document.getElementById("order-shipping").textContent =
        shipping === 0
            ? "FREE"
            : formatCurrency(shipping);

    document.getElementById("order-total").textContent =
        formatCurrency(total);
}


// ============================================
// RENDER ORDER ITEMS
// ============================================

function renderOrderItems(items) {

    const container =
        document.getElementById("order-items");

    if (!items || items.length === 0) {

        container.innerHTML = `
            <div class="empty-order-items">
                <i class="fa-solid fa-box-open"></i>
                <p>No items found for this order.</p>
            </div>
        `;

        return;
    }


    container.innerHTML = items.map(item => {

        const price =
            Number(item.price);

        const quantity =
            Number(item.quantity);

        const subtotal =
            price * quantity;


        return `
            <div class="order-item">

                <div class="order-item-icon">
                    <i class="fa-solid fa-box"></i>
                </div>

                <div class="order-item-info">

                    <h3>
                        ${escapeHtml(item.name)}
                    </h3>

                    <p>
                        Quantity: ${quantity}
                    </p>

                </div>

                <div class="order-item-price">

                    <span class="item-unit-price">
                        ${formatCurrency(price)} × ${quantity}
                    </span>

                    <strong>
                        ${formatCurrency(subtotal)}
                    </strong>

                </div>

            </div>
        `;

    }).join("");
}


// ============================================
// FORMAT CURRENCY
// ============================================

function formatCurrency(amount) {

    return `₹${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateString) {

    if (!dateString) {
        return "N/A";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ============================================
// UPDATE CART COUNT
// ============================================

async function updateCartCount() {

    try {

        const userId = getUserId();

        if (!userId) {
            return;
        }

        const data =
            await apiRequest(`/cart/${userId}`);

        const cartCount =
            document.getElementById("cart-count");

        if (!cartCount) {
            return;
        }

        const count = data.cart
            ? data.cart.reduce(
                (total, item) =>
                    total + Number(item.quantity),
                0
            )
            : 0;

        cartCount.textContent = count;

    } catch (error) {

        console.error(
            "Error updating cart count:",
            error
        );

    }
}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}