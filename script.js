/* =========================================================
DELOLA'S CLOSET – MAIN JS
========================================================= */

console.log("Script started...")

document.addEventListener("DOMContentLoaded", () => {
  const AOS = window.AOS // Declare the AOS variable
  AOS.init()

  /* ===== NAV MENU ===== */
  const menuToggle = document.getElementById("menuToggle")
  const navLinks = document.getElementById("navLinks")

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"))
    navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("open")))
  }

  /* ===== CATEGORY FILTER ===== */
  const catCards = document.querySelectorAll(".catCard")
  const catGrid = document.getElementById("categoryGrid")
  const backBtn = document.getElementById("backBtn")
  const productGrid = document.getElementById("productGrid")
  const products = document.querySelectorAll(".product-card")

  if (productGrid) {
    productGrid.classList.add("hidden")
    products.forEach((p) => p.classList.add("hide"))
  }

  catCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (catGrid) catGrid.style.display = "none"
      if (backBtn) backBtn.style.display = "inline-block"
      const cat = card.dataset.cat
      products.forEach((p) => p.classList.toggle("hide", p.dataset.cat !== cat))
      if (productGrid) productGrid.classList.remove("hidden")
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
    })
  })

  backBtn?.addEventListener("click", () => {
    catGrid.style.display = "flex"
    productGrid.classList.add("hidden")
    products.forEach((p) => p.classList.add("hide"))
    backBtn.style.display = "none"
    catGrid.scrollBy({ top: -catGrid.getBoundingClientRect().top, behavior: "smooth" }) // Scroll to top of category grid
  })

  /* ===== FAQ & BACK TO TOP ===== */
  document
    .querySelectorAll(".faq-question")
    .forEach((btn) => btn.addEventListener("click", () => btn.parentElement.classList.toggle("open")))

  const backTBtn = document.querySelector(".back-to-top")
  if (backTBtn) {
    window.addEventListener("scroll", () => backTBtn.classList.toggle("show", window.scrollY > 300))
  }

  window.scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  /* ===== CART FUNCTIONALITY ===== */
  const cartIcon = document.getElementById("openCart")
  const cartBubble = document.getElementById("cartBubble")
  const cartDrawer = document.getElementById("cartDrawer")
  const closeCart = document.getElementById("closeCart")
  const cartList = document.getElementById("cart-items")
  const cartTotalEl = document.getElementById("cart-total")
  const checkoutBtn = document.getElementById("checkoutBtn")
  const LS_KEY = "delolaCart"

  const cartItems = loadCart()

  document.querySelectorAll(".add-cart").forEach((btn) =>
    btn.addEventListener("click", () => {
      const { name, price, img } = btn.dataset
      const found = cartItems.find((i) => i.name === name)
      if (found) {
        found.qty++
      } else {
        cartItems.push({ name, price: +price, img, qty: 1 })
      }
      saveCart()
      renderCart(true)
      btn.textContent = "Added!"
      btn.style.background = "#28a745"
      setTimeout(() => {
        btn.textContent = "Add to Cart"
        btn.style.background = ""
      }, 1000)
    }),
  )

  cartIcon?.addEventListener("click", () => cartDrawer?.classList.toggle("open"))
  closeCart?.addEventListener("click", () => cartDrawer?.classList.remove("open"))

  cartList?.addEventListener("click", (e) => {
    const btn = e.target.closest("button")
    const idx = +btn?.dataset.index
    if (!btn || isNaN(idx)) return

    if (btn.classList.contains("qty-btn")) {
      btn.dataset.action === "inc" ? cartItems[idx].qty++ : cartItems[idx].qty-- <= 1 && cartItems.splice(idx, 1)
    }
    if (btn.classList.contains("remove-item")) {
      cartItems.splice(idx, 1)
    }
    saveCart()
    renderCart(false)
  })

  renderCart(false)

  window.cartItems = cartItems
  window.renderCartUI = renderCart

  function renderCart(bump) {
    if (!cartBubble || !cartList || !cartTotalEl) return

    const count = cartItems.reduce((n, i) => n + i.qty, 0)
    cartBubble.textContent = count
    cartBubble.style.display = count ? "inline-block" : "none"

    if (bump && count) {
      cartBubble.style.animation = "none"
      void cartBubble.offsetWidth
      cartBubble.style.animation = "bump .4s"
    }

    cartList.innerHTML = ""
    let total = 0

    cartItems.forEach((item, i) => {
      total += item.price * item.qty
      cartList.insertAdjacentHTML(
        "beforeend",
        `
    <li class="cart-item">
      <div class="item-left">
        <img src="${item.img}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
        <div class="item-details">
          <p class="item-name">${item.name}</p>
          <small>₦${item.price.toLocaleString()} × ${item.qty}</small>
        </div>
      </div>
      <div class="item-controls">
        <button class="qty-btn" data-action="dec" data-index="${i}"><i class="fas fa-minus"></i></button>
        <button class="qty-btn" data-action="inc" data-index="${i}"><i class="fas fa-plus"></i></button>
        <button class="remove-item" data-index="${i}"><i class="fas fa-trash-alt"></i></button>
      </div>
    </li>
  `,
      )
    })

    cartTotalEl.textContent = total.toLocaleString()
  }

  function saveCart() {
    localStorage.setItem(LS_KEY, JSON.stringify(cartItems))
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || []
    } catch {
      return []
    }
  }

  /* ===== CHECKOUT MODAL + VALIDATION ===== */
  const modal = document.getElementById("checkoutModal")
  const cancelBtn = document.getElementById("cancelBtn")
  const payNowBtn = document.getElementById("payNowBtn")
  const fullName = document.getElementById("fullName")
  const email = document.getElementById("email")
  const phone = document.getElementById("phone")
  const address = document.getElementById("address")
  const orderNotes = document.getElementById("note")
  const previewUl = document.getElementById("orderPreview")
  const modalSubEl = document.getElementById("modalSub")
  const shipSelect = document.getElementById("shipSelect")
  const grandEl = document.getElementById("grandTotal")

  // Form validation functions
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validatePhone(number) {
    // Updated regex to be more flexible for phone numbers, allowing spaces and dashes
    return /^\+?[\d\s-]{10,15}$/.test(number)
  }

  function validateForm() {
    // Safely get trimmed values, defaulting to empty string if element or its value is null/undefined
    const fullNameVal = (fullName?.value || "").trim()
    const emailVal = (email?.value || "").trim()
    const phoneVal = (phone?.value || "").trim()
    const addressVal = (address?.value || "").trim()

    const isFullNamePresent = fullNameVal !== ""
    const isEmailPresent = emailVal !== ""
    const isEmailFormatValid = isEmailPresent && validateEmail(emailVal)
    const isPhonePresent = phoneVal !== ""
    const isPhoneFormatValid = isPhonePresent && validatePhone(phoneVal)
    const isAddressPresent = addressVal !== ""

    const overallValid =
      isFullNamePresent &&
      isEmailPresent &&
      isEmailFormatValid &&
      isPhonePresent &&
      isPhoneFormatValid &&
      isAddressPresent

    return overallValid
  }

  // Visual feedback for form fields (only email and phone as requested)
  if (fullName && email && phone && address) {
    // Ensure all elements exist before adding listeners
    ;[fullName, email, phone, address].forEach((input) => {
      input.addEventListener("blur", () => {
        if (input === email) {
          if (input.value.trim() && !validateEmail(input.value)) {
            input.style.borderColor = "#dc3545" // Red for invalid format
          } else if (input.value.trim()) {
            input.style.borderColor = "#28a745" // Green for valid format
          } else {
            input.style.borderColor = "" // Clear for empty
          }
        } else if (input === phone) {
          if (input.value.trim() && !validatePhone(input.value)) {
            input.style.borderColor = "#dc3545" // Red for invalid format
          } else if (input.value.trim()) {
            input.style.borderColor = "#28a745" // Green for valid format
          } else {
            input.style.borderColor = "" // Clear for empty
          }
        } else {
          // For Full Name and Address, just check if empty or not
          if (input.value.trim()) {
            input.style.borderColor = "#28a745" // Green if not empty
          } else {
            input.style.borderColor = "" // Clear if empty
          }
        }
      })
    })
  }

  function buildPreview() {
    if (!previewUl || !modalSubEl || !grandEl || !shipSelect) return
    previewUl.innerHTML = ""
    let subTotal = 0
    cartItems.forEach((item) => {
      subTotal += item.price * item.qty
      previewUl.insertAdjacentHTML("beforeend", `<li>${item.qty}× ${item.name} – ₦${item.price.toLocaleString()}</li>`)
    })
    const shipping = +shipSelect.value || 0
    modalSubEl.textContent = subTotal.toLocaleString()
    grandEl.textContent = (subTotal + shipping).toLocaleString()
  }

  checkoutBtn?.addEventListener("click", () => {
    if (!cartItems.length) return alert("Your cart is empty!")
    buildPreview()
    modal.classList.add("show")
  })

  cancelBtn?.addEventListener("click", () => modal?.classList.remove("show"))

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal?.classList.remove("show")
  })

  shipSelect?.addEventListener("change", buildPreview)

  // PAY NOW BUTTON - Always enabled with different alerts based on validation
  payNowBtn?.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event from bubbling up

    // Check if form is filled correctly
    if (!validateForm()) {
      alert("Please fill all required fields correctly before proceeding!")
      return
    }

    // Get order details
    // Paystack amount is in kobo (cents), so multiply by 100
    const amount = Number.parseFloat(grandEl.textContent.replace(/,/g, "")) * 100
    const customerEmail = email.value.trim()
    const customerName = fullName.value.trim()
    const customerPhone = phone.value.trim()
    const customerAddress = address.value.trim()

    // NEW: Get the text content of the selected shipping option
    const selectedShippingOption = shipSelect.options[shipSelect.selectedIndex].textContent
    const shippingPrice = +shipSelect.value // Still need the price for total calculation

    const orderNotesVal = (orderNotes?.value || "").trim() // Get the notes value, default to empty string

    if (amount <= 0) {
      alert("Cart total must be greater than zero to proceed with payment.")
      return
    }

    // Paystack configuration
    const PAYSTACK_PUBLIC_KEY = "pk_test_0c372c9225065bd6f29a549794868d5224a77aac" // Your provided Test Public Key
    const CURRENCY = "NGN" // Your provided currency

    // Generate a unique reference for the transaction
    const reference = `delola_order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Initialize Paystack handler
    const PaystackPop = window.PaystackPop // Declare the PaystackPop variable
    console.log("Type of window.PaystackPop:", typeof window.PaystackPop)
    console.log("Is PaystackPop.setup a function?", typeof PaystackPop?.setup === "function")

    // Define the callback function separately as a regular function
    function paystackCallback(response) {
      console.log("Paystack callback function entered.") // New log
      const transactionRef = response.reference
      alert("Payment successful! Verifying transaction...")

      // Use an IIFE (Immediately Invoked Function Expression) for the async logic
      ;(async () => {
        try {
          // IMPORTANT: Updated URL for Netlify Functions
          const verificationResponse = await fetch("/.netlify/functions/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: transactionRef,
              customerEmail: customerEmail,
              cartItems: cartItems,
              amount: amount / 100, // Send amount back in Naira for server-side check
              shippingOption: selectedShippingOption, // Send the descriptive text
              orderNotes: orderNotesVal,
              customerName: customerName, // <--- ADD THIS LINE
            }),
          })

          const verificationData = await verificationResponse.json()

          if (verificationResponse.ok) {
            console.log("Server-side verification successful:", verificationData)
            alert("Order confirmed! Thank you for your purchase.")
            // Now you can proceed with clearing the cart, closing modal, and sending emails
            cartItems.length = 0 // Clear the array
            saveCart()
            renderCart(false)
            modal?.classList.remove("show")
          } else {
            console.error("Server-side verification failed:", verificationData)
            alert("Payment successful, but verification failed. Please contact support.")
            // Do NOT clear cart or close modal if verification fails,
            // as the order is not confirmed.
          }
        } catch (error) {
          console.error("Error during server-side verification fetch:", error)
          alert("An error occurred during payment verification. Please contact support.")
        }
      })() // Immediately invoke the async function
    }

    // Define onClose as a regular function too
    function paystackOnClose() {
      // This function is called when the user closes the payment modal without completing payment
      alert("Payment cancelled by user.")
    }

    const readableCartItems = cartItems
      .map((item) => `${item.qty}x ${item.name} (₦${item.price.toLocaleString()})`)
      .join("; ")

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: customerEmail,
      amount: amount, // amount in kobo
      currency: CURRENCY,
      ref: reference,
      metadata: {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        cart_items: readableCartItems,
        shipping_option: selectedShippingOption,
        order_notes: orderNotesVal,
        custom_fields: [
          // Optional: for display on Paystack dashboard
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: customerName,
          },
          {
            display_name: "Customer Phone",
            variable_name: "customer_phone",
            value: customerPhone,
          },
          {
            display_name: "Customer Address",
            variable_name: "customer_address",
            value: customerAddress,
          },
          {
            display_name: "Cart Items",
            variable_name: "cart_items",
            value: readableCartItems,
          },
          {
            display_name: "Shipping Option",
            variable_name: "shipping_option",
            value: selectedShippingOption,
          },
          {
            display_name: "Order Notes",
            variable_name: "order_notes",
            value: orderNotesVal,
          },
        ],
      },
      callback: paystackCallback, // Reference the separately defined function
      onClose: paystackOnClose, // Reference the separately defined function
    })
    handler.openIframe() // Open the Paystack payment modal
  })

  console.log("✅ Script loaded successfully")
})
