const state = {
    route: "home",
    products: [],
    reels: [],
    cart: { items: [], count: 0, total: 0 },
    category: "All",
    search: "",
    muted: true,
    activeReelId: null,
    commentsReelId: null,
    couponApplied: false,
    spent: Number(localStorage.getItem("shopreel_spent") || 0),
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }
    return data;
}

function toast(message, icon = "check-circle") {
    const stack = $("#toastStack");
    const item = document.createElement("div");
    item.className = "toast";
    item.innerHTML = `<i class="ph ph-${icon}"></i><span>${escapeHtml(message)}</span>`;
    stack.appendChild(item);
    setTimeout(() => {
        item.classList.add("out");
        setTimeout(() => item.remove(), 260);
    }, 2600);
}

function setRoute(route) {
    state.route = route;
    $$(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === route));
    $$(".nav-link, .mobile-nav-link").forEach((button) => {
        button.classList.toggle("active", button.dataset.route === route);
    });

    if (route === "home") renderHome();
    if (route === "reels") renderReels();
    if (route === "shop") renderShop();
    if (route === "cart") renderCart();
    if (route === "profile") renderProfile();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
    const picks = state.products.slice(0, 4);
    $("#homeProducts").innerHTML = picks.map(productCard).join("");
}

function productCard(product) {
    return `
        <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-label="View ${escapeHtml(product.name)}">
            <div class="product-image-wrap">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
                <span class="category-label">${escapeHtml(product.category)}</span>
            </div>
            <div class="product-body">
                <h3>${escapeHtml(product.name)}</h3>
                <div class="product-meta">
                    <span class="product-price">${money(product.price)}</span>
                    <button class="add-mini" data-add-product="${product.id}" aria-label="Add ${escapeHtml(product.name)} to cart">
                        <i class="ph ph-plus"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}

async function loadProducts() {
    state.products = await api("/api/products");
    renderHome();
    renderShop();
}

async function loadReels() {
    state.reels = await api("/api/reels");
    if (state.route === "reels") renderReels();
    renderProfile();
}

async function loadCart() {
    state.cart = await api("/api/cart");
    updateCartBadges();
    if (state.route === "cart") renderCart();
    renderProfile();
}

function renderShop() {
    const grid = $("#shopProducts");
    const term = state.search.toLowerCase().trim();
    const filtered = state.products.filter((p) => {
        const categoryMatch = state.category === "All" || p.category === state.category;
        const searchMatch = !term || [p.name, p.category, p.description].some(v => v.toLowerCase().includes(term));
        return categoryMatch && searchMatch;
    });

    grid.innerHTML = filtered.map(productCard).join("");
    $("#shopEmpty").classList.toggle("hidden", filtered.length !== 0);
}

function updateCartBadges() {
    const count = state.cart.count || 0;
    $("#desktopCartBadge").textContent = count;
    $("#mobileCartBadge").textContent = count;
    $("#desktopCartBadge").classList.toggle("hidden", count === 0);
    $("#mobileCartBadge").classList.toggle("hidden", count === 0);
}

function renderCart() {
    const items = state.cart.items || [];
    $("#cartEmpty").classList.toggle("hidden", items.length > 0);

    $("#cartItems").innerHTML = items.map((item) => `
        <div class="cart-item">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
            <div class="cart-item-info">
                <h3>${escapeHtml(item.name)}</h3>
                <p>${escapeHtml(item.category)} · ${money(item.price)} each</p>
                <div class="cart-item-price">${money(item.price * item.quantity)}</div>
            </div>
            <div class="qty-control">
                <button data-cart-delta="-1" data-product-id="${item.product_id}" aria-label="Decrease quantity"><i class="ph ph-minus"></i></button>
                <span>${item.quantity}</span>
                <button data-cart-delta="1" data-product-id="${item.product_id}" aria-label="Increase quantity"><i class="ph ph-plus"></i></button>
            </div>
            <button class="remove-btn" data-remove-product="${item.product_id}" aria-label="Remove item"><i class="ph ph-trash"></i></button>
        </div>
    `).join("");

    const subtotal = Number(state.cart.total || 0);
    const shipping = subtotal === 0 ? 0 : (subtotal >= 999 ? 0 : 79);
    const discount = state.couponApplied ? subtotal * 0.10 : 0;
    const finalTotal = Math.max(0, subtotal + shipping - discount);

    $("#subtotal").textContent = money(subtotal);
    $("#shipping").textContent = shipping === 0 ? "FREE" : money(shipping);
    $("#discount").textContent = `−${money(discount)}`;
    $("#discountRow").classList.toggle("hidden", !state.couponApplied);
    $("#finalTotal").textContent = money(finalTotal);
    $("#checkoutBtn").disabled = items.length === 0;
}

function renderProfile() {
    const verified = state.reels.filter((r) => Number(r.is_certified_buyer) === 1).length;
    $("#verifiedStat").textContent = verified;
    $("#savedStat").textContent = Number(localStorage.getItem("shopreel_saved") || 0);
    $("#spentStat").textContent = money(state.spent);
}

function reelTemplate(reel) {
    const stars = "★".repeat(Math.round(Number(reel.buyer_rating) || 5));
    return `
        <article class="reel" data-reel-id="${reel.id}">
            <video
                src="${escapeHtml(reel.video_url)}"
                playsinline
                loop
                muted
                preload="metadata"
                aria-label="Reel by ${escapeHtml(reel.creator)}"
            ></video>

            <div class="reel-top">
                ${Number(reel.is_certified_buyer) === 1 ? `
                    <button class="certified-badge" data-verify-reel="${reel.id}">
                        <i class="ph ph-shield-check"></i>
                        Certified Buyer Review
                    </button>
                ` : `<span></span>`}
                <button class="sound-pill reel-mute-button" data-toggle-sound>
                    <i class="ph ph-speaker-slash"></i><span>Muted</span>
                </button>
            </div>

            <div class="reel-actions">
                <button class="reel-action like ${Number(reel.liked_by_user) ? "active" : ""}" data-like-reel="${reel.id}" aria-label="Like reel">
                    <i class="ph ${Number(reel.liked_by_user) ? "ph-heart-fill" : "ph-heart"}"></i>
                </button>
                <span class="action-count" data-like-count="${reel.id}">${reel.likes_count}</span>

                <button class="reel-action" data-comments-reel="${reel.id}" aria-label="Comments">
                    <i class="ph ph-chat-circle"></i>
                </button>
                <span class="action-count">${reel.comment_count}</span>

                <button class="reel-action" data-share-reel="${reel.id}" aria-label="Share">
                    <i class="ph ph-share-network"></i>
                </button>
            </div>

            <div class="reel-content">
                <div class="creator">${escapeHtml(reel.creator)}</div>
                <p class="reel-caption">${escapeHtml(reel.caption)}</p>
                <div class="rating">${stars} <span style="color:#aaa"> ${Number(reel.buyer_rating).toFixed(1)}</span></div>
                ${reel.product_id ? `
                    <div class="shop-overlay">
                        <img src="${escapeHtml(reel.product_image)}" alt="${escapeHtml(reel.product_name)}">
                        <div class="shop-overlay-copy">
                            <b>${escapeHtml(reel.product_name)}</b>
                            <span>${money(reel.product_price)}</span>
                        </div>
                        <button class="shop-now" data-add-product="${reel.product_id}">Shop Product</button>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}

let reelObserver = null;

function renderReels() {
    const feed = $("#reelsFeed");
    feed.innerHTML = state.reels.map(reelTemplate).join("");

    if (reelObserver) reelObserver.disconnect();

    reelObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = $("video", entry.target);
            if (!video) return;

            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                state.activeReelId = Number(entry.target.dataset.reelId);
                video.muted = state.muted;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { root: feed, threshold: [0.6] });

    $$(".reel", feed).forEach((reel) => reelObserver.observe(reel));
}

function showModal(id) {
    $("#modalBackdrop").classList.remove("hidden");
    $$(".modal").forEach((modal) => modal.classList.add("hidden"));
    $(`#${id}`).classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModals() {
    $("#modalBackdrop").classList.add("hidden");
    $$(".modal").forEach((modal) => modal.classList.add("hidden"));
    document.body.style.overflow = "";
}

async function openProduct(productId) {
    const product = state.products.find((p) => Number(p.id) === Number(productId)) ||
        await api(`/api/products/${productId}`);

    $("#productModalContent").innerHTML = `
        <div class="quickview-content">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
            <div class="quickview-info">
                <span class="eyebrow">${escapeHtml(product.category)}</span>
                <h2 id="productModalTitle">${escapeHtml(product.name)}</h2>
                <div class="quickview-price">${money(product.price)}</div>
                <p>${escapeHtml(product.description || "A ShopReel community pick.")}</p>
                <button class="primary-btn" data-add-product="${product.id}"><i class="ph ph-shopping-bag"></i> Add to Cart</button>
            </div>
        </div>
    `;
    showModal("productModal");
}

async function toggleLike(reelId, burst = false) {
    try {
        const result = await api(`/api/reels/${reelId}/like`, { method: "POST", body: "{}" });
        const reel = state.reels.find((r) => Number(r.id) === Number(reelId));
        if (reel) {
            reel.liked_by_user = result.liked ? 1 : 0;
            reel.likes_count = result.likes_count;
        }

        const button = $(`[data-like-reel="${reelId}"]`);
        if (button) {
            button.classList.toggle("active", result.liked);
            $("i", button).className = `ph ${result.liked ? "ph-heart-fill" : "ph-heart"}`;
        }
        const count = $(`[data-like-count="${reelId}"]`);
        if (count) count.textContent = result.likes_count;

        if (burst && result.liked) {
            const reelElement = $(`.reel[data-reel-id="${reelId}"]`);
            if (reelElement) {
                const heart = document.createElement("div");
                heart.className = "heart-burst";
                heart.innerHTML = '<i class="ph ph-heart-fill"></i>';
                reelElement.appendChild(heart);
                setTimeout(() => heart.remove(), 800);
            }
        }
    } catch (error) {
        toast(error.message, "warning-circle");
    }
}

async function openComments(reelId) {
    state.commentsReelId = reelId;
    const reel = state.reels.find((r) => Number(r.id) === Number(reelId));
    $("#commentsTitle").textContent = `Comments · ${reel?.creator || ""}`;
    await refreshComments();
    showModal("commentsModal");
}

async function refreshComments() {
    const comments = await api(`/api/reels/${state.commentsReelId}/comments`);
    $("#commentCountHeader").textContent = comments.length;
    $("#commentsList").innerHTML = comments.length
        ? comments.map((comment) => `
            <div class="comment">
                <div class="comment-avatar">${escapeHtml(comment.username.slice(0,2).toUpperCase())}</div>
                <div class="comment-body">
                    <b>${escapeHtml(comment.username)}</b>
                    <p>${escapeHtml(comment.comment_text)}</p>
                    <time>${escapeHtml(new Date(comment.created_at.replace(" ", "T") + "Z").toLocaleString())}</time>
                </div>
            </div>
        `).join("")
        : `<div class="empty-state"><i class="ph ph-chat-circle-dots"></i><h3>No comments yet</h3><p>Start the conversation.</p></div>`;
}

async function addProduct(productId) {
    try {
        await api("/api/cart/add", {
            method: "POST",
            body: JSON.stringify({ product_id: Number(productId), quantity: 1 }),
        });
        await loadCart();
        toast("Added to your cart", "shopping-bag");
    } catch (error) {
        toast(error.message, "warning-circle");
    }
}

function updateSoundUI() {
    const icon = state.muted ? "speaker-slash" : "speaker-high";
    const label = state.muted ? "Muted" : "Sound on";
    $("#soundToggle i").className = `ph ph-${icon}`;
    $("#reelsSoundPill").innerHTML = `<i class="ph ph-${icon}"></i><span>${label}</span>`;
    $$(".reel-mute-button").forEach((button) => {
        button.innerHTML = `<i class="ph ph-${icon}"></i><span>${label}</span>`;
    });
    $$(".reel video").forEach((video) => video.muted = state.muted);
}

function toggleSound() {
    state.muted = !state.muted;
    updateSoundUI();
    const active = state.activeReelId ? $(`.reel[data-reel-id="${state.activeReelId}"] video`) : null;
    if (active && !state.muted) active.play().catch(() => {});
}

function showVerification(reelId) {
    const reel = state.reels.find((r) => Number(r.id) === Number(reelId));
    if (!reel || !Number(reel.is_certified_buyer)) return;

    $("#verificationOrder").textContent = reel.order_verification_id || "Verified";
    $("#verificationRating").textContent = `${Number(reel.buyer_rating).toFixed(1)} / 5.0`;
    showModal("verificationModal");
}

async function shareReel(reelId) {
    const url = `${location.origin}${location.pathname}#reel-${reelId}`;
    try {
        if (navigator.share) {
            await navigator.share({ title: "ShopReel", text: "Check out this buyer reel on ShopReel.", url });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            toast("Reel link copied", "copy");
        } else {
            toast("Share is not available in this browser", "warning-circle");
        }
    } catch (error) {
        if (error.name !== "AbortError") toast("Could not share this reel", "warning-circle");
    }
}

async function checkout() {
    if (!state.cart.items.length) {
        toast("Your cart is empty", "shopping-bag-open");
        return;
    }

    const subtotal = Number(state.cart.total);
    const shipping = subtotal >= 999 ? 0 : 79;
    const discount = state.couponApplied ? subtotal * .1 : 0;
    const finalTotal = Math.max(0, subtotal + shipping - discount);

    try {
        const result = await api("/api/cart/checkout", { method: "POST", body: "{}" });
        state.spent += finalTotal;
        localStorage.setItem("shopreel_spent", String(state.spent));
        state.couponApplied = false;
        $("#couponInput").value = "";
        $("#couponMessage").textContent = "";
        $("#transactionId").textContent = result.transaction_id;
        await loadCart();
        renderProfile();
        showModal("successModal");
    } catch (error) {
        toast(error.message, "warning-circle");
    }
}

let searchTimer;
function setupEvents() {
    document.addEventListener("click", async (event) => {
        const routeButton = event.target.closest("[data-route]");
        if (routeButton) {
            setRoute(routeButton.dataset.route);
            return;
        }

        const closeButton = event.target.closest("[data-close-modal]");
        if (closeButton) {
            closeModals();
            return;
        }

        if (event.target.id === "modalBackdrop") {
            closeModals();
            return;
        }

        const addButton = event.target.closest("[data-add-product]");
        if (addButton) {
            event.stopPropagation();
            await addProduct(addButton.dataset.addProduct);
            return;
        }

        const productCardElement = event.target.closest(".product-card");
        if (productCardElement && !event.target.closest("button")) {
            await openProduct(productCardElement.dataset.productId);
            return;
        }

        const category = event.target.closest("[data-category]");
        if (category) {
            state.category = category.dataset.category;
            $$(".category-pill").forEach((pill) => pill.classList.toggle("active", pill === category));
            renderShop();
            return;
        }

        const like = event.target.closest("[data-like-reel]");
        if (like) {
            await toggleLike(like.dataset.likeReel);
            return;
        }

        const comments = event.target.closest("[data-comments-reel]");
        if (comments) {
            await openComments(comments.dataset.commentsReel);
            return;
        }

        const share = event.target.closest("[data-share-reel]");
        if (share) {
            await shareReel(share.dataset.shareReel);
            return;
        }

        const verify = event.target.closest("[data-verify-reel]");
        if (verify) {
            showVerification(verify.dataset.verifyReel);
            return;
        }

        const delta = event.target.closest("[data-cart-delta]");
        if (delta) {
            try {
                await api("/api/cart/update", {
                    method: "POST",
                    body: JSON.stringify({
                        product_id: Number(delta.dataset.productId),
                        delta: Number(delta.dataset.cartDelta),
                    }),
                });
                await loadCart();
            } catch (error) {
                toast(error.message, "warning-circle");
            }
            return;
        }

        const remove = event.target.closest("[data-remove-product]");
        if (remove) {
            try {
                await api("/api/cart/remove", {
                    method: "POST",
                    body: JSON.stringify({ product_id: Number(remove.dataset.removeProduct) }),
                });
                await loadCart();
                toast("Item removed", "trash");
            } catch (error) {
                toast(error.message, "warning-circle");
            }
            return;
        }

        if (event.target.closest("[data-toggle-sound]")) {
            toggleSound();
            return;
        }

        if (event.target.id === "soundToggle" || event.target.closest("#soundToggle")) {
            toggleSound();
        }
    });

    $("#productSearch").addEventListener("input", (event) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.search = event.target.value;
            renderShop();
        }, 180);
    });

    $("#clearSearch").addEventListener("click", () => {
        $("#productSearch").value = "";
        state.search = "";
        renderShop();
    });

    $("#reelsSoundPill").addEventListener("click", toggleSound);

    $("#applyCoupon").addEventListener("click", () => {
        const code = $("#couponInput").value.trim().toUpperCase();
        if (code === "SHOPREEL10") {
            if (!state.cart.items.length) {
                $("#couponMessage").textContent = "Add an item before applying the coupon.";
                return;
            }
            state.couponApplied = true;
            $("#couponMessage").textContent = "10% discount applied.";
            renderCart();
            toast("Coupon applied — 10% off", "ticket");
        } else {
            state.couponApplied = false;
            $("#couponMessage").textContent = "Invalid code. Try SHOPREEL10.";
            renderCart();
        }
    });

    $("#checkoutBtn").addEventListener("click", checkout);

    $("#commentForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = $("#commentText").value.trim();
        const username = $("#commentUsername").value.trim() || "guest_user";
        if (!text || !state.commentsReelId) return;

        try {
            await api(`/api/reels/${state.commentsReelId}/comments`, {
                method: "POST",
                body: JSON.stringify({ username, comment_text: text }),
            });
            $("#commentText").value = "";
            await refreshComments();
            toast("Comment posted", "chat-circle");
        } catch (error) {
            toast(error.message, "warning-circle");
        }
    });

    $("#profileEdit").addEventListener("click", () => {
        toast("Profile editing is simulated in this demo", "pencil-simple");
    });

    $("#reelsFeed").addEventListener("dblclick", async (event) => {
        const reel = event.target.closest(".reel");
        if (!reel || event.target.closest("button")) return;
        const reelData = state.reels.find((r) => Number(r.id) === Number(reel.dataset.reelId));
        if (reelData && !Number(reelData.liked_by_user)) {
            await toggleLike(reel.dataset.reelId, true);
        } else {
            const heart = document.createElement("div");
            heart.className = "heart-burst";
            heart.innerHTML = '<i class="ph ph-heart-fill"></i>';
            reel.appendChild(heart);
            setTimeout(() => heart.remove(), 800);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModals();
    });
}

async function boot() {
    setupEvents();
    updateSoundUI();

    try {
        await Promise.all([loadProducts(), loadReels(), loadCart()]);
        setRoute("home");
    } catch (error) {
        console.error(error);
        toast("Could not load ShopReel data", "warning-circle");
    }
}

boot();
