require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;

// =============== CLOUDINARY CONFIG ===============
cloudinary.config({
  cloud_name: "djlkwjeb2",
  api_key: "942326953292277",
  api_secret: "GC0SO2VrcpdMSLGzQsYjLZ1SAZg",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "grocery_items",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const upload = multer({ storage: storage });

// =============== MIDDLEWARE ===============
app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// =============== MONGO DB CONNECTION ===============
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Error:", err);
    process.exit(1);
  });

// =============== MODELS ===============
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: String,
      phone: { type: String, required: true, unique: true },
      password: String,
    },
    { timestamps: true }
  )
);

const GroceryCategory = mongoose.model(
  "GroceryCategory",
  new mongoose.Schema({
    name: { type: String, required: true, unique: true },
  })
);

const GroceryItem = mongoose.model(
  "GroceryItem",
  new mongoose.Schema({
    category: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
  })
);

const Shop = mongoose.model("Shop", new mongoose.Schema({
  type: { type: String, default: "shop" },
  shopName: String,
  ownerName: String,
  mobile: String,
  items: [{ name: String, price: Number, description: String, imageUrl: [String] }],
  date: { type: Date, default: Date.now },
}));

const Order = mongoose.model("Order", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: false },
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

// =============== ADMIN PASSWORD ===============
const ADMIN_PASSWORD = "Brand"; // CHANGE THIS FOR SECURITY!

// =============== API ENDPOINTS ===============

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const cats = await GroceryCategory.find().sort({ name: 1 });
    res.json({ success: true, categories: cats.map((c) => c.name) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// Get items by category
app.get("/api/items/:category", async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const items = await GroceryItem.find({ category });
    res.json({ success: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// Add new item
app.post("/api/admin/add-item", upload.single("image"), async (req, res) => {
  const { password, category, name, price } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: "Wrong password" });

  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Image required" });

    const newItem = new GroceryItem({
      category: category.trim(),
      name: name.trim(),
      price: Number(price),
      imageUrl: req.file.path,
    });
    await newItem.save();

    // Auto-create category if not exists
    await GroceryCategory.findOneAndUpdate(
      { name: category.trim() },
      { name: category.trim() },
      { upsert: true }
    );

    res.json({ success: true, item: newItem });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// Edit price
app.post("/api/admin/edit-item", async (req, res) => {
  const { password, itemId, price } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });

  try {
    const updated = await GroceryItem.findByIdAndUpdate(itemId, { price: Number(price) }, { new: true });
    if (!updated) return res.status(404).json({ success: false });
    res.json({ success: true, item: updated });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Delete item
app.delete("/api/admin/delete-item/:id", async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });

  try {
    await GroceryItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// =============== EXISTING ORDER & USER ROUTES (unchanged) ===============
// ... (keep all your original order, user, shop routes here - same as before)

// Universal order save
const saveOrderUniversal = async (req, res) => {
  // ... (your existing saveOrderUniversal code)
};

// Keep all your other routes: /api/save-order, /api/user/signup, etc.

// =============== SERVE PAGES ===============
const pages = ["index", "gitems", "adminportal", "gcart", "privacy", "delivery", "orders", "cart", "payment", "login", "admin"];

pages.forEach((p) => {
  const route = p === "index" ? "/" : `/${p}.html`;
  const file = p === "index" ? "index.html" : `${p}.html`;
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, file)));
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin Portal: http://localhost:${PORT}/adminportal.html`);
});
