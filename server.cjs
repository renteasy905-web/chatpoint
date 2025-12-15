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
  userId: mongoose.Schema.Types.ObjectId,
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

// =============== ROUTES ===============
// Signup & Login
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
  } catch (e) { res.status(500).json({ success: false }); }
});

app.post("/api/user/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const user = await User.findOne({ phone, password: hash });
    if (!user) return res.status(401).json({ success: false, message: "Wrong credentials" });
    res.json({ success: true, user: { _id: user._id, name: user.name, phone: user.phone } });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.post("/api/save-order", async (req, res) => {
  try {
    const { userId, name, phone, address1, address2, cart, grandTotal } = req.body;
    let items = [], shopName = null;
    for (const shop in cart) {
      for (const item in cart[shop]) {
        if (cart[shop][item].qty > 0) {
          items.push({ name: item, price: cart[shop][item].price, quantity: cart[shop][item].qty });
          if (!shopName) shopName = shop;
        }
      }
    }
    if (items.length === 0) return res.status(400).json({ success: false });
    const order = new Order({
      userId, user: { name, phone }, shop: shopName, items,
      totalAmount: grandTotal, deliveryCharge: 30,
      address: { name, phone, line1: address1, line2: address2 || "" }
    });
    await order.save();
    res.json({ success: true, orderId: order._id });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.get("/api/shops", async (req, res) => {
  try {
    const shops = await Shop.find({ type: "shop" }).sort({ date: -1 }).lean();
    res.json({ success: true, shops });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.get("/api/delivery-orders", async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ["pending", "confirmed"] } }).sort({ date: -1 }).limit(50).lean();
    res.json({ success: true, orders });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.get("/api/all-delivery-orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 }).limit(1000).lean();
    res.json({ success: true, orders });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.post("/api/update-order-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!["confirmed", "delivered", "cancelled"].includes(status)) return res.status(400).json({ success: false });
    await Order.findByIdAndUpdate(orderId, { status });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.get("/api/my-orders", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const orders = await Order.find({ userId }).sort({ date: -1 }).lean();
    res.json({ success: true, orders });
  } catch (e) { res.status(500).json({ success: false }); }
});

// =============== ADMIN ROUTES ===============
app.post("/api/admin/add-shop", async (req, res) => {
  try {
    const { shopName, ownerName, mobile } = req.body;
    if (!shopName) return res.status(400).json({ success: false });
    const shop = new Shop({ shopName, ownerName, mobile, items: [] });
    await shop.save();
    res.json({ success: true, shop });
  } catch (e) { res.status(500).json({ success: false }); }
});

app.post("/api/admin/add-item", upload.array("images", 10), async (req, res) => {
  try {
    const { shopId, name, price, description } = req.body;
    if (!shopId || !name || !price) return res.status(400).json({ success: false });
    const imageUrls = req.files ? req.files.map(f => `/icons/${f.filename}`) : [];
    await Shop.updateOne(
      { _id: shopId },
      { $push: { items: { name, price: parseFloat(price), description: description || "", imageUrl: imageUrls } } }
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// NEW ROUTE: Get all registered users (name + phone only, no password)
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, phone: 1, _id: 0 }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
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
  console.log(`Admin Panel → https://your-site.onrender.com/admin.html`);
});
