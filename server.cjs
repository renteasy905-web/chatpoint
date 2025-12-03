require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- MIDDLEWARE ----------
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: "application/octet-stream", limit: "50mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- MONGODB ----------
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("FATAL: MONGODB_URI missing in env!");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => {
    console.error("MongoDB failed:", err.message);
    process.exit(1);
  });

// ---------- MODELS ----------
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  password: String, // hashed
}, { timestamps: true }));

const Shop = mongoose.model("Shop", new mongoose.Schema({
  type: { type: String, default: "shop" },
  ownerName: String,
  mobile: String,
  shopName: String,
  items: [{ name: String, price: Number, description: String, imageUrl: [String] }],
  date: { type: Date, default: Date.now },
}));

const Order = mongoose.model("Order", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  user: { name: String, phone: String },
  shop: String,
  items: [{ name: String, price: Number, quantity: Number }],
  totalAmount: Number,
  deliveryCharge: Number,
  address: { name: String, phone: String, line1: String, line2: String },
  paymentMethod: { type: String, default: "cash" },
  status: { type: String, default: "pending" }, // pending, confirmed, delivered, cancelled
  date: { type: Date, default: Date.now },
}, { timestamps: true }));

// ============================== API ROUTES ==============================

// Signup + Password Hashing
app.post("/api/user/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password || password.length < 4)
      return res.status(400).json({ success: false, message: "Invalid data" });

    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: "Phone already registered" });

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = new User({ name, phone, password: hash });
    await user.save();

    res.json({ success: true, message: "Signup successful" });
  } catch (e) {
    console.error("SIGNUP ERROR:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
app.post("/api/user/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = await User.findOne({ phone, password: hash });

    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    res.json({
      success: true,
      user: { _id: user._id, name: user.name, phone: user.phone }
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Save Order
app.post("/api/save-order", async (req, res) => {
  try {
    const { userId, name, phone, address1, address2, cart, itemsTotal, deliveryCharge = 30, grandTotal, paymentMode = "cash" } = req.body;

    if (!userId || !name || !phone || !address1 || !cart || grandTotal === undefined)
      return res.status(400).json({ success: false, message: "Missing data" });

    const items = [];
    let shopName = null;

    for (const shop in cart) {
      for (const itemName in cart[shop]) {
        const it = cart[shop][itemName];
        if (it.qty > 0) {
          items.push({ name: itemName, price: it.price, quantity: it.qty });
          if (!shopName) shopName = shop;
        }
      }
    }

    if (items.length === 0) return res.status(400).json({ success: false, message: "Cart empty" });
    if (!shopName) return res.status(400).json({ success: false, message: "No shop found" });

    const order = new Order({
      userId,
      user: { name, phone },
      shop: shopName,
      items,
      totalAmount: grandTotal,
      deliveryCharge,
      address: { name, phone, line1: address1, line2: address2 || "" },
      paymentMethod: paymentMode,
    });

    await order.save();
    console.log("ORDER SAVED:", order._id);

    res.json({ success: true, orderId: order._id, message: "Order placed!" });
  } catch (e) {
    console.error("SAVE ORDER ERROR:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Shops
app.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find({ type: "shop" }).sort({ date: -1 }).lean();
    res.json({ success: true, shops });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Delivery Portal: Get pending + confirmed orders
app.get("/api/delivery-orders", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const orders = await Order.find({
      status: { $in: ["pending", "confirmed"] }  // Show both pending & confirmed
    })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

    res.json({ success: true, orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// Update Order Status (Now supports "confirmed")
app.post("/api/update-order-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !["confirmed", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (e) {
    console.error("UPDATE STATUS ERROR:", e);
    res.status(500).json({ success: false });
  }
});

// Customer: My Orders
app.get("/api/my-orders", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(400).json({ success: false, message: "No user" });

    const orders = await Order.find({ userId })
      .sort({ date: -1 })
      .lean();

    res.json({ success: true, orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// ============================== SERVE STATIC FILES ==============================
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use(express.static(__dirname));

["privacy", "delivery", "orders", "items", "cart", "payment", "login"].forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, `${page}.html`));
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================== START SERVER ==============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ChatPoint Backend LIVE on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
