require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// =============== CREATE UPLOAD FOLDER + MULTER ===============
if (!fs.existsSync("icons")) {
  fs.mkdirSync("icons", { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "icons/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// =============== MIDDLEWARE ===============
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/icons", express.static(path.join(__dirname, "icons")));

// =============== MONGO DB ===============
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Error:", err);
    process.exit(1);
  });

// =============== MODELS ===============
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  password: String,
}, { timestamps: true }));

const Shop = mongoose.model("Shop", new mongoose.Schema({
  type: { type: String, default: "shop" },
  shopName: String,
  ownerName: String,
  mobile: String,
  items: [{
    name: String,
    price: Number,
    description: String,
    imageUrl: [String]
  }],
  date: { type: Date, default: Date.now },
}));

const Order = mongoose.model("Order", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: false }, // Made optional
  user: { name: String, phone: String },
  shop: String,
  items: [{ name: String, price: Number, quantity: Number }],
  totalAmount: Number,
  deliveryCharge: Number,
  address: { name: String, phone: String, line1: String, line2: String },
  paymentMethod: { type: String, default: "cash" },
  status: { type: String, default: "pending" },
  date: { type: Date, default: Date.now },
}));

// =============== UNIVERSAL ORDER SAVE FUNCTION (FIXED) ===============
const saveOrderUniversal = async (req, res) => {
  try {
    const body = req.body;

    // Extract fields flexibly
    let userId = body.userId || body.user_id || null;

    const name = body.name || body.customer_name;
    const phone = body.phone || body.customer_phone;
    const address1 = body.address1 || body.address || body.line1;
    const address2 = body.address2 || body.line2 || "";
    const grandTotal = Number(body.grandTotal || body.totalAmount || body.total);
    const cart = body.cart || body.items;

    // === VALIDATION (userId is now OPTIONAL) ===
    if (!name || !phone || !address1) {
      return res.status(400).json({ success: false, message: "Missing name, phone or address" });
    }

    if (!grandTotal || isNaN(grandTotal) || grandTotal <= 0) {
      return res.status(400).json({ success: false, message: "Invalid total amount" });
    }

    if (!cart || typeof cart !== 'object' || Object.keys(cart).length === 0) {
      return res.status(400).json({ success: false, message: "Empty or invalid cart" });
    }

    // Parse items from cart: { "ShopName": { "ItemName": { qty, price } } }
    let items = [];
    let shopName = null;

    for (const shop in cart) {
      if (!shopName) shopName = shop;
      for (const itemName in cart[shop]) {
        const item = cart[shop][itemName];
        const qty = item.qty || item.quantity || 0;
        const price = Number(item.price);
        if (qty > 0 && !isNaN(price)) {
          items.push({ name: itemName, price, quantity: qty });
        }
      }
    }

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: "No valid items in cart" });
    }

    // Create order
    const order = new Order({
      userId: userId ? userId : null, // Save null if no valid userId
      user: { name, phone },
      shop: shopName || "ChatPoint",
      items,
      totalAmount: grandTotal,
      deliveryCharge: grandTotal >= 69 ? 0 : 30,
      address: { name, phone, line1: address1, line2: address2 },
      paymentMethod: body.paymentMethod || "cash"
    });

    await order.save();

    console.log(`✅ NEW ORDER SAVED → #${order._id} | ₹${grandTotal} | ${phone} | ${name}`);

    res.json({ success: true, orderId: order._id });

  } catch (err) {
    console.error("Order save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== ORDER ROUTES ===============
app.post("/api/save-order", saveOrderUniversal);
app.post("/api/place-order", saveOrderUniversal);
app.post("/api/checkout", saveOrderUniversal);
app.post("/api/order", saveOrderUniversal);

// =============== USER ROUTES ===============
app.post("/api/user/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ success: false });
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: "Phone already registered" });
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const user = new User({ name, phone, password: hash });
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

app.post("/api/user/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const user = await User.findOne({ phone, password: hash });
    if (!user) return res.status(401).json({ success: false, message: "Wrong credentials" });
    res.json({
      success: true,
      user: {
        _id: user._id.toString(),  // Ensure it's a string
        name: user.name,
        phone: user.phone
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// =============== OTHER ROUTES ===============
app.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find({ type: "shop" }).sort({ date: -1 }).lean();
    res.json({ success: true, shops });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/delivery-orders", async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ["pending", "confirmed"] } }).sort({ date: -1 }).limit(50).lean();
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/all-delivery-orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 }).limit(1000).lean();
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.post("/api/update-order-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!["confirmed", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false });
    }
    const result = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!result) return res.status(404).json({ success: false });
    console.log(`Order ${orderId} status → ${status}`);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

app.get("/api/my-orders", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const orders = await Order.find({ userId }).sort({ date: -1 }).lean();
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, phone: 1, _id: 0 }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Admin routes (keep your existing code here)
app.post("/api/admin/add-shop", async (req, res) => {
  // Your existing add-shop logic
});

app.post("/api/admin/add-item", upload.array("images", 10), async (req, res) => {
  // Your existing add-item logic
});

// =============== SERVE PAGES ===============
const pages = ["index", "privacy", "delivery", "orders", "items", "cart", "payment", "login", "admin"];
pages.forEach(p => {
  app.get(`/${p === "index" ? "" : p + ".html"}`, (req, res) => {
    res.sendFile(path.join(__dirname, `${p}.html`));
  });
});
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// =============== START SERVER ===============
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ChatPoint LIVE on port ${PORT}`);
  console.log(`Delivery Portal → https://chatpoint1.onrender.com/delivery.html`);
});
