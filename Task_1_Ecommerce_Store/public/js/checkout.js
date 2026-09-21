// =========================================================
// SHOPSPHERE CHECKOUT
// =========================================================

if (!requireLogin()) {
    // Stop execution if user is not logged in
} else {

    const checkoutLoading =
        document.getElementById("checkout-loading");

    const checkoutContent =
        document.getElementById("checkout-content");

    const checkoutError =
        document.getElementById("checkout-error");

    const checkoutErrorMessage =
        document.getElementById("checkout-error-message");

    const checkoutForm =
        document.getElementById("checkout-form");

    const checkoutItems =
        document.getElementById("checkout-items");

    const checkoutItemCount =
        document.getElementById("checkout-item-count");

    const subtotalElement =
        document.getElementById("checkout-subtotal");

    const shippingElement =
        document.getElementById("checkout-shipping");

    const totalElement =
        document.getElementById("checkout-total");

    const checkoutMessage =
        document.getElementById("checkout-message");


    let cartItems = [];

    let subtotal = 0;

    let shipping = 0;

    let total = 0;


    // =========================================================
    // SHOW CHECKOUT
    // =========================================================

    function showCheckoutContent() {

        if (checkoutLoading) {
            checkoutLoading.classList.add("hidden");
        }

        if (checkoutError) {
            checkoutError.classList.add("hidden");
        }

        if (checkoutContent) {
            checkoutContent.classList.remove("hidden");
        }
    }


    // =========================================================
    // SHOW CHECKOUT ERROR
    // =========================================================

    function showCheckoutError(message) {

        if (checkoutLoading) {
            checkoutLoading.classList.add("hidden");
        }

        if (checkoutContent) {
            checkoutContent.classList.add("hidden");
        }

        if (checkoutErrorMessage) {
            checkoutErrorMessage.textContent =
                message ||
                "Something went wrong while preparing checkout.";
        }

        if (checkoutError) {
            checkoutError.classList.remove("hidden");
        }
    }


    // =========================================================
    // LOAD CART
    // =========================================================

    async function loadCheckoutCart() {

        try {

            const data =
                await apiRequest("/cart");


            cartItems =
                data.cart || [];


            // EMPTY CART

            if (cartItems.length === 0) {

                if (checkoutLoading) {
                    checkoutLoading.classList.add("hidden");
                }

                if (checkoutContent) {
                    checkoutContent.classList.add("hidden");
                }

                if (checkoutError) {
                    checkoutError.classList.add("hidden");
                }

                if (checkoutItems) {

                    checkoutItems.innerHTML = `
                        <div class="empty-cart-message">

                            <i class="fa-solid fa-cart-shopping"></i>

                            <h3>
                                Your cart is empty
                            </h3>

                            <p>
                                Add some products before proceeding to checkout.
                            </p>

                            <a
                                href="index.html"
                                class="btn btn-primary"
                            >
                                Continue Shopping
                            </a>

                        </div>
                    `;
                }

                return;
            }


            // CALCULATE TOTALS

            calculateTotals();


            // RENDER ITEMS

            renderCheckoutItems();


            // SHOW CHECKOUT PAGE

            showCheckoutContent();


        } catch (error) {

            console.error(
                "Error loading checkout cart:",
                error
            );


            showCheckoutError(
                error.message ||
                "Unable to prepare checkout."
            );
        }
    }


    // =========================================================
    // CALCULATE TOTALS
    // =========================================================

    function calculateTotals() {

        subtotal =
            cartItems.reduce(
                (sum, item) =>
                    sum +
                    Number(item.price) *
                    Number(item.quantity),
                0
            );


        // Free shipping for ₹999 or above

        shipping =
            subtotal >= 999
                ? 0
                : 49;


        total =
            subtotal + shipping;


        if (subtotalElement) {

            subtotalElement.textContent =
                `₹${subtotal.toFixed(2)}`;
        }


        if (shippingElement) {

            shippingElement.textContent =
                shipping === 0
                    ? "FREE"
                    : `₹${shipping.toFixed(2)}`;
        }


        if (totalElement) {

            totalElement.textContent =
                `₹${total.toFixed(2)}`;
        }


        if (checkoutItemCount) {

            checkoutItemCount.textContent =
                `${cartItems.length} ${
                    cartItems.length === 1
                        ? "item"
                        : "items"
                }`;
        }
    }


    // =========================================================
    // RENDER CHECKOUT ITEMS
    // =========================================================

    function renderCheckoutItems() {

        if (!checkoutItems) {
            return;
        }


        checkoutItems.innerHTML = "";


        cartItems.forEach(item => {

            const itemSubtotal =
                Number(item.price) *
                Number(item.quantity);


            const itemElement =
                document.createElement("div");


            itemElement.className =
                "checkout-item";


            itemElement.innerHTML = `

                <div class="checkout-item-image">

                    <img
                        src="${
                            item.image_url ||
                            "https://via.placeholder.com/100"
                        }"
                        alt="${escapeHTML(item.name)}"
                    >

                </div>


                <div class="checkout-item-info">

                    <h4>
                        ${escapeHTML(item.name)}
                    </h4>


                    <p>
                        Quantity:
                        <strong>
                            ${item.quantity}
                        </strong>
                    </p>


                    <p>
                        Price:
                        ₹${Number(item.price).toFixed(2)}
                    </p>

                </div>


                <div class="checkout-item-total">

                    ₹${itemSubtotal.toFixed(2)}

                </div>

            `;


            checkoutItems.appendChild(
                itemElement
            );
        });
    }


    // =========================================================
    // PLACE ORDER
    // =========================================================

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const shippingAddress =
                    document
                        .getElementById(
                            "shipping-address"
                        )
                        ?.value
                        .trim();


                // VALIDATE ADDRESS

                if (!shippingAddress) {

                    showCheckoutMessage(
                        "Please enter your shipping address.",
                        "error"
                    );

                    return;
                }


                // VALIDATE CART

                if (cartItems.length === 0) {

                    showCheckoutMessage(
                        "Your cart is empty.",
                        "error"
                    );

                    return;
                }


                const submitButton =
                    checkoutForm.querySelector(
                        'button[type="submit"]'
                    );


                try {

                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        submitButton.querySelector("span")
                            ?.replaceChildren(
                                document.createTextNode(
                                    "Placing Order..."
                                )
                            );

                        if (
                            !submitButton.querySelector("span")
                        ) {
                            submitButton.textContent =
                                "Placing Order...";
                        }
                    }


                    /*
                     * The user ID is NOT sent from the frontend.
                     *
                     * The backend gets the logged-in user's
                     * ID from the JWT token.
                     */

                    const data =
                        await apiRequest(
                            "/orders",
                            {
                                method: "POST",

                                body: JSON.stringify({
                                    shipping_address:
                                        shippingAddress
                                })
                            }
                        );


                    if (data.success) {

                        showCheckoutMessage(
                            "Order placed successfully!",
                            "success"
                        );


                        setTimeout(() => {

                            window.location.href =
                                `orders.html?order=${data.order.id}`;

                        }, 800);


                    } else {

                        throw new Error(
                            data.message ||
                            "Unable to place order."
                        );
                    }


                } catch (error) {

                    console.error(
                        "Checkout error:",
                        error
                    );


                    showCheckoutMessage(
                        error.message ||
                        "Something went wrong while placing your order.",
                        "error"
                    );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        const span =
                            submitButton.querySelector(
                                "span"
                            );

                        if (span) {

                            span.textContent =
                                "Place Order";

                        } else {

                            submitButton.textContent =
                                "Place Order";
                        }
                    }
                }
            }
        );
    }


    // =========================================================
    // CHECKOUT MESSAGE
    // =========================================================

    function showCheckoutMessage(
        message,
        type
    ) {

        if (!checkoutMessage) {
            return;
        }


        checkoutMessage.textContent =
            message;


        checkoutMessage.className =
            type === "success"
                ? "success-message"
                : "error-message";


        checkoutMessage.classList.remove(
            "hidden"
        );
    }


    // =========================================================
    // HTML ESCAPE
    // =========================================================

    function escapeHTML(value) {

        const div =
            document.createElement("div");


        div.textContent =
            value ?? "";


        return div.innerHTML;
    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadCheckoutCart();

}