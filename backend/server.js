
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { IncomingForm } = require("formidable");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();;
const port = 5000;

const multer = require("multer");

const corsOrigin = "http://localhost:3000";

app.use(
  cors({
    origin: [corsOrigin],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// Connect to MongoDB
const dbURI =
  "ADD YOU MONGODB URL";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("Connected to MongoDB"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.email }, 'your-secret-key');

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Create a Mongoose model for the 'transactions' collection
const transactionSchema = new mongoose.Schema({
  id: Number,
  gender: String,
  masterCategory: String,
  subCategory: String,
  articleType: String,
  baseColour: String,
  season: String,
  year: String,
  usage: String,
  productDisplayName: String,
  image: String,
  // Define other fields as needed
});

// Create a Transaction model
const Transaction = mongoose.model('Transaction', transactionSchema);

// API endpoints
app.get("/api/transactions", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const transactions = await Transaction.find().skip(skip).limit(limit);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve transactions" });
  }
});

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
  },
});

const upload = multer({ storage });
// Handle file upload
app.post("/api/recommend", upload.single("image"), async (req, res) => {
  // console.log(req.file);
  const fullPath = path.join(__dirname, "uploads", req.file.originalname);
  // const fullPath="C:\\Users\\my792\\Downloads\\fashionpy\\fashionpy\\fashion-recommender-system\\backend\\uploads\\batman.jpg"
  // console.log(fullPath)
  const formData = new FormData();
  formData.append('imagePath', fullPath);
  try {
    const response = await axios.post("http://localhost:8000/recommend", formData);
    const data = response.data;
    const mongoData = []
    
    for (const element of data?.indices ?? []) {
      try {
        const id = element.match(/\d+/)
        const transactions = await Transaction.findOne({id});
        if(transactions){
          mongoData.push(transactions)  
        }
        // Do something with transactions, e.g., mongoData.append(transactions)
      } catch (error) {
        console.error(`Error processing element ${element}: ${error.message}`);
        console.log(req.body)
      }
    }
    // console.log(data);
    return res.status(200).json({
      status: true,
      data: mongoData,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Update /api/filtered endpoint
app.get("/api/filtered", async (req, res) => {
  const { searchQuery, gender, color } = req.query;

  let query = {};

  if (gender) {
    query.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
  }

  if (color) {
    query.baseColour = { $regex: new RegExp(color, 'i') };
  }

  if (searchQuery) {
    // Add additional fields for search as needed
    query.$or = [
      { baseColour: { $regex: new RegExp(searchQuery, 'i') } },
      { gender: { $regex: new RegExp(searchQuery, 'i') } },
      { subCategory: { $regex: new RegExp(searchQuery, 'i') } },
    ];
  }

  try {
    const transactions = await Transaction.find(query).limit(10);
    res.json({
      status: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve filtered transactions" });
  }
});

const imageSchema = new mongoose.Schema({
  link: String,
  // Add other fields as needed
});

// Create an Image model
const Image = mongoose.model('Image', imageSchema);

// API endpoint for the "images" collection
app.get("/api/images", async (req, res) => {
  try {
    const images = await Image.find().limit(10);
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve images" });
  }
});

app.get("/api/filtered/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Transaction.findOne({ id: productId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      status: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve product details" });
  }
});
app.get("/api/test", async (req, res) => {
  const response = await fetch("http://localhost:8000");
  const data = await response.json();
  return res.json(data);
  
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
