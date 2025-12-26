// items.js - Full Working Version

const user = JSON.parse(localStorage.getItem("chatpoint_user") || "null");
const isLoggedIn = user && user._id;
if (!isLoggedIn) document.getElementById("loginBanner").style.display = "block";

const DISCOUNT = 5;

const shopData = {
  "Chat Point": [ /* your full list */ ],
  "Sangambar Udupi Hotel": [ /* ... */ ],
  "Nandi Grand Hotels": [ /* ... */ ],
  "Pizza Spot": [ /* ... */ ],
  "Fly Pizza": [ /* ... */ ],
  "Mister Chef": [ /* ... */ ],
  "Hasanamba Iyengar Bakery": [ /* ... */ ],
  "Dolphin Hotel": [ /* ... */ ]
  // Paste your full shopData here exactly as before
};

const urlParams = new URLSearchParams(location.search);
let requestedShop = decodeURIComponent(urlParams.get("shop") || "").trim();

let shopName = null;
let shopItems = [];

for (const key in shopData) {
  if (key.toLowerCase() === requestedShop.toLowerCase() ||
      key.toLowerCase().replace(/[^a-z0-9]/g, '') === requestedShop.toLowerCase().replace(/[^a-z0-9]/g, '')) {
    shopName = key;
    shopItems = shopData[key];
    break;
  }
}

let cart = JSON.parse(localStorage.getItem("chatpoint_cart") || "{}");

function saveCart() {
  localStorage.setItem("chatpoint_cart", JSON.stringify(cart));
  updateCartBar();
}

function updateCartBar() {
  let items = 0, total = 0;
  for (const s in cart) {
    for (const i in cart[s]) {
      items += cart[s][i].qty;
      total += cart[s][i].qty * cart[s][i].price;
    }
  }
  document.getElementById("cartText").textContent = `${items} items · ₹${total}`;
  document.getElementById("cartBar").style.display = items > 0 ? "flex" : "none";
}

function changeQty(shop, name, originalPrice, delta) {
  if (!isLoggedIn) {
    alert("Please login first!");
    return;
  }
  if (!cart[shop]) cart[shop] = {};
  if (!cart[shop][name]) cart[shop][name] = { qty: 0, price: originalPrice - DISCOUNT };
  cart[shop][name].qty = Math.max(0, cart[shop][name].qty + delta);
  if (cart[shop][name].qty === 0) delete cart[shop][name];
  if (Object.keys(cart[shop]).length === 0) delete cart[shop];
  saveCart();
  renderItems();
}

function renderItems() {
  const grid = document.getElementById("itemsGrid");
  grid.innerHTML = "";
  if (shopItems.length === 0) {
    grid.innerHTML = "<p style='text-align:center;grid-column:1/-1;font-size:1.2rem;color:#666;margin:3rem 0;'>No items found for this shop.</p>";
    return;
  }

  shopItems.forEach(item => {
    const originalPrice = item.price;
    const discountedPrice = originalPrice - DISCOUNT;
    const qty = (cart[shopName] && cart[shopName][item.name]) ? cart[shopName][item.name].qty : 0;

    const card = document.createElement("article");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.name.toLowerCase().includes("cake") ? "Fresh Cream • Per kg" : "Homemade Special"}</div>
      </div>
      <div class="price-container">
        <img src="images/${item.image}" alt="${item.name}" class="item-img" loading="lazy"
             onerror="this.src='https://via.placeholder.com/110x110/f3cd98/f12916?text=Food'">
        <div class="new-price">₹${discountedPrice}</div>
        <div class="old-price">₹${originalPrice}</div>
        <div class="discount-badge">-₹5 OFF</div>
      </div>
      <div class="quantity" style="display:${qty > 0 ? 'block' : 'none'}">
        ${qty}
      </div>
    `;

    let startX = 0;
    let isDragging = false;

    card.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
      isDragging = true;
      card.style.transition = "none";
    });

    card.addEventListener("touchmove", e => {
      if (!isDragging) return;
      e.preventDefault();
      const diff = e.touches[0].clientX - startX;
      card.style.transform = `translateX(${diff}px)`;
      if (diff > 0) card.style.boxShadow = "0 0 20px rgba(48,188,26,0.5)";
      else if (diff < 0) card.style.boxShadow = "0 0 20px rgba(225,29,72,0.5)";
    }, { passive: false });

    card.addEventListener("touchend", () => {
      if (!isDragging) return;
      const diff = parseInt(card.style.transform.replace(/[^-\d.]/g, '') || 0);
      card.style.transition = "transform 0.4s ease, box-shadow 0.4s ease";
      card.style.boxShadow = "";

      if (diff > 80) changeQty(shopName, item.name, originalPrice, 1);
      else if (diff < -80) changeQty(shopName, item.name, originalPrice, -1);

      card.style.transform = "translateX(0)";
      isDragging = false;
    });

    // Tap to add if not swiped
    card.addEventListener("click", e => {
      if (qty === 0 && Math.abs(parseInt(card.style.transform || 0)) < 30) {
        changeQty(shopName, item.name, originalPrice, 1);
      }
    });

    grid.appendChild(card);
  });
}

document.getElementById("shopName").textContent = shopName || "Shop Not Found";
renderItems();
updateCartBar();

document.getElementById("backBtn").onclick = () => history.back();
document.getElementById("cartBar").onclick = () => location.href = "cart.html";
document.getElementById("checkoutBtn").onclick = e => { e.stopPropagation(); location.href = "cart.html"; };

// Demo
window.addEventListener("load", () => {
  const overlay = document.getElementById("demoOverlay");
  if (localStorage.getItem("swipeDemoSeen")) {
    overlay.style.display = "none";
    return;
  }
  const demoCard = document.getElementById("demoCard");
  const animate = () => {
    demoCard.style.transform = "translateX(80px)";
    setTimeout(() => demoCard.style.transform = "translateX(0)", 1200);
    setTimeout(() => demoCard.style.transform = "translateX(-80px)", 2400);
    setTimeout(() => demoCard.style.transform = "translateX(0)", 3600);
  };
  animate();
  setInterval(animate, 6000);

  overlay.querySelector("button").onclick = () => {
    overlay.style.opacity = "0";
    setTimeout(() => { overlay.style.display = "none"; localStorage.setItem("swipeDemoSeen", "true"); }, 500);
  };
  setTimeout(() => {
    if (overlay.style.display !== "none") {
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.style.display = "none"; localStorage.setItem("swipeDemoSeen", "true"); }, 500);
    }
  }, 12000);
});
