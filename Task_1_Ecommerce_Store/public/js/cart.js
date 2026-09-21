// =========================================================
// SHOPSPHERE CART
// =========================================================

let cartItems = [];
let cartSubtotal = 0;

// =========================================================
// LOAD CART
// =========================================================

async function loadCart() {

    const loading =
        document.getElementById(
            "cart-loading"
        );

    const content =
        document.getElementById(
            "cart-content"
        );

    const emptyCart =
        document.getElementById(
            "empty-cart"
        );

    const errorBox =
        document.getElementById(
            "cart-error"
        );


    // Make sure user is logged in
    if (!requireLogin()) {
        return;
    }


    // Reset page states

    loading.classList.remove(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );

    emptyCart.classList.add(
        "hidden"
    );

    errorBox.classList.add(
        "hidden"
    );


    try {

        // GET /api/cart
        // The backend identifies the user from the JWT token.

        const data =
            await apiRequest(
                "/cart"
            );


        cartItems =
            data.cart || [];


        cartSubtotal =
            Number(
                data.total || 0
            );


        updateCartCount();


        // EMPTY CART

        if (cartItems.length === 0) {

            loading.classList.add(
                "hidden"
            );

            emptyCart.classList.remove(
                "hidden"
            );

            updateCartSummary(0);

            return;
        }


        // RENDER CART

        renderCartItems();

        updateCartSummary(
            cartSubtotal
        );


        loading.classList.add(
            "hidden"
        );

        content.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            "Load cart error:",
            error
        );

        loading.classList.add(
            "hidden"
        );


        showCartError(
            error.message ||
            "Something went wrong while loading your cart."
        );
    }
}


// =========================================================
// RENDER CART ITEMS
// =========================================================

function renderCartItems() {

    const container =
        document.getElementById(
            "cart-items-container"
        );


    if (!container) return;


    container.innerHTML =
        cartItems.map(item => {

        const price =
            Number(item.price);

        const subtotal =
            Number(item.subtotal);


        const imageHTML =
            item.image_url

            ? `
                <img
                    src="${item.image_url}"
                    alt="${item.name}"
                    class="cart-product-image"
                    loading="lazy"
                >
              `

            : `
                <div class="cart-product-placeholder">
                    <i class="fa-solid fa-box-open"></i>
                </div>
              `;


        return `
            <article
                class="cart-item"
                data-product-id="${item.product_id}"
            >

                <div class="cart-item-image">
                    ${imageHTML}
                </div>


                <div class="cart-item-details">

                    <span class="cart-item-category">
                        ${item.category || "General"}
                    </span>

                    <h3>
                        ${item.name}
                    </h3>

                    <p class="cart-item-price">
                        ₹${price.toLocaleString("en-IN")}
                    </p>

                </div>


                <div class="cart-item-quantity">

                    <span class="quantity-label">
                        Quantity
                    </span>

                    <div class="cart-quantity-control">

                        <button
                            type="button"
                            class="cart-quantity-btn"
                            onclick="decreaseCartQuantity(${item.product_id}, ${item.quantity})"
                            aria-label="Decrease quantity"
                        >
                            <i class="fa-solid fa-minus"></i>
                        </button>

                        <span class="cart-quantity">
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            class="cart-quantity-btn"
                            onclick="increaseCartQuantity(${item.product_id}, ${item.quantity})"
                            aria-label="Increase quantity"
                        >
                            <i class="fa-solid fa-plus"></i>
                        </button>

                    </div>

                </div>


                <div class="cart-item-subtotal">

                    <span class="subtotal-label">
                        Subtotal
                    </span>

                    <strong>
                        ₹${subtotal.toLocaleString("en-IN")}
                    </strong>

                </div>


                <button
                    type="button"
                    class="remove-cart-item"
                    onclick="removeCartItem(${item.product_id})"
                    aria-label="Remove ${item.name}"
                    title="Remove item"
                >

                    <i class="fa-solid fa-trash-can"></i>

                </button>

            </article>
        `;

    }).join("");


    updateItemCount();
}


// =========================================================
// INCREASE QUANTITY
// =========================================================

async function increaseCartQuantity(
    productId,
    currentQuantity
) {

    const item =
        cartItems.find(
            cartItem =>
                Number(
                    cartItem.product_id
                ) === Number(productId)
        );


    if (!item) return;


    const newQuantity =
        Number(currentQuantity) + 1;


    await updateCartQuantity(
        productId,
        newQuantity
    );
}


// =========================================================
// DECREASE QUANTITY
// =========================================================

async function decreaseCartQuantity(
    productId,
    currentQuantity
) {

    const newQuantity =
        Number(currentQuantity) - 1;


    if (newQuantity < 1) {

        await removeCartItem(
            productId
        );

        return;
    }


    await updateCartQuantity(
        productId,
        newQuantity
    );
}


// =========================================================
// UPDATE QUANTITY
// =========================================================

async function updateCartQuantity(
    productId,
    quantity
) {

    if (!requireLogin()) {
        return;
    }


    try {

        await apiRequest(
            "/cart",
            {

                method: "PUT",

                body: JSON.stringify({

                    product_id:
                        productId,

                    quantity:
                        quantity

                })

            }
        );


        showCartToast(
            "Cart quantity updated"
        );


        await loadCart();


    } catch (error) {

        console.error(
            "Update quantity error:",
            error
        );


        showCartToast(
            error.message ||
            "Unable to update quantity"
        );
    }
}


// =========================================================
// REMOVE CART ITEM
// =========================================================

async function removeCartItem(
    productId
) {

    if (!requireLogin()) {
        return;
    }


    try {

        await apiRequest(
            "/cart",
            {

                method: "DELETE",

                body: JSON.stringify({

                    product_id:
                        productId

                })

            }
        );


        showCartToast(
            "Product removed from cart"
        );


        await loadCart();


    } catch (error) {

        console.error(
            "Remove cart item error:",
            error
        );


        showCartToast(
            error.message ||
            "Unable to remove product"
        );
    }
}


// =========================================================
// CLEAR CART
// =========================================================

async function clearCart() {

    if (!requireLogin()) {
        return;
    }


    if (cartItems.length === 0) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to clear your cart?"
        );


    if (!confirmed) {
        return;
    }


    try {

        // DELETE /api/cart/clear
        // The backend identifies the user from the JWT token.

        await apiRequest(
            "/cart/clear",
            {
                method: "DELETE"
            }
        );


        showCartToast(
            "Cart cleared successfully"
        );


        await loadCart();


    } catch (error) {

        console.error(
            "Clear cart error:",
            error
        );


        showCartToast(
            error.message ||
            "Unable to clear cart"
        );
    }
}


// =========================================================
// UPDATE CART SUMMARY
// =========================================================

function updateCartSummary(
    subtotal
) {

    const subtotalElement =
        document.getElementById(
            "cart-subtotal"
        );

    const shippingElement =
        document.getElementById(
            "cart-shipping"
        );

    const totalElement =
        document.getElementById(
            "cart-total"
        );


    if (
        !subtotalElement ||
        !shippingElement ||
        !totalElement
    ) {

        return;
    }


    const amount =
        Number(subtotal) || 0;


    // Free shipping above ₹999

    const shipping =
        amount >= 999 ||
        amount === 0
            ? 0
            : 49;


    const total =
        amount + shipping;


    subtotalElement.textContent =
        `₹${amount.toLocaleString("en-IN")}`;


    shippingElement.textContent =
        shipping === 0
            ? "FREE"
            : `₹${shipping.toLocaleString("en-IN")}`;


    totalElement.textContent =
        `₹${total.toLocaleString("en-IN")}`;
}


// =========================================================
// UPDATE ITEM COUNT
// =========================================================

function updateItemCount() {

    const element =
        document.getElementById(
            "cart-item-count"
        );


    if (!element) return;


    const count =
        cartItems.length;


    element.textContent =
        `${count} ${
            count === 1
                ? "item"
                : "items"
        }`;
}


// =========================================================
// UPDATE NAVBAR CART COUNT
// =========================================================

async function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cart-count"
        );


    if (!cartCount) return;


    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        cartCount.textContent =
            "0";

        return;
    }


    try {

        // GET /api/cart
        // The backend identifies the user from the JWT token.

        const data =
            await apiRequest(
                "/cart"
            );


        const items =
            data.cart || [];


        const count =
            items.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.quantity || 0
                    ),
                0
            );


        cartCount.textContent =
            count;


    } catch (error) {

        console.error(
            "Cart count error:",
            error
        );


        cartCount.textContent =
            "0";
    }
}


// =========================================================
// CART ERROR
// =========================================================

function showCartError(
    message
) {

    const errorBox =
        document.getElementById(
            "cart-error"
        );

    const messageElement =
        document.getElementById(
            "cart-error-message"
        );

    const content =
        document.getElementById(
            "cart-content"
        );

    const loading =
        document.getElementById(
            "cart-loading"
        );

    const emptyCart =
        document.getElementById(
            "empty-cart"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }


    if (content) {

        content.classList.add(
            "hidden"
        );
    }


    if (emptyCart) {

        emptyCart.classList.add(
            "hidden"
        );
    }


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    if (errorBox) {

        errorBox.classList.remove(
            "hidden"
        );
    }
}


// =========================================================
// TOAST
// =========================================================

function showCartToast(
    message
) {

    const existing =
        document.querySelector(
            ".cart-toast"
        );


    if (existing) {
        existing.remove();
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "cart-toast";


    toast.textContent =
        message;


    toast.setAttribute(
        "role",
        "alert"
    );


    document.body.appendChild(
        toast
    );


    setTimeout(() => {

        toast.classList.add(
            "show"
        );

    }, 100);


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2700);


    setTimeout(() => {

        toast.remove();

    }, 3000);
}


// =========================================================
// CHECKOUT
// =========================================================

function proceedToCheckout() {

    if (cartItems.length === 0) {

        showCartToast(
            "Your cart is empty."
        );

        return;
    }


    window.location.href =
        "checkout.html";
}


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCart();


        document
            .getElementById(
                "clear-cart-btn"
            )
            ?.addEventListener(
                "click",
                clearCart
            );


        document
            .getElementById(
                "checkout-btn"
            )
            ?.addEventListener(
                "click",
                proceedToCheckout
            );


        document
            .getElementById(
                "retry-cart-btn"
            )
            ?.addEventListener(
                "click",
                loadCart
            );

    }
);