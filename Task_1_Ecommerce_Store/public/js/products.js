// =========================================================
// SHOPSPHERE PRODUCTS
// =========================================================

let allProducts = [];
let filteredProducts = [];

// =========================================================
// LOAD PRODUCTS
// =========================================================

async function loadProducts() {

    const container =
        document.getElementById("products-container");

    const noProducts =
        document.getElementById("no-products");

    try {

        container.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading products...</p>
            </div>
        `;

        const data = await apiRequest("/products");

        allProducts = data.products || [];

        filteredProducts = [...allProducts];

        populateCategories();

        applyFilters();

    } catch (error) {

        console.error("Failed to load products:", error);

        container.innerHTML = `
            <div class="loading">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <p>Unable to load products</p>

                <small>${error.message}</small>

            </div>
        `;

        if (noProducts) {
            noProducts.classList.add("hidden");
        }
    }
}


// =========================================================
// POPULATE CATEGORIES
// =========================================================

function populateCategories() {

    const categoryFilter =
        document.getElementById("category-filter");

    if (!categoryFilter) return;

    const categories = [
        ...new Set(
            allProducts
                .map(product => product.category)
                .filter(Boolean)
        )
    ];

    categoryFilter.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;

    categories.forEach(category => {

        categoryFilter.innerHTML += `
            <option value="${category}">
                ${category}
            </option>
        `;
    });
}


// =========================================================
// PRODUCT FILTER LOGIC
// =========================================================

function applyFilters() {

    let products = [...allProducts];

    const searchText =
        document.getElementById("search-input")
            ?.value
            .toLowerCase()
            .trim() || "";

    const category =
        document.getElementById("category-filter")
            ?.value || "all";

    const sort =
        document.getElementById("sort-products")
            ?.value || "default";


    // SEARCH

    if (searchText) {

        products = products.filter(product =>

            (product.name || "")
                .toLowerCase()
                .includes(searchText)

            ||

            (product.description || "")
                .toLowerCase()
                .includes(searchText)

            ||

            (product.category || "")
                .toLowerCase()
                .includes(searchText)
        );
    }


    // CATEGORY FILTER

    if (category !== "all") {

        products = products.filter(product =>
            product.category === category
        );
    }


    // SORT

    switch (sort) {

        case "price-low":

            products.sort(
                (a, b) =>
                    Number(a.price) -
                    Number(b.price)
            );

            break;


        case "price-high":

            products.sort(
                (a, b) =>
                    Number(b.price) -
                    Number(a.price)
            );

            break;


        case "name":

            products.sort(
                (a, b) =>
                    (a.name || "")
                        .localeCompare(b.name || "")
            );

            break;


        default:
            break;
    }


    filteredProducts = products;

    renderProducts(products);
}


// =========================================================
// RENDER PRODUCTS
// =========================================================

function renderProducts(products) {

    const container =
        document.getElementById("products-container");

    const noProducts =
        document.getElementById("no-products");


    if (!container) return;


    if (!products.length) {

        container.innerHTML = "";

        if (noProducts) {
            noProducts.classList.remove("hidden");
        }

        return;
    }


    if (noProducts) {
        noProducts.classList.add("hidden");
    }


    container.innerHTML =
        products.map(product => {


        const imageHTML = product.image_url

            ? `
                <img
                    src="${product.image_url}"
                    alt="${product.name}"
                    loading="lazy"
                >
              `

            : `
                <div class="product-placeholder">
                    <i class="fa-solid fa-box-open"></i>
                </div>
              `;


        const rating = (
            4 + Math.random()
        ).toFixed(1);


        const stockClass =
            product.stock > 0
                ? "in-stock"
                : "out-stock";


        const stockText =
            product.stock > 0
                ? `${product.stock} left`
                : "Out of stock";


        const discountBadge =
            product.stock > 0 &&
            product.stock <= 5

            ? `
                <span class="product-badge">
                    Hot Deal
                </span>
              `

            : "";


        const addButton =
            product.stock > 0

            ? `
                <button
                    class="btn btn-primary"
                    onclick="addToCart(${product.id})"
                >
                    <i class="fa-solid fa-cart-plus"></i>
                    Add
                </button>
              `

            : `
                <button
                    class="btn btn-primary"
                    disabled
                >
                    Out of Stock
                </button>
              `;


        return `

            <div class="product-card">

                ${discountBadge}

                <div class="product-image">
                    ${imageHTML}
                </div>

                <div class="product-info">

                    <div class="product-category">
                        ${product.category || "General"}
                    </div>

                    <h3>
                        ${product.name}
                    </h3>

                    <div class="product-rating">
                        ⭐ ${rating}
                    </div>

                    <p class="product-description">
                        ${
                            product.description ||
                            "Premium quality product."
                        }
                    </p>

                    <div class="product-bottom">

                        <span class="product-price">
                            ₹${Number(
                                product.price
                            ).toLocaleString("en-IN")}
                        </span>

                        <span
                            class="product-stock ${stockClass}"
                        >
                            ${stockText}
                        </span>

                    </div>

                    <div class="product-actions">

                        <a
                            href="product.html?id=${product.id}"
                            class="btn btn-outline"
                        >
                            View
                        </a>

                        ${addButton}

                    </div>

                </div>

            </div>

        `;

    }).join("");
}


// =========================================================
// CATEGORY CLICK
// =========================================================

function selectCategory(category) {

    const categoryFilter =
        document.getElementById(
            "category-filter"
        );

    if (!categoryFilter) return;

    categoryFilter.value = category;

    applyFilters();

    document
        .getElementById("products")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}


// =========================================================
// ADD TO CART
// =========================================================

async function addToCart(productId) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        showToast(
            "Please login to add products to your cart."
        );

        setTimeout(() => {

            window.location.href =
                `login.html?redirect=index.html#products`;

        }, 1000);

        return;
    }


    try {

        await apiRequest("/cart", {

            method: "POST",

            body: JSON.stringify({

                product_id: productId,

                quantity: 1

            })
        });


        showToast(
            "✅ Product added to cart"
        );


        await updateCartCount();


    } catch (error) {

        console.error(
            "Add to cart error:",
            error
        );


        showToast(
            error.message ||
            "Unable to add product to cart"
        );
    }
}


// =========================================================
// UPDATE CART COUNT
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


    try {

        // The backend identifies the logged-in
        // user using the JWT token.

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
                    Number(item.quantity || 0),
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
// TOAST MESSAGE
// =========================================================

function showToast(message) {

    const existingToast =
        document.querySelector(".toast");


    if (existingToast) {
        existingToast.remove();
    }


    const toast =
        document.createElement("div");


    toast.className = "toast";

    toast.textContent = message;

    toast.setAttribute(
        "role",
        "alert"
    );


    document.body.appendChild(
        toast
    );


    setTimeout(() => {

        toast.classList.add("show");

    }, 100);


    setTimeout(() => {

        toast.classList.remove("show");

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

        loadProducts();

        updateCartCount();


        document
            .getElementById("search-input")
            ?.addEventListener(
                "input",
                applyFilters
            );


        document
            .getElementById("category-filter")
            ?.addEventListener(
                "change",
                applyFilters
            );


        document
            .getElementById("sort-products")
            ?.addEventListener(
                "change",
                applyFilters
            );


        document
            .querySelectorAll(
                ".category-card"
            )
            .forEach(card => {

                card.addEventListener(
                    "click",
                    () => {

                        const category =
                            card.dataset.category;


                        if (category) {

                            selectCategory(
                                category
                            );

                        }

                    }
                );

            });

    }
);