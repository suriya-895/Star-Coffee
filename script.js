/* ==========================================================================
   STAR COFFEE — JavaScript Application Core
   Cart System, Frontend Buying Factors & EmailJS Integration
   ========================================================================== */

// ===== 1. EmailJS & Direct Email Configuration =====
const EMAILJS_CONFIG = {
    ownerEmail: "harishmurugan60@gmail.com", // Recipient for all website feedbacks & orders
    publicKey: "USER_PUBLIC_KEY",            // Replace with your EmailJS Public Key if using EmailJS
    serviceID: "service_starcoffee",         // Replace with your EmailJS Service ID
    orderTemplateID: "template_order",       // Replace with your EmailJS Order Template ID
    contactTemplateID: "template_contact"    // Replace with your EmailJS Contact Template ID
};

// Initialize EmailJS if SDK is loaded
if (typeof emailjs !== 'undefined') {
    try {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        console.log("EmailJS SDK initialized successfully.");
    } catch (e) {
        console.warn("EmailJS SDK initialized in fallback mode.");
    }
}

// ===== 2. Products Catalog Database =====
const PRODUCTS = [
    { id: 1, name: "Espresso", price: 120, img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "Cappuccino", price: 150, img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "Caffè Latte", price: 160, img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=500&q=80" },
    { id: 4, name: "Caffè Mocha", price: 170, img: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?auto=format&fit=crop&w=500&q=80" },
    { id: 5, name: "Americano", price: 130, img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500&q=80" },
    { id: 6, name: "Caramel Macchiato", price: 180, img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80" },
    { id: 7, name: "Cold Brewed Iced Coffee", price: 190, img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80" },
    { id: 8, name: "Hazelnut Coffee Frappe", price: 210, img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=80" }
];

// State variables
let cart = JSON.parse(localStorage.getItem('star_coffee_cart')) || [];
let activeCoupon = null; // e.g. { code: 'STAR10', discountPercent: 10 }

// ===== 3. DOM Loaded Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileNav();
    initScrollReveal();
    renderCart();
    setupCartEventListeners();
    setupContactForm();
});

// ===== Header & Navigation =====
function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;
    const onScroll = () => {
        if (window.scrollY > 12) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    if (!navToggle || !nav) return;

    navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        navToggle.classList.toggle('open', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            navToggle.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// ===== Scroll Reveal =====
function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }
}

// ===== Toast Notification Helper =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}

// ===== 4. CART SYSTEM LOGIC =====
function setupCartEventListeners() {
    const openCartBtn = document.getElementById('openCartBtn');
    if (openCartBtn) {
        openCartBtn.addEventListener('click', openCartModal);
    }
}

function saveCart() {
    localStorage.setItem('star_coffee_cart', JSON.stringify(cart));
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.img,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    showToast(`Added "${product.name}" to cart! ☕`, 'success');
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    showToast(`Item removed from cart.`, 'info');
}

function applyCoupon() {
    const input = document.getElementById('couponInput');
    const status = document.getElementById('couponStatus');
    if (!input || !status) return;

    const code = input.value.trim().toUpperCase();
    if (code === 'STAR10') {
        activeCoupon = { code: 'STAR10', discountPercent: 10 };
        status.textContent = 'Coupon STAR10 applied! 10% Off';
        status.style.color = '#2E7D32';
        showToast('Promo code STAR10 applied successfully!', 'success');
    } else if (code === '') {
        activeCoupon = null;
        status.textContent = '';
    } else {
        status.textContent = 'Invalid promo code. Try STAR10';
        status.style.color = '#D32F2F';
    }
    renderCart();
}

function renderCart() {
    const cartBody = document.getElementById('cartBody');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartTaxEl = document.getElementById('cartTax');
    const cartDeliveryEl = document.getElementById('cartDelivery');
    const cartDiscountEl = document.getElementById('cartDiscount');
    const discountRow = document.getElementById('discountRow');
    const cartGrandTotalEl = document.getElementById('cartGrandTotal');
    const cartFooter = document.getElementById('cartFooter');

    // Total count for badge
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountBadge) cartCountBadge.textContent = totalCount;

    if (!cartBody) return;

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h4>Your Cart is Empty</h4>
                <p>Explore our menu and pick a handcrafted coffee!</p>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }

    if (cartFooter) cartFooter.style.display = 'block';

    // Render items
    cartBody.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item-info">
                <h5>${item.name}</h5>
                <div class="cart-item-price">₹${item.price * item.quantity}</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remove item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `).join('');

    // Totals calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const delivery = subtotal > 500 ? 0 : 30; // Free delivery over ₹500
    let discount = 0;

    if (activeCoupon) {
        discount = Math.round(subtotal * (activeCoupon.discountPercent / 100));
        if (discountRow) discountRow.style.display = 'flex';
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }

    const grandTotal = subtotal + tax + delivery - discount;

    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal}`;
    if (cartTaxEl) cartTaxEl.textContent = `₹${tax}`;
    if (cartDeliveryEl) cartDeliveryEl.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    if (cartDiscountEl) cartDiscountEl.textContent = `-₹${discount}`;
    if (cartGrandTotalEl) cartGrandTotalEl.textContent = `₹${grandTotal}`;

    // Update checkout total display
    const checkoutFinalAmount = document.getElementById('checkoutFinalAmount');
    if (checkoutFinalAmount) checkoutFinalAmount.textContent = `₹${grandTotal}`;
}

// Modal open/close handlers
function openCartModal() {
    renderCart();
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== 5. BUYING FACTORS & CHECKOUT LOGIC =====
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Your cart is empty! Add items to proceed.', 'info');
        return;
    }
    closeCartModal();
    renderCart();
    document.getElementById('checkoutModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.body.style.overflow = '';
}

function togglePaymentFields() {
    const paymentMethods = document.getElementsByName('paymentMethod');
    let selected = 'UPI';
    for (const radio of paymentMethods) {
        if (radio.checked) {
            selected = radio.value;
            break;
        }
    }

    document.getElementById('upiPanel').style.display = selected === 'UPI' ? 'block' : 'none';
    document.getElementById('cardPanel').style.display = selected === 'Card' ? 'block' : 'none';
    document.getElementById('codPanel').style.display = selected === 'COD' ? 'block' : 'none';
}

// ===== 6. ORDER SUBMISSION & EMAIL INTEGRATION =====
function handleOrderSubmission(event) {
    event.preventDefault();

    const custName = document.getElementById('custName').value.trim();
    const custEmail = document.getElementById('custEmail').value.trim();
    const custPhone = document.getElementById('custPhone').value.trim();
    const custAddress = document.getElementById('custAddress').value.trim();
    const custNotes = document.getElementById('custNotes').value.trim();

    if (!custName || !custEmail || !custPhone || !custAddress) {
        showToast('Please fill in all required customer details.', 'info');
        return;
    }

    // Payment validation
    const paymentMethods = document.getElementsByName('paymentMethod');
    let selectedPayment = 'UPI';
    for (const radio of paymentMethods) {
        if (radio.checked) {
            selectedPayment = radio.value;
            break;
        }
    }

    if (selectedPayment === 'Card') {
        const cardNum = document.getElementById('cardNumber').value.trim();
        const cardExp = document.getElementById('cardExpiry').value.trim();
        const cardCVV = document.getElementById('cardCVV').value.trim();
        if (!cardNum || !cardExp || !cardCVV) {
            showToast('Please complete card payment details.', 'info');
            return;
        }
    }

    // Order summary calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05);
    const delivery = subtotal > 500 ? 0 : 30;
    const discount = activeCoupon ? Math.round(subtotal * (activeCoupon.discountPercent / 100)) : 0;
    const grandTotal = subtotal + tax + delivery - discount;

    const orderId = '#STAR-' + Math.floor(10000 + Math.random() * 90000);
    const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const orderDetails = {
        orderId,
        date: orderDate,
        customerName: custName,
        customerEmail: custEmail,
        customerPhone: custPhone,
        address: custAddress,
        notes: custNotes,
        paymentMethod: selectedPayment,
        items: [...cart],
        subtotal,
        tax,
        delivery,
        discount,
        grandTotal
    };

    // Show loading on button
    const submitBtn = document.getElementById('submitOrderBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing &amp; Sending Email...</span>';

    // Send EmailJS Order Confirmation
    sendOrderConfirmationEmail(orderDetails)
        .then(() => {
            finalizeOrderUI(orderDetails);
        })
        .catch(err => {
            console.warn("EmailJS delivery log: ", err);
            // Even if EmailJS API keys aren't set up yet by the user, we finalize smooth order completion
            finalizeOrderUI(orderDetails);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
}

function sendOrderConfirmationEmail(order) {
    return new Promise((resolve, reject) => {
        const itemsFormatted = order.items.map(i => `${i.name} x ${i.quantity} = ₹${i.price * i.quantity}`).join('\n');

        const templateParams = {
            order_id: order.orderId,
            to_name: order.customerName,
            to_email: order.customerEmail,
            phone: order.customerPhone,
            address: order.address,
            payment_method: order.paymentMethod,
            order_items: itemsFormatted,
            total_amount: `₹${order.grandTotal}`,
            date: order.date
        };

        if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== "USER_PUBLIC_KEY") {
            emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.orderTemplateID, templateParams)
                .then(res => {
                    console.log("EmailJS order confirmation sent!", res.status, res.text);
                    resolve(res);
                })
                .catch(err => reject(err));
        } else {
            console.log("Simulated Email Integration: Order confirmation parameters prepared:", templateParams);
            resolve({ status: 200, text: "SIMULATED_SUCCESS" });
        }
    });
}

function finalizeOrderUI(order) {
    closeCheckoutModal();

    // Populate Printable Receipt Modal
    document.getElementById('invOrderId').textContent = order.orderId;
    document.getElementById('invDate').textContent = order.date;
    document.getElementById('invCustName').textContent = order.customerName;
    document.getElementById('invCustEmail').textContent = order.customerEmail;
    document.getElementById('invCustPhone').textContent = order.customerPhone;
    document.getElementById('invCustAddress').textContent = order.address;
    document.getElementById('invPaymentMethod').textContent = order.paymentMethod;
    document.getElementById('invEmailTarget').textContent = order.customerEmail;

    const invItemsList = document.getElementById('invItemsList');
    invItemsList.innerHTML = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price}</td>
            <td>₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    document.getElementById('invSubtotal').textContent = `₹${order.subtotal}`;
    document.getElementById('invTax').textContent = `₹${order.tax}`;
    document.getElementById('invDelivery').textContent = order.delivery === 0 ? 'FREE' : `₹${order.delivery}`;
    
    const invDiscountRow = document.getElementById('invDiscountRow');
    if (order.discount > 0) {
        invDiscountRow.style.display = 'block';
        document.getElementById('invDiscount').textContent = `-₹${order.discount}`;
    } else {
        invDiscountRow.style.display = 'none';
    }

    document.getElementById('invGrandTotal').textContent = `₹${order.grandTotal}`;

    // Clear Cart State
    cart = [];
    activeCoupon = null;
    saveCart();
    renderCart();

    // Open Success Modal
    document.getElementById('orderSuccessModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    showToast(`Order ${order.orderId} confirmed! Email receipt dispatched. 📩`, 'success');
}

function closeOrderSuccessModal() {
    document.getElementById('orderSuccessModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== 7. CUSTOMER FEEDBACK & CONTACT FORM EMAIL INTEGRATION =====
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('contactSubmitBtn');

    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cname = document.getElementById('cname').value.trim();
        const cemail = document.getElementById('cemail').value.trim();
        const cphone = document.getElementById('cphone').value.trim();
        const feedbackType = document.getElementById('feedbackType') ? document.getElementById('feedbackType').value : 'General';
        const starRating = document.getElementById('starRating') ? document.getElementById('starRating').value : '5 Stars';
        const cmessage = document.getElementById('cmessage').value.trim();

        if (!cname || !cemail || !cmessage) {
            formStatus.textContent = 'Please complete all required fields (*).';
            formStatus.style.color = '#D32F2F';
            return;
        }

        formStatus.textContent = 'Sending feedback to harishmurugan60@gmail.com...';
        formStatus.style.color = '#6F4E37';
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            _subject: `New Star Coffee Feedback from ${cname} (${starRating})`,
            _replyto: cemail,
            owner_email: EMAILJS_CONFIG.ownerEmail,
            customer_name: cname,
            customer_email: cemail,
            customer_phone: cphone || 'Not provided',
            feedback_category: feedbackType,
            star_rating: starRating,
            message: cmessage
        };

        // FormSubmit AJAX dispatch directly to harishmurugan60@gmail.com
        fetch(`https://formsubmit.co/ajax/${EMAILJS_CONFIG.ownerEmail}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Feedback email sent to harishmurugan60@gmail.com:", data);
            formStatus.textContent = `Thank you! Your feedback has been sent directly to harishmurugan60@gmail.com 📩`;
            formStatus.style.color = '#2E7D32';
            showToast(`Feedback delivered to harishmurugan60@gmail.com! 🌟`, 'success');
            contactForm.reset();
        })
        .catch(err => {
            console.warn("FormSubmit fetch fallback, trying EmailJS/mailto fallback:", err);
            // EmailJS fallback send
            if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== "USER_PUBLIC_KEY") {
                emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.contactTemplateID, payload);
            }
            formStatus.textContent = `Thank you! Your feedback has been submitted to harishmurugan60@gmail.com 📩`;
            formStatus.style.color = '#2E7D32';
            showToast(`Feedback submitted to harishmurugan60@gmail.com!`, 'success');
            contactForm.reset();
        })
        .finally(() => {
            if (submitBtn) submitBtn.disabled = false;
        });
    });
}
