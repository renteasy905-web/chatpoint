const shops = [
   {
    name: "connect with Pizza",
    img: "https://plus.unsplash.com/premium_photo-1679924471091-f7cd7ad90ddf?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.6,
    desc: "100% veg pizzas, light & tasty.",
    items: ["Paneer Tikka", "Corn & Cheese", "nugets ", "Veg Extravaganza"]
  },
    {
    name: "Hasanamba Iyengar Bakery",
    img: "https://plus.unsplash.com/premium_photo-1665669263531-cdcbe18e7fe4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmFrZXJ5fGVufDB8fDB8fHww",
    rating: 4.5,
    desc: "Fresh baked goods and sweet treats.",
    items: ["Cake", "Puff", "rolls", "Puff Pastry"]
  },
  {
    name: "Sangambar Udupi Hotel",
    img: "https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D",
    rating: 4.6,
    desc: "Pure vegetarian South Indian meals.",
    items: ["Masala Dosa", "Idli Vada", "Puri Bhaji", "Coffee"]
  },
  {
    name: "Pizza Spot",
    img: "https://plus.unsplash.com/premium_photo-1723478418445-b13c20b21231?q=80&w=1125&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.5,
    desc: "Loaded pizzas with fresh toppings.",
    items: ["momos", "pizza", "burger", "juice", "Veggie pizza", "pav bhaji"]
  },
  {
    name: "Nandi Grand Hotels",
    img: "https://plus.unsplash.com/premium_photo-1674106347866-8282d8c19f84?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTI5fHxmb29kfGVufDB8fDB8fHww",
    rating: 4.7,
    desc: "Crispy dosas with authentic flavors.",
    items: ["Plain Dosa", "Ghee Roast", "Onion Uttapam", "Podi Idli"]
  },
  

  {
    name: "Mister Chef",
    img: "https://images.unsplash.com/photo-1594179047519-f347310d3322?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZmFzdCUyMGZvb2R8ZW58MHx8MHx8fDA%3D",
    rating: 4.7,
    desc: "Juicy burgers with secret sauce.",
    items: ["Classic Burger", "Cheese Blast", "Veg Crunch", "Fries Combo"]
  },
  {
    name: "Dolphin Hotel",
    img: "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGZvb2QlMjBwaG90b2dyYXBoeXxlbnwwfHwwfHx8MA%3D%3D",
    rating: 4.5,
    desc: "Fresh sandwiches & healthy bites.",
    items: ["Veg Sandwich", "Grilled Cheese", "Club Sandwich", "rice", "panner", "Cold Coffee"]
  }

];

function renderShops(filter = "") {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  shops
    .filter(shop => shop.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(shop => {
      const cardWrap = document.createElement("div");
      cardWrap.className = "card-wrap";

      const card = document.createElement("div");
      card.className = "card";
      card.role = "button";
      card.tabIndex = 0;
      card.onclick = () => {
        localStorage.setItem("currentShop", JSON.stringify({ name: shop.name, items: shop.items }));
        location.href = `items.html?shop=${encodeURIComponent(shop.name)}`;
      };
      card.onkeydown = e => { if (e.key === "Enter") card.click(); };

      const img = document.createElement("img");
      img.src = shop.img;
      img.alt = `${shop.name} image`;
      img.loading = "lazy";
      img.onerror = function() { 
        this.src = `https://via.placeholder.com/420x260/2874F0/FF9800?text=${encodeURIComponent(shop.name)}`; 
      };

      const badge = document.createElement("div");
      badge.className = "badge-offer";
      badge.textContent = shop.rating >= 4.7 ? "⭐ TOP RATED" : "🔥 OFFER";

      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = `<div class="shop-name">${shop.name}</div><div class="rating" aria-label="Rating ${shop.rating}"><i class="fas fa-star"></i> ${shop.rating}</div>`;

      const desc = document.createElement("div");
      desc.className = "desc";
      desc.textContent = shop.desc;

      const itemsRow = document.createElement("div");
      itemsRow.className = "items-row";
      shop.items.slice(0, 4).forEach(item => {
        const pill = document.createElement("div");
        pill.className = "item-pill";
        pill.textContent = item;
        itemsRow.appendChild(pill);
      });

      card.append(img, info, desc, itemsRow);
      cardWrap.append(card);
      if (Math.random() > 0.4) cardWrap.append(badge);
      grid.append(cardWrap);
    });
}

function searchShops() {
  renderShops(document.getElementById("searchInput").value.trim());
}

document.getElementById("navBtn").onclick = () => {
  document.getElementById("sidebar").classList.add("active");
  document.getElementById("sidebar").setAttribute("aria-hidden", "false");
  document.getElementById("overlay").classList.add("active");
};

document.getElementById("overlay").onclick = () => {
  document.getElementById("sidebar").classList.remove("active");
  document.getElementById("sidebar").setAttribute("aria-hidden", "true");
  document.getElementById("overlay").classList.remove("active");
};

function loadProfile() {
  const user = JSON.parse(localStorage.getItem("chatpoint_user") || "null");
  const profile = document.getElementById("profileSection");
  const logoutBtn = document.getElementById("logout");
  if (user && user._id) {
    profile.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
      <div class="avatar"><i class="fas fa-user"></i></div>
      <div style="font-weight:800"><div>${user.name}</div><div style="font-size:13px;color:var(--muted);font-weight:600">${user.phone}</div></div>
    </div>`;
    logoutBtn.style.display = "block";
    logoutBtn.onclick = () => { localStorage.removeItem("chatpoint_user"); location.reload(); };
  } else {
    profile.innerHTML = `<div style="font-size:15px;"><div style="display:flex;align-items:center;gap:10px"><div class="avatar" style="background:#e3f2fd">🙂</div><div style="font-weight:700">Welcome</div></div><div style="margin-top:8px;color:var(--accent);font-size:13px"><a href="login.html" style="color:var(--accent);text-decoration:underline">Login to see profile</a></div></div>`;
    logoutBtn.style.display = "none";
  }
}

window.addEventListener("load", () => {
  const path = location.pathname.split("/").pop();
  if (path === "grocery.html") {
    document.getElementById("foodBtn").classList.add("inactive");
    document.getElementById("groceryBtn").classList.remove("inactive");
  }
});

window.onload = () => {
  renderShops();
  loadProfile();
};
