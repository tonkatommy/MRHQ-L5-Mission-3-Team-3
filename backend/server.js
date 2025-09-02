import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Import Google Gen AI
import { GoogleGenAI } from "@google/genai";

// Use express and get PORT from env
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Google AI API
// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const testAIresponse = async () => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
};

testAIresponse();

// Example route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🎉 Welcome to the Express backend server!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is alive at 🌏 http://localhost:${PORT}`);
});
