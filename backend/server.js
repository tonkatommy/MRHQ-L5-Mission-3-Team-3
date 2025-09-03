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

// Example route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🎉 Welcome to the Express backend server!" });
});

// Test AI response
app.get("/api/v1/test/", async (req, res) => {
  const userInput =
    "Tell the user 'Congratulations! You've found the Mission Ready Team 3 Gemini Chat bot!'. Add flair and excitement to the message.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
    });
    res.status(200).json({ output: response.text });
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    res.status(500).json({ error: "❌ Failed to generate AI response" });
  }
});

// Fetch AI response from user input
app.post("/api/v1/chat/", async (req, res) => {
  const userInput = req.body.input;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
    });
    res.status(200).json({ output: response.text });
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    res.status(500).json({ error: "❌ Failed to generate AI response" });
  }
});

// NEW: Streaming chat endpoint
app.post("/api/v1/chat/stream/", async (req, res) => {
  const userInput = req.body.input;

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  try {
    // Use the streaming method from Gemini API
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: userInput,
    });

    // Stream each chunk as it comes in
    for await (const chunk of response) {
      if (chunk.text) {
        // Send the chunk as a Server-Sent Event
        res.write(`data: ${JSON.stringify({ chunk: chunk.text, done: false })}\n\n`);
      }
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ chunk: "", done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    res.write(
      `data: ${JSON.stringify({ error: "❌ Failed to generate AI response", done: true })}\n\n`
    );
    res.end();
  }
});

// NEW: Streaming interview endpoint for the TextBot
app.post("/api/v1/interview/stream/", async (req, res) => {
  const { prompt, isFirstMessage = false } = req.body;

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    for await (const chunk of response) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ chunk: chunk.text, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ chunk: "", done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    res.write(
      `data: ${JSON.stringify({ error: "❌ Failed to generate AI response", done: true })}\n\n`
    );
    res.end();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is alive at 🌏 http://localhost:${PORT}`);
});
