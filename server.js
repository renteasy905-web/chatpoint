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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "djlkwjeb2",
  api_key: process.env.CLOUDINARY_API_KEY || "942326953292277",
  api_secret: process.env.CLOUDINARY_API_SECRET || "GC0SO2VrcpdMSLGzQsYjLZ1SAZg",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    if (file.fieldname === "categoryImage") {
      return {
        folder: "grocery_categories",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 600, height: 600, crop: "fill" }],
      };
    }
    return {
      folder: "grocery_items",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    };
  },
});

const upload = multer({ storage: storage });

// =============== FIXED CORS FOR RENDER (ONLY YOUR DOMAINS) ===============
app.use(cors({
  origin: [
    "https://chatpoint1.onrender.com",     // Your frontend domain
    "https://chatpoint-3ycy.onrender.com"  // Your backend domain (safety)
  ],
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Important: Handles preflight OPTIONS requests properly
app.options("*", cors());

// =============== OTHER MIDDLEWARE ===============
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
      plainPassword: String,
      isPremium: String,
      premiumType: {
        type: String,
        enum: ["far", "local", null],
        default: null,
      },
    },
    { timestamps: true }
  )
);

const GroceryCategory = mongoose.model(
  "GroceryCategory",
  new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
  })
);

const GroceryItem = mongoose.model(
  "GroceryItem",
  new mongoose.Schema({
    category: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    offerPrice: { type: Number },
    imageUrl: { type: String, required: true },
  })
);

const Shop = mongoose.model(
  "Shop",
  new mongoose.Schema({
    type: { type: String, default: "shop" },
    shopName: String,
    ownerName: String,
    mobile: String,
    items: [{ name: String, price: Number, description: String, imageUrl: [String] }],
    date: { type: Date, default: Date.now },
  })
);

const Order = mongoose.model(
  "Order",
  new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    user: { name: String, phone: String },
    shop: String,
    items: [{ name: String, price: Number, quantity: Number }],
    totalAmount: Number,
    deliveryCharge: Number,
    address: { name: String, phone: String, line1: String, line2: String },
    paymentMethod: { type: String, default: "cash" },
    status: { type: String, default: "pending" },
    progress: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    deliveredBy: {
      type: String,
      enum: ["Suraj", "Guru", null],
      default: null,
    },
    profitAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  })
);

// =============== ADMIN PASSWORD ===============
const ADMIN_PASSWORD = "Brand";

// =============== UNIVERSAL ORDER SAVE ===============
const saveOrderUniversal = async (req, res) => {
  try {
    const body = req.body;
    let userId = body.userId || body.user_id || null;
    const name = body.name || body.customer_name;
    const phone = body.phone || body.customer_phone;
    const address1 = body.address1 || body.address || body.line1;
    const address2 = body.address2 || body.line2 || "";
    const grandTotal = Number(body.grandTotal || body.totalAmount || body.total);
    const cart = body.cart || body.items;

    if (!name || !phone || !address1)
      return res.status(400).json({ success: false, message: "Missing name, phone or address" });
    if (!grandTotal || isNaN(grandTotal) || grandTotal <= 0)
      return res.status(400).json({ success: false, message: "Invalid total amount" });
    if (!cart || typeof cart !== "object" || Object.keys(cart).length === 0)
      return res.status(400).json({ success: false, message: "Empty cart" });

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

    if (items.length === 0) return res.status(400).json({ success: false, message: "No valid items" });

    const order = new Order({
      userId: userId || null,
      user: { name, phone },
      shop: shopName || "ChatPoint",
      items,
      totalAmount: grandTotal,
      deliveryCharge: grandTotal >= 69 ? 0 : 30,
      address: { name, phone, line1: address1, line2: address2 },
      paymentMethod: body.paymentMethod || "cash",
      progress: 0,
    });

    await order.save();
    console.log(`NEW ORDER → #${order._id} | ₹${grandTotal} | ${name}`);
    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("Order save error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== UPDATED: Make User Premium with Type ===============
app.post("/api/admin/make-premium", async (req, res) => {
  const { password, phone, premiumType } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Wrong admin password" });
  }
  if (!["far", "local"].includes(premiumType)) {
    return res.status(400).json({ success: false, message: "Invalid premiumType. Must be 'far' or 'local'" });
  }
  try {
    const updatedUser = await User.findOneAndUpdate(
      { phone },
      {
        $set: {
          isPremium: "yes",
          premiumType: premiumType,
        },
      },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.log(`User ${phone} upgraded to ${premiumType.toUpperCase()} PREMIUM`);
    res.json({
      success: true,
      message: `User upgraded to ${premiumType.toUpperCase()} Premium!`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Make premium error:", err);
    res.status(500).json({ success: false });
  }
});

// =============== API ENDPOINTS ===============
app.get("/api/categories", async (req, res) => {
  try {
    const cats = await GroceryCategory.find().sort({ name: 1 });
    res.json({
      success: true,
      categories: cats.map((c) => ({ name: c.name, imageUrl: c.imageUrl })),
    });
  } catch (e) {
    console.error(e);
    res.json({ success: true, categories: [] });
  }
});

app.get("/api/items/:category", async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const items = await GroceryItem.find({ category });
    const formattedItems = items.map((item) => {
      const obj = item.toObject();
      return {
        ...obj,
        originalPrice: obj.originalPrice || obj.price,
        offerPrice: obj.offerPrice || obj.price,
      };
    });
    res.json({ success: true, items: formattedItems });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

app.post(
  "/api/admin/add-item",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "categoryImage", maxCount: 1 },
  ]),
  async (req, res) => {
    const { password, category, name, originalPrice, offerPrice } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: "Wrong password" });
    try {
      if (!req.files["image"] || !req.files["image"][0]) {
        return res.status(400).json({ success: false, message: "Item image required" });
      }
      const itemImageUrl = req.files["image"][0].path;
      if (req.files["categoryImage"] && req.files["categoryImage"][0]) {
        const catImageUrl = req.files["categoryImage"][0].path;
        await GroceryCategory.findOneAndUpdate(
          { name: category.trim() },
          { name: category.trim(), imageUrl: catImageUrl },
          { upsert: true, new: true }
        );
      } else {
        const existing = await GroceryCategory.findOne({ name: category.trim() });
        if (!existing) return res.status(400).json({ success: false, message: "Category not found. Upload photo to create new." });
      }
      const newItem = new GroceryItem({
        category: category.trim(),
        name: name.trim(),
        price: Number(offerPrice || originalPrice),
        originalPrice: Number(originalPrice),
        offerPrice: Number(offerPrice),
        imageUrl: itemImageUrl,
      });
      await newItem.save();
      res.json({ success: true, item: newItem });
    } catch (e) {
      console.error("Add item error:", e);
      res.status(500).json({ success: false, message: e.message || "Server error" });
    }
  }
);

app.post("/api/admin/edit-item", async (req, res) => {
  const { password, itemId, originalPrice, offerPrice } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });
  try {
    const updateData = {
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      price: offerPrice ? Number(offerPrice) : undefined,
    };
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
    const updated = await GroceryItem.findByIdAndUpdate(itemId, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false });
    res.json({ success: true, item: updated });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

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

app.post("/api/save-order", saveOrderUniversal);
app.post("/api/place-order", saveOrderUniversal);
app.post("/api/checkout", saveOrderUniversal);
app.post("/api/order", saveOrderUniversal);

app.post("/api/user/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ success: false });
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: "Phone already registered" });
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    const user = new User({
      name,
      phone,
      password: hash,
      plainPassword: password,
    });
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
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        isPremium: user.isPremium === "yes",
        premiumType: user.premiumType || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

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
    const orders = await Order.find({ status: { $in: ["pending", "confirmed"] } })
      .sort({ date: -1 })
      .limit(50)
      .lean();
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

app.post("/api/update-order-progress", async (req, res) => {
  try {
    const { orderId, progress } = req.body;
    if (!orderId || progress < 0 || progress > 4) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }
    const updated = await Order.findByIdAndUpdate(orderId, { progress: Number(progress) }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Order not found" });
    console.log(`Order ${orderId} → Progress ${progress}/4`);
    res.json({ success: true, order: updated });
  } catch (err) {
    console.error("Progress update error:", err);
    res.status(500).json({ success: false });
  }
});

app.post("/api/update-order-status", async (req, res) => {
  try {
    const { orderId, status, deliveredBy, profitAmount } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }
    const updateData = {};
    if (status) {
      if (!["confirmed", "delivered", "cancelled"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      updateData.status = status;
    }
    if (status === "delivered") {
      if (!deliveredBy || !["Suraj", "Guru"].includes(deliveredBy)) {
        return res.status(400).json({
          success: false,
          message: "When marking delivered, 'deliveredBy' must be 'Suraj' or 'Guru'",
        });
      }
      if (profitAmount === undefined || typeof profitAmount !== "number" || profitAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "When marking delivered, 'profitAmount' must be a non-negative number",
        });
      }
      updateData.deliveredBy = deliveredBy;
      updateData.profitAmount = profitAmount;
    }
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.log(
      `Order ${orderId} updated → status: ${status || "unchanged"}, ` +
      `deliveredBy: ${deliveredBy || "—"}, profit: ₹${profitAmount || "—"}`
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/api/delete-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false });
    const result = await Order.findByIdAndDelete(orderId);
    if (!result) return res.status(404).json({ success: false });
    console.log(`Order ${orderId} DELETED`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/my-orders", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    let query = {};
    if (userId) {
      query = { userId };
    } else {
      return res.json({ success: true, orders: [] });
    }
    const orders = await Order.find(query).sort({ date: -1 }).lean();
    res.json({ success: true, orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

app.get("/api/order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        name: 1,
        phone: 1,
        isPremium: 1,
        premiumType: 1,
        plainPassword: 1,
        _id: 0,
      }
    ).sort({ createdAt: -1 });
    const safeUsers = users.map((u) => ({
      name: u.name,
      phone: u.phone,
      isPremium: u.isPremium,
      premiumType: u.premiumType,
      plainPassword: u.plainPassword || "Not available",
    }));
    res.json({ users: safeUsers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// =============== SERVE PAGES ===============
const pages = [
  "index",
  "gitems",
  "adminportal",
  "gcart",
  "privacy",
  "delivery",
  "orders",
  "cart",
  "payment",
  "login",
  "admin",
  "items",
  "tracking",
  "categories",
  "pindex",
];
pages.forEach((p) => {
  const route = p === "index" ? "/" : `/${p}.html`;
  const file = p === "index" ? "index.html" : `${p}.html`;
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, file)));
});
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Categories: http://localhost:${PORT}/categories.html`);
  console.log(`Tracking: http://localhost:${PORT}/tracking.html`);
});
