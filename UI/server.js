require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error("Mongo URI is not defined in the environment variables");
  process.exit(1);
}

console.log("Mongo URI:", MONGO_URI);

// Connect to MongoDB Atlas
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  password: String,
});

const User = mongoose.model("User", UserSchema);

// Summary Schema (Linked to Users)
const SummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const Summary = mongoose.model("Summary", SummarySchema);

// User Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, password } = req.body;
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, password: hashedPassword });
    await user.save();

    res.json({ message: "User registered!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to Authenticate Token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token.split(" ")[1], JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Save Summary (Authenticated Route)
app.post("/saveSummary", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const newSummary = new Summary({ userId: req.user.userId, text });
    await newSummary.save();
    res.status(201).json({ message: "Summary saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User's Summaries (Authenticated Route)
app.get("/getSummaries", authenticateToken, async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
