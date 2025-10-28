require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!uri || !jwtSecret) {
  console.error("MONGO_URI or JWT_SECRET not found in .env file");
  process.exit(1);
}

const client = new MongoClient(uri);
let usersCollection;
let contactsCollection;

async function connectDB() {
  try {
    await client.connect();
    const database = client.db("jewellery-db"); // You can name your database
    usersCollection = database.collection("users");
    contactsCollection = database.collection("contacts");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1);
  }
}

// --- API Routes ---

// Registration Route
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    console.log("User inserted:", result);  // Log the result of the insert operation
    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user._id,
        name: user.name,
      },
    };

    jwt.sign(payload, jwtSecret, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Contact Form Route
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Please fill out all fields" });
    }

    const contactSubmission = {
      name,
      email,
      message,
      submittedAt: new Date(),
    };

    await contactsCollection.insertOne(contactSubmission);

    res.status(201).json({ message: "Your message has been received!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Server error while submitting message" });
  }
});

app.get("/", (req, res) => {
  res.send("Jewellery E-Commerce Backend is running!");
});

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();