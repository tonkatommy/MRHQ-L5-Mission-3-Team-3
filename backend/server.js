const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🎉 Welcome to the Express backend server!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is alive at 🌏 http://localhost:${PORT}`);
});
