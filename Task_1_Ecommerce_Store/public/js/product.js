// =========================================================
// SHOPSPHERE PRODUCT DETAILS
// =========================================================

let currentProduct = null;
let currentQuantity = 1;

// =========================================================
// GET PRODUCT ID FROM URL
// =========================================================

function getProductId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


// =========================================================
// LOAD PRODUCT
// =========================================================

async function loadProduct() {

    const productId =
        getProductId();

    const loading =
        document.getElementById(
            "product-loading"
        );

    const productDetails =
        document.getElementById(
            "product-details"
        );

    const errorBox =
        document.getElementById(
            "product-error"
        );


    if (!productId) {

        loading?.classList.add("hidden");
        errorBox?.classList.remove("hidden");

        return;
    }


    try {

        const data =
            await apiRequest(
                `/products/${productId}`
            );


        currentProduct =
            data.product;


        if (!currentProduct) {
            throw new Error(
                "Product not found"
            );
        }


        currentQuantity = 1;

        updateQuantityDisplay();

        renderProduct(
            currentProduct
        );


        loading?.classList.add("hidden");

        productDetails?.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        loading?.classList.add("hidden");

        errorBox?.classList.remove(
            "hidden"
        );
    }
}


// =========================================================
// RENDER PRODUCT
// =========================================================

function renderProduct(product) {

    document.title =
        `${product.name} | ShopSphere`;


    const category =
        document.getElementById(
            "product-category"
        );

    const name =
        document.getElementById(
            "product-name"
        );

    const price =
        document.getElementById(
            "product-price"
        );

    const description =
        document.getElementById(
            "product-description"
        );


    if (category) {

        category.textContent =
            product.category ||
            "General";
    }


    if (name) {

        name.textContent =
            product.name;
    }


    if (price) {

        price.textContent =
            `₹${Number(product.price)
                .toLocaleString("en-IN")}`;
    }


    if (description) {

        description.textContent =
            product.description ||
            "Premium quality product.";
    }


    // =====================================================
    // STOCK
    // =====================================================

    const stockElement =
        document.getElementById(
            "product-stock"
        );


    if (stockElement) {

        if (Number(product.stock) > 0) {

            stockElement.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                ${product.stock} items available
            `;

            stockElement.className =
                "details-stock details-stock-available";

        } else {

            stockElement.innerHTML = `
                <i class="fa-solid fa-circle-xmark"></i>
                Out of stock
            `;

            stockElement.className =
                "details-stock details-stock-unavailable";
        }
    }


    // =====================================================
    // PRODUCT IMAGE
    // =====================================================

    const image =
        document.getElementById(
            "product-image"
        );


    const imageContainer =
        document.getElementById(
            "product-image-container"
        );


    if (image && product.image_url) {

        image.src =
            product.image_url;

        image.alt =
            product.name;

        image.style.display =
            "block";

    } else if (imageContainer) {

        imageContainer.innerHTML = `
            <div class="product-detail-placeholder">

                <i class="fa-solid fa-box-open"></i>

                <span>
                    No image available
                </span>

            </div>
        `;
    }


    // =====================================================
    // ADD TO CART BUTTON
    // =====================================================

    const addButton =
        document.getElementById(
            "add-to-cart-btn"
        );


    if (!addButton) return;


    if (Number(product.stock) <= 0) {

        addButton.disabled = true;

        addButton.innerHTML = `
            <i class="fa-solid fa-ban"></i>
            Out of Stock
        `;

    } else {

        addButton.disabled = false;

        addButton.innerHTML = `
            <i class="fa-solid fa-cart-plus"></i>
            Add to Cart
        `;
    }
}


// =========================================================
// QUANTITY CONTROLS
// =========================================================

function updateQuantityDisplay() {

    const quantity =
        document.getElementById(
            "quantity"
        );


    if (quantity) {

        quantity.textContent =
            currentQuantity;
    }
}


// =========================================================
// INCREASE QUANTITY
// =========================================================

function increaseQuantity() {

    if (!currentProduct) return;


    const stock =
        Number(currentProduct.stock);


    if (currentQuantity < stock) {

        currentQuantity++;

        updateQuantityDisplay();

    } else {

        showProductToast(
            `Only ${stock} items available.`
        );
    }
}


// =========================================================
// DECREASE QUANTITY
// =========================================================

function decreaseQuantity() {

    if (currentQuantity > 1) {

        currentQuantity--;

        updateQuantityDisplay();
    }
}


// =========================================================
// ADD TO CART
// =========================================================

async function addProductToCart() {

    const token =
        localStorage.getItem("token");


    // LOGIN CHECK

    if (!token) {

        showProductToast(
            "Please login to add products to your cart."
        );


        if (currentProduct) {

            setTimeout(() => {

                window.location.href =
                    `login.html?redirect=product.html?id=${currentProduct.id}`;

            }, 1000);

        } else {

            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1000);
        }


        return;
    }


    if (!currentProduct) {
        return;
    }


    // CHECK STOCK

    if (
        currentQuantity < 1 ||
        currentQuantity >
        Number(currentProduct.stock)
    ) {

        showProductToast(
            "Selected quantity is not available."
        );

        return;
    }


    try {

        const button =
            document.getElementById(
                "add-to-cart-btn"
            );


        if (button) {

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Adding...
            `;
        }


        // =================================================
        // ADD PRODUCT TO CART
        // =================================================

        await apiRequest("/cart", {

            method: "POST",

            body: JSON.stringify({

                product_id:
                    currentProduct.id,

                quantity:
                    currentQuantity

            })
        });


        showProductToast(
            "✅ Product added to cart"
        );


        await updateCartCount();


        // Restore button

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-cart-plus"></i>
                Add to Cart
            `;
        }


    } catch (error) {

        console.error(
            "Add to cart error:",
            error
        );


        showProductToast(
            error.message ||
            "Unable to add product to cart"
        );


        const button =
            document.getElementById(
                "add-to-cart-btn"
            );


        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-cart-plus"></i>
                Add to Cart
            `;
        }
    }
}


// =========================================================
// CART COUNT
// =========================================================

async function updateCartCount() {

    const cartCount =
        document.getElementById(
            "cart-count"
        );


    if (!cartCount) return;


    const token =
        localStorage.getItem("token");


    if (!token) {

        cartCount.textContent = "0";

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
            await apiRequest(
                `/cart/${userId}`
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

        cartCount.textContent = "0";
    }
}


// =========================================================
// TOAST
// =========================================================

function showProductToast(message) {

    const existing =
        document.querySelector(
            ".product-toast"
        );


    if (existing) {
        existing.remove();
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "product-toast";

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
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProduct();

        updateCartCount();


        document
            .getElementById(
                "increase-quantity"
            )
            ?.addEventListener(
                "click",
                increaseQuantity
            );


        document
            .getElementById(
                "decrease-quantity"
            )
            ?.addEventListener(
                "click",
                decreaseQuantity
            );


        document
            .getElementById(
                "add-to-cart-btn"
            )
            ?.addEventListener(
                "click",
                addProductToCart
            );

    }
);