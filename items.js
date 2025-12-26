// items.js - Full Working Version with ALL Items

// Check login status
const user = JSON.parse(localStorage.getItem("chatpoint_user") || "null");
const isLoggedIn = user && user._id;
if (!isLoggedIn) {
  document.getElementById("loginBanner").style.display = "block";
}

// ₹5 OFF on every item
const DISCOUNT = 5;

// ALL SHOPS WITH ALL YOUR ITEMS (exactly as given)
const shopData = {
  "Chat Point": [
    { name: "Akoo tikki(burger)+ onion pizza + cheese sandwich + fry momos", price: 300, image: "Aloo-Tikki-Burger.jpg" },
    { name: "Veg roll + paneer puff + veg sandwich + Paneer burger + 750ml water bottel", price: 229, image: "Paneer-Burger.jpg" },
    { name: "veggiee pizza + French fries + coca cola 250ml", price: 279, image: "Veggie-Lover.jpg" },
    { name: "Jeera rice", price: 159, image: "Jeera-Rice.jpg" },
    { name: "veg biryani + 750ml water botel", price: 189, image: "Veg-Biriyani.jpg" },
    { name: "Kantilal rice + 750ml water bottel", price: 169, image: "Kantilal-Rice.jpg" }
  ],
  "Sangambar Udupi Hotel": [
    { name: "Plain Dosa", price: 85, image: "Plain-Dosa.JPG" },
    { name: "Masala Dosa", price: 95, image: "Masala-Dosa.JPG" },
    { name: "Benne Dosa", price: 95, image: "Benne-Dosa.jpg" },
    { name: "Benne Masala Dosa", price: 115, image: "Benne-Masala-Dosa.jpg" },
    { name: "Mysore Masala Dosa", price: 115, image: "Mysore-Masala-Dosa.jpg" },
    { name: "Paneer Masala Dosa", price: 115, image: "Paneer-Masala-Dosa.jpg" },
    { name: "Tomato Soup", price: 105, image: "Tomato-Soup.jpg" },
    { name: "Sweet Corn Soup", price: 95, image: "Sweet-Corn-Soup.jpg" },
    { name: "Veg Clear Soup", price: 95, image: "Veg-Clear-Soup.jpg" },
    { name: "Hot and Sour Soup", price: 105, image: "Hot-and-Sour-Soup.jpg" },
    { name: "Gobi 65", price: 135, image: "Gobi-65.jpg" },
    { name: "Gobi Manchurian", price: 125, image: "Gobi-Manchurian.jpg" },
    { name: "Mushroom Manchurian", price: 185, image: "Mushroom-Manchurian.jpg" },
    { name: "Paneer Manchurian", price: 205, image: "Paneer-Manchurian.jpg" },
    { name: "Veg Manchurian", price: 105, image: "Veg-Manchurian.jpg" }
  ],
  "Nandi Grand Hotels": [
    { name: "Shira", price: 35, image: "shira.JPG" },
    { name: "Poori", price: 70, image: "poori.JPG" },
    { name: "Full Meals", price: 95, image: "full-meals.JPG" },
    { name: "Onion Dosa", price: 75, image: "onion-dosa.JPG" },
    { name: "Utappa", price: 75, image: "utappa.JPG" },
    { name: "Mysore Bonda", price: 75, image: "Mysore-Bonda.jpg" },
    { name: "Mangalore Buns", price: 75, image: "mangalore-buns.JPG" },
    { name: "Paneer Dosa", price: 80, image: "paneer-dosa.JPG" },
    { name: "Cheese Dosa", price: 75, image: "chess-dosa.jpg" },
    { name: "Chou Chou Bath", price: 70, image: "chou-chou-bath.JPG" }
  ],
  "Pizza Spot": [
    { name: "Nuggets", price: 85, image: "Nuggets.jpg" },
    { name: "French Fries", price: 95, image: "French-Fries.jpg" },
    { name: "Masala Fries", price: 105, image: "Masala-Fries.jpg" },
    { name: "Smiley Fries", price: 105, image: "Smiley-Fries.jpg" },
    { name: "Pizza Spot Special", price: 165, image: "Pizza-Spot-Special.jpg" },
    { name: "Burger Classic", price: 85, image: "Burger-Classic.jpg" },
    { name: "Aloo Tikki Burger", price: 85, image: "Aloo-Tikki-Burger.jpg" },
    { name: "Paneer Burger", price: 95, image: "Paneer-Burger.jpg" },
    { name: "Double Decker Burger", price: 125, image: "Double-Decker-Burger.jpg" },
    { name: "Pizza Spot Special Burger", price: 165, image: "Pizza-Spot-Special-Burger.jpg" },
    { name: "Margherita", price: 154, image: "Margherita.jpg" },
    { name: "Veggie", price: 174, image: "Veggie.jpg" },
    { name: "Veggie Lover", price: 274, image: "Veggie-Lover.jpg" },
    { name: "Sweet Corn", price: 245, image: "Sweet-Corn.jpg" },
    { name: "Baby Corn", price: 224, image: "Baby-Corn.jpg" },
    { name: "Tandoori Paneer", price: 235, image: "Tandoori-Paneer.jpg" },
    { name: "Steam Momos", price: 75, image: "Steam-Momos.jpg" },
    { name: "Fried Momos", price: 85, image: "Fried-Momos.jpg" },
    { name: "Kurkure Momos", price: 105, image: "Kurkure-Momos.jpg" },
    { name: "Veg Sandwich", price: 75, image: "Veg-Sandwich.jpg" },
    { name: "Cheese Sandwich", price: 85, image: "Cheese-Sandwich.jpg" },
    { name: "Sweet Corn Sandwich", price: 85, image: "Sweet-Corn-Sandwich.jpg" },
    { name: "Paneer Tandoori Sandwich", price: 95, image: "Paneer-Tandoori-Sandwich.jpg" },
    { name: "Club Sandwich", price: 125, image: "Club-Sandwich.jpg" },
    { name: "Pizza Spot Special Sandwich", price: 145, image: "Pizza-Spot-Special-Sandwich.jpg" },
    { name: "Pav Bhaji", price: 65, image: "Pav-Bhaji.jpg" },
    { name: "Cheese Pav Bhaji", price: 85, image: "Cheese-Pav-Bhaji.jpg" },
    { name: "Veg Roll", price: 75, image: "Veg-Roll.jpg" },
    { name: "Sweet Corn Roll", price: 95, image: "Sweet-Corn-Roll.jpg" },
    { name: "Paneer Roll", price: 105, image: "Paneer-Roll.jpg" }
  ],
  "Fly Pizza": [
    { name: "Margharita pizza", price: 155, image: "Margherita.jpg" },
    { name: "Corn cheese", price: 179, image: "Sweet-Corn.jpg" },
    { name: "Corn cheese big", price: 339, image: "Sweet-Corn.jpg" },
    { name: "paneer Tikka", price: 269, image: "Tandoori-Paneer.jpg" },
    { name: "Veggie lovers", price: 279, image: "Veggie-Lover.jpg" },
    { name: "Fly special", price: 360, image: "Pizza-Spot-Special.jpg" }
  ],
  "Mister Chef": [
    { name: "VEG-Sandwiich", price: 60, image: "VEG-Sandwiich.jpg" },
    { name: "Cheese-Sandwiich", price: 70, image: "Cheese-Sandwiich.jpg" },
    { name: "Sweet Corn-Sandwiich", price: 70, image: "Sweet Corn-Sandwiich.jpg" },
    { name: "MushRoom-Sandwiich", price: 75, image: "MushRoom-Sandwiich.jpg" },
    { name: "Paneer-Sandwiich", price: 80, image: "Paneer-Sandwiich.jpg" },
    { name: "Nuggets", price: 70, image: "Nuggets.jpg" },
    { name: "french-Frics", price: 95, image: "french-Frics.jpg" },
    { name: "masala-Frics", price: 95, image: "Masala-Fries.jpg" },
    { name: "Classic-Burger", price: 70, image: "Classic-Burger.jpg" },
    { name: "Aloo Tikki-burger", price: 80, image: "Aloo-Tikki-Burger.jpg" },
    { name: "paneer-burger", price: 99, image: "Paneer-Burger.jpg" },
    { name: "Chees-burger", price: 99, image: "Chees-burger.jpg" },
    { name: "Double Decker-burger", price: 119, image: "Double Decker-burger.jpg" },
    { name: "Margherita-Pizza", price: 155, image: "Margherita-Pizza.jpg" },
    { name: "Veggie-burger", price: 169, image: "Veggie-burger.jpg" }
  ],
  "Hasanamba Iyengar Bakery": [
    { name: "Veg Pizza", price: 175, image: "Veg-Pizza.jpg" },
    { name: "Margherita", price: 165, image: "Margherita.jpg" },
    { name: "Paneer Pizza", price: 225, image: "Tandoori-Paneer.jpg" },
    { name: "Golden Corn Pizza", price: 235, image: "Sweet-Corn.jpg" },
    { name: "Sweet Corn Pizza", price: 225, image: "Sweet-Corn.jpg" },
    { name: "Baby Corn Pizza", price: 225, image: "Baby-Corn.jpg" },
    { name: "Classic Veg Burger", price: 75, image: "Burger-Classic.jpg" },
    { name: "Cheese Burger", price: 85, image: "Paneer-Burger.jpg" },
    { name: "Paneer Tandoori Burger", price: 85, image: "Paneer-Burger.jpg" },
    { name: "Cheese Sandwich", price: 75, image: "Cheese-Sandwich.jpg" },
    { name: "Veg Sandwich", price: 66, image: "Veg-Sandwich.jpg" },
    { name: "Veg Roll", price: 35, image: "Veg-Roll.jpg" },
    { name: "Egg Roll", price: 35, image: "Egg-Roll.jpg" },
    { name: "Cheese Roll", price: 40, image: "Cheese-Roll.jpg" },
    { name: "Rasmalai Cake", price: 750, image: "Rasmalai-Cake.jpg" },
    { name: "Irish Coffee Cake", price: 750, image: "Irish-Coffee-Cake.jpg" },
    { name: "Black Forest Cake", price: 650, image: "Black-Forest.jpg" },
    { name: "American Nuts Cake", price: 750, image: "American-Nuts-Cake.jpg" },
    { name: "French Vanilla Cake", price: 700, image: "French-Vanilla-Cake.jpg" },
    { name: "Pineapple Cake", price: 650, image: "Pineapple-Cake.jpg" },
    { name: "Strawberry Cake", price: 650, image: "Strawberry-Cake.jpg" },
    { name: "Death by Chocolate Cake", price: 700, image: "Chocolate-Truffle-Cake.jpg" },
    { name: "Butterscotch Cake", price: 650, image: "Butterscotch-Cake.jpg" },
    { name: "Mango Cake", price: 600, image: "Mango-Cake.jpg" }
  ],
  "Dolphin Hotel": [
    { name: "Veg Sandwich", price: 70, image: "Veg-Sandwich.jpg" },
    { name: "Grilled Cheese", price: 85, image: "Cheese-Sandwich.jpg" },
    { name: "Club Sandwich", price: 120, image: "Club-Sandwich.jpg" },
    { name: "Cold Coffee", price: 80, image: "Cold-Coffee.jpg" }
  ]
};

// Get shop from URL
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
  if (!cart[shop][name]) {
    cart[shop][name] = { qty: 0, price: originalPrice - DISCOUNT };
  }
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
             onerror="this.src='https://via.placeholder.com/120x120/f3cd98/f12916?text=${encodeURIComponent(item.name.substring(0, 12))}'">
        <div class="new-price">₹${discountedPrice}</div>
        <div class="old-price">₹${originalPrice}</div>
        <div class="discount-badge">-₹5 OFF</div>
      </div>
      <div class="quantity" style="display: ${qty > 0 ? 'flex' : 'none'};">
        <div class="qty">${qty}</div>
      </div>
    `;

    // Swipe functionality
    let startX = 0;
    let currentTranslate = 0;
    let isDragging = false;

    card.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    card.addEventListener("touchmove", e => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      currentTranslate = diffX;
      card.style.transform = `translateX(${diffX}px)`;
      card.style.transition = "none";
    });

    card.addEventListener("touchend", () => {
      if (!isDragging) return;
      card.style.transition = "transform 0.3s ease";
      if (currentTranslate > 60) {
        changeQty(shopName, item.name, originalPrice, 1);
      } else if (currentTranslate < -60) {
        changeQty(shopName, item.name, originalPrice, -1);
      }
      card.style.transform = "translateX(0)";
      currentTranslate = 0;
      isDragging = false;
    });

    // Mouse support for desktop testing
    card.addEventListener("mousedown", e => {
      startX = e.clientX;
      isDragging = true;
    });
    card.addEventListener("mousemove", e => {
      if (!isDragging) return;
      const diffX = e.clientX - startX;
      card.style.transform = `translateX(${diffX}px)`;
      card.style.transition = "none";
    });
    card.addEventListener("mouseup", () => {
      if (!isDragging) return;
      card.style.transition = "transform 0.3s ease";
      if (currentTranslate > 60) changeQty(shopName, item.name, originalPrice, 1);
      else if (currentTranslate < -60) changeQty(shopName, item.name, originalPrice, -1);
      card.style.transform = "translateX(0)";
      isDragging = false;
    });
    card.addEventListener("mouseleave", () => {
      if (isDragging) {
        card.style.transition = "transform 0.3s ease";
        card.style.transform = "translateX(0)";
        isDragging = false;
      }
    });

    grid.appendChild(card);
  });
}

// Initialize
document.getElementById("shopName").textContent = shopName || "Shop Not Found";
renderItems();
updateCartBar();

// Navigation
document.getElementById("backBtn").onclick = () => history.back();
document.getElementById("cartBar").onclick = () => location.href = "cart.html";
document.getElementById("checkoutBtn").onclick = e => {
  e.stopPropagation();
  location.href = "cart.html";
};

// Demo overlay animation on first load
window.addEventListener("load", () => {
  const demoOverlay = document.getElementById("demoOverlay");
  const demoCard = document.getElementById("demoCard");

  if (localStorage.getItem("swipeDemoSeen")) {
    demoOverlay.style.display = "none";
    return;
  }

  // Animate demo card
  setTimeout(() => demoCard.style.transform = "translateX(80px)", 1200);
  setTimeout(() => demoCard.style.transform = "translateX(0px)", 2400);
  setTimeout(() => demoCard.style.transform = "translateX(-80px)", 3600);
  setTimeout(() => demoCard.style.transform = "translateX(0px)", 4800);

  // Auto hide after 8 seconds or on button click
  const hideDemo = () => {
    demoOverlay.style.opacity = "0";
    setTimeout(() => {
      demoOverlay.style.display = "none";
      localStorage.setItem("swipeDemoSeen", "true");
    }, 500);
  };

  setTimeout(hideDemo, 8000);
  demoOverlay.querySelector("button").onclick = hideDemo;
});
