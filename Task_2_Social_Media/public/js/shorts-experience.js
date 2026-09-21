/* =========================================================
   VIBE DISCOVER — CLEAN EXPERIENCE LAYER
   Does NOT modify shorts.js or shorts.css.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const grid = document.getElementById("shortsGrid");

    if (!grid) return;

    const SAVED_KEY = "vibe_saved_shorts";

    const categoryConfig = {
        internship: {
            icon: "fa-briefcase",
            label: "Internship Opportunity"
        },

        job: {
            icon: "fa-building",
            label: "Career Opportunity"
        },

        hackathon: {
            icon: "fa-fire",
            label: "Hackathon"
        },

        scholarship: {
            icon: "fa-graduation-cap",
            label: "Scholarship"
        },

        news: {
            icon: "fa-newspaper",
            label: "Tech News"
        },

        education: {
            icon: "fa-book-open",
            label: "Learning"
        },

        aptitude: {
            icon: "fa-brain",
            label: "Aptitude"
        },

        coding: {
            icon: "fa-code",
            label: "Coding"
        },

        riddle: {
            icon: "fa-lightbulb",
            label: "Riddle"
        },

        joke: {
            icon: "fa-face-laugh",
            label: "Developer Lounge"
        }
    };

    /* =====================================================
       BASIC HELPERS
       ===================================================== */

    function escapeHTML(value) {

        const div = document.createElement("div");

        div.textContent = value || "";

        return div.innerHTML;
    }

    function getSaved() {

        try {
            return JSON.parse(
                localStorage.getItem(SAVED_KEY)
            ) || [];
        } catch {
            return [];
        }
    }

    function setSaved(items) {

        localStorage.setItem(
            SAVED_KEY,
            JSON.stringify(items)
        );
    }

    function getCategory(card) {

        if (!card) return null;

        const direct =
            card.dataset.category ||
            card.getAttribute("data-category");

        if (direct && categoryConfig[direct.toLowerCase()]) {
            return direct.toLowerCase();
        }

        const badge = card.querySelector(
            ".short-category-badge, [class*='category-badge']"
        );

        if (badge) {

            const text =
                badge.textContent
                    .trim()
                    .toLowerCase();

            for (const category of Object.keys(categoryConfig)) {

                if (text.includes(category)) {
                    return category;
                }
            }
        }

        const text =
            card.textContent.toLowerCase();

        for (const category of Object.keys(categoryConfig)) {

            if (text.includes(category)) {
                return category;
            }
        }

        return null;
    }

    function getShortId(card) {

        return (
            card.dataset.id ||
            card.dataset.shortId ||
            card.getAttribute("data-id") ||
            card.getAttribute("data-short-id") ||
            null
        );
    }

    function getTitle(card) {

        const title = card.querySelector(
            ".short-title, .short-card-title, h2, h3, h4"
        );

        return title
            ? title.textContent.trim()
            : "Vibe Short";
    }

    function getContent(card) {

        const selectors = [
            ".short-content",
            ".short-text",
            ".short-card-content",
            ".short-description"
        ];

        for (const selector of selectors) {

            const element =
                card.querySelector(selector);

            if (
                element &&
                element.textContent.trim()
            ) {
                return element.textContent.trim();
            }
        }

        return "";
    }

    /* =====================================================
       REMOVE DUPLICATE USERNAME
       Keep display name, remove separate @username line.
       ===================================================== */

    function cleanAuthorDisplay(card) {

        const elements =
            card.querySelectorAll(
                "span, small, div, p"
            );

        elements.forEach((element) => {

            if (
                element.children.length === 0 &&
                /^@[a-zA-Z0-9._-]+$/.test(
                    element.textContent.trim()
                )
            ) {

                element.classList.add(
                    "vibe-hidden-username"
                );
            }
        });
    }

    /* =====================================================
       DETAILS MODAL
       ===================================================== */

    function createDetailsModal() {

        if (
            document.getElementById(
                "vibeDetailsOverlay"
            )
        ) {
            return;
        }

        const overlay =
            document.createElement("div");

        overlay.id =
            "vibeDetailsOverlay";

        overlay.className =
            "vibe-details-overlay";

        overlay.innerHTML = `
            <div class="vibe-details-modal">

                <div class="vibe-details-top">

                    <div>

                        <div
                            id="vibeDetailsCategory"
                            class="vibe-details-category">
                        </div>

                        <h2
                            id="vibeDetailsTitle"
                            class="vibe-details-title">
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="vibe-details-close"
                        id="vibeDetailsClose">

                        <i class="fas fa-xmark"></i>

                    </button>

                </div>

                <div
                    id="vibeDetailsMeta"
                    class="vibe-details-meta">
                </div>

                <div
                    id="vibeDetailsBody"
                    class="vibe-details-body">
                </div>

                <div class="vibe-details-footer">

                    <button
                        type="button"
                        class="short-experience-btn"
                        id="vibeDetailsDone">

                        Done

                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {

            overlay.classList.remove(
                "active"
            );
        };

        document
            .getElementById("vibeDetailsClose")
            ?.addEventListener(
                "click",
                close
            );

        document
            .getElementById("vibeDetailsDone")
            ?.addEventListener(
                "click",
                close
            );

        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === overlay
                ) {
                    close();
                }
            }
        );
    }

    function openDetails(card, category) {

        createDetailsModal();

        const config =
            categoryConfig[category];

        const overlay =
            document.getElementById(
                "vibeDetailsOverlay"
            );

        document.getElementById(
            "vibeDetailsCategory"
        ).innerHTML = `
            <i class="fas ${config.icon}"></i>
            ${escapeHTML(config.label)}
        `;

        document.getElementById(
            "vibeDetailsTitle"
        ).textContent =
            getTitle(card);

        document.getElementById(
            "vibeDetailsBody"
        ).textContent =
            getContent(card);

        const meta =
            document.getElementById(
                "vibeDetailsMeta"
            );

        meta.innerHTML = "";

        const metadata = {

            internship: [
                "Career",
                "Internship"
            ],

            job: [
                "Career",
                "Job"
            ],

            hackathon: [
                "Hackathon",
                "Build",
                "Innovation"
            ],

            scholarship: [
                "Scholarship",
                "Education"
            ],

            news: [
                "Technology",
                "News"
            ],

            education: [
                "Learning",
                "Skills"
            ],

            joke: [
                "Developer",
                "Community"
            ]
        };

        (
            metadata[category] || []
        ).forEach((item) => {

            const span =
                document.createElement("span");

            span.textContent = item;

            meta.appendChild(span);
        });

        overlay.classList.add("active");
    }

    /* =====================================================
       SAVE
       ===================================================== */

    function setupSave(button, card) {

        const id = getShortId(card);

        if (!id) return;

        const saved =
            getSaved();

        updateSave(
            button,
            saved.includes(String(id))
        );

        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                let items =
                    getSaved();

                const index =
                    items.indexOf(
                        String(id)
                    );

                if (index === -1) {

                    items.push(
                        String(id)
                    );

                } else {

                    items.splice(
                        index,
                        1
                    );
                }

                setSaved(items);

                updateSave(
                    button,
                    items.includes(
                        String(id)
                    )
                );
            }
        );
    }

    function updateSave(
        button,
        saved
    ) {

        button.classList.toggle(
            "saved",
            saved
        );

        button.innerHTML = saved
            ? `<i class="fas fa-bookmark"></i> Saved`
            : `<i class="far fa-bookmark"></i> Save`;
    }

    /* =====================================================
       CATEGORY-SPECIFIC ENHANCEMENT
       ===================================================== */

    function enhanceCard(card) {

        if (
            !(card instanceof HTMLElement)
        ) {
            return;
        }

        const category =
            getCategory(card);

        if (
            !category ||
            !categoryConfig[category]
        ) {
            return;
        }

        card.classList.add(
            `vibe-category-${category}`
        );

        cleanAuthorDisplay(card);

        /* -----------------------------------------------
           Remove old injected elements from previous version
           ----------------------------------------------- */

        card
            .querySelectorAll(
                ".short-experience-label, .vibe-challenge-panel, .vibe-meta-row, .vibe-opportunity-tag"
            )
            .forEach((element) => {
                element.remove();
            });

        /* -----------------------------------------------
           News
           ----------------------------------------------- */

        if (
            category === "news"
        ) {

            card.classList.add(
                "vibe-news-card"
            );

            if (
                !card.querySelector(
                    ".vibe-news-source"
                )
            ) {

                const content =
                    getContent(card);

                let source = "";

                if (
                    /reuters/i.test(
                        content
                    )
                ) {
                    source = "Reuters";
                }

                if (
                    /indian express/i.test(
                        content
                    )
                ) {
                    source =
                        "The Indian Express";
                }

                if (
                    /business standard/i.test(
                        content
                    )
                ) {
                    source =
                        "Business Standard";
                }

                if (source) {

                    const sourceElement =
                        document.createElement(
                            "div"
                        );

                    sourceElement.className =
                        "vibe-news-source";

                    sourceElement.innerHTML = `
                        <i class="fas fa-globe"></i>
                        <span>
                            ${escapeHTML(source)}
                        </span>
                    `;

                    card.appendChild(
                        sourceElement
                    );
                }
            }
        }

        /* -----------------------------------------------
           Opportunity / News / Education / Joke
           ----------------------------------------------- */

        const actionableCategories = [
            "internship",
            "job",
            "hackathon",
            "scholarship",
            "education",
            "news",
            "joke"
        ];

        if (
            actionableCategories.includes(
                category
            )
        ) {

            if (
                !card.querySelector(
                    ".short-experience-actions"
                )
            ) {

                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "short-experience-actions";

                const details =
                    document.createElement(
                        "button"
                    );

                details.type = "button";

                details.className =
                    "short-experience-btn";

                let buttonText =
                    "Explore Details";

                if (
                    category === "news"
                ) {
                    buttonText =
                        "Read Update";
                }

                if (
                    category === "education"
                ) {
                    buttonText =
                        "Read More";
                }

                if (
                    category === "joke"
                ) {
                    buttonText =
                        "Reveal";
                }

                details.innerHTML = `
                    <i class="fas fa-arrow-up-right-from-square"></i>
                    ${buttonText}
                `;

                details.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();
                        event.stopPropagation();

                        openDetails(
                            card,
                            category
                        );
                    }
                );

                const save =
                    document.createElement(
                        "button"
                    );

                save.type = "button";

                save.className =
                    "short-experience-save";

                actions.appendChild(
                    details
                );

                actions.appendChild(
                    save
                );

                card.appendChild(
                    actions
                );

                setupSave(
                    save,
                    card
                );
            }
        }
    }

    /* =====================================================
       CATEGORY FILTER → CREATE BUTTON
       ===================================================== */

    function setupCategoryBehavior() {

        const createButton =
            document.getElementById(
                "createShortBtn"
            );

        if (!createButton) {
            return;
        }

        function updateCreateVisibility(
            category
        ) {

            const normalized =
                String(category || "all")
                    .toLowerCase();

            if (
                normalized === "all"
            ) {

                createButton.style.display =
                    "";

            } else {

                createButton.style.display =
                    "none";
            }
        }

        document.addEventListener(
            "click",
            (event) => {

                const button =
                    event.target.closest(
                        "[data-category], .category-btn, .category-chip"
                    );

                if (!button) {
                    return;
                }

                const category =
                    button.dataset.category ||
                    button.getAttribute(
                        "data-category"
                    ) ||
                    button.textContent
                        .trim()
                        .toLowerCase();

                updateCreateVisibility(
                    category
                );
            }
        );
    }

    /* =====================================================
       REMOVE SECTION HEADERS FROM OLD VERSION
       ===================================================== */

    function removeOldSectionHeaders() {

        grid
            .querySelectorAll(
                ".vibe-section-divider"
            )
            .forEach((element) => {

                element.remove();
            });
    }

    /* =====================================================
       ENHANCE EVERYTHING
       ===================================================== */

    function enhanceAll() {

        removeOldSectionHeaders();

        const cards =
            [...grid.children]
                .filter(
                    (element) =>
                        element instanceof HTMLElement
                );

        cards.forEach(
            enhanceCard
        );
    }

    setupCategoryBehavior();

    enhanceAll();

    const observer =
        new MutationObserver(() => {

            requestAnimationFrame(
                enhanceAll
            );

        });

    observer.observe(
        grid,
        {
            childList: true
        }
    );

});