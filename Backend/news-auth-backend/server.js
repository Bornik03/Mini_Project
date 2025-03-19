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

if (!MONGO_URI) {
  console.error('Mongo URI is not defined in the environment variables');
  process.exit(1);
}

console.log("Mongo URI:", MONGO_URI);

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  password: String
});

const User = mongoose.model("User", UserSchema);

// User Signup
app.post("/signup", async (req, res) => {
  const { name, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ name, password: hashedPassword });
  await user.save();
  res.json({ message: "User registered!" });
});

// User Login
app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name });

  if (!user) return res.status(400).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));