// ===== IMPORTS AND SETUP =====
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
// Make sure you have GEMINI_API_KEY and optionally PORT in your .env file
dotenv.config();

// Import Google Gen AI SDK
// This is the official Google SDK for interacting with Gemini models
import { GoogleGenAI } from "@google/genai";

// ===== EXPRESS SERVER CONFIGURATION =====
const app = express();
const PORT = process.env.PORT || 3000; // Use environment PORT or default to 3000

// ===== MIDDLEWARE SETUP =====
// Enable Cross-Origin Resource Sharing (CORS)
// This allows your React frontend (usually on port 5173/3000) to make requests to this backend
app.use(cors());

// Parse JSON request bodies
// This middleware allows us to access req.body.input, req.body.prompt, etc.
app.use(express.json());

// ===== GOOGLE AI CLIENT INITIALIZATION =====
// Initialize the GoogleGenAI client with your API key
// The API key should be stored in your .env file as GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ===== BASIC HEALTH CHECK ROUTES =====

// Root endpoint - simple server health check
// GET http://localhost:3000/
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🎉 Welcome to the Express backend server!",
    status: "Server is running",
    endpoints: {
      test: "GET /api/v1/test/",
      chat: "POST /api/v1/chat/",
      chatStream: "POST /api/v1/chat/stream/",
      interviewStream: "POST /api/v1/interview/stream/",
    },
  });
});

// Test endpoint with predefined prompt
// GET http://localhost:3000/api/v1/test/
// This is useful for testing if your Gemini API connection is working
app.get("/api/v1/test/", async (req, res) => {
  // Predefined prompt for testing
  const userInput =
    "Tell the user 'Congratulations! You've found the Mission Ready Team 3 Gemini Chat bot!'. Add flair and excitement to the message.";

  try {
    console.log("🔄 Testing Gemini API connection...");

    // Use the traditional (non-streaming) generateContent method
    // This waits for the complete response before returning
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using the fast Gemini 2.5 Flash model
      contents: userInput,
    });

    console.log("✅ Gemini API test successful");

    // Return the complete response as JSON
    res.status(200).json({ output: response.text });
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    res.status(500).json({
      error: "❌ Failed to generate AI response",
      details: error.message,
    });
  }
});

// ===== TRADITIONAL NON-STREAMING ENDPOINTS =====

// Traditional chat endpoint (returns complete response at once)
// POST http://localhost:3000/api/v1/chat/
// Body: { "input": "Your message here" }
app.post("/api/v1/chat/", async (req, res) => {
  const userInput = req.body.input;

  // Validate input
  if (!userInput) {
    return res.status(400).json({ error: "Missing 'input' in request body" });
  }

  try {
    console.log("🔄 Processing chat request (non-streaming):", userInput.substring(0, 50) + "...");

    // Traditional approach: generateContent waits for the complete response
    // The user sees nothing until Gemini finishes generating the entire response
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
    });

    console.log("✅ Chat response generated");

    // Send the entire response back as JSON once it's complete
    res.status(200).json({ output: response.text });
  } catch (error) {
    console.error("❌ Error generating AI response:", error);
    res.status(500).json({
      error: "❌ Failed to generate AI response",
      details: error.message,
    });
  }
});

// ===== STREAMING ENDPOINTS USING SERVER-SENT EVENTS (SSE) =====

// Generic streaming chat endpoint
// POST http://localhost:3000/api/v1/chat/stream/
// Body: { "input": "Your message here" }
// This streams the AI response in real-time as it's being generated
app.post("/api/v1/chat/stream/", async (req, res) => {
  const userInput = req.body.input;

  // Validate input
  if (!userInput) {
    return res.status(400).json({ error: "Missing 'input' in request body" });
  }

  console.log("🔄 Processing streaming chat request:", userInput.substring(0, 50) + "...");

  // ===== SET UP SERVER-SENT EVENTS (SSE) HEADERS =====
  // These headers are crucial for establishing a streaming connection
  res.writeHead(200, {
    // SSE requires this specific content type
    "Content-Type": "text/event-stream",

    // Prevent any caching of the stream data
    "Cache-Control": "no-cache",

    // Keep the connection open for streaming
    Connection: "keep-alive",

    // CORS headers to allow frontend access
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  try {
    // ===== USE GEMINI'S STREAMING API =====
    // generateContentStream returns chunks as they're generated
    // instead of waiting for the complete response
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContentStream(userInput);

    // ===== PROCESS AND SEND EACH CHUNK =====
    // The 'for await' loop processes each chunk as it arrives from Gemini
    for await (const chunk of response) {
      if (chunk.text) {
        // Create the SSE data packet
        // SSE format requires: "data: {JSON data}\n\n"
        const sseData = {
          chunk: chunk.text, // The text chunk from Gemini
          done: false, // Indicates more chunks are coming
        };

        // Send the chunk to the frontend immediately
        res.write(`data: ${JSON.stringify(sseData)}\n\n`);

        console.log("📤 Sent chunk:", chunk.text.substring(0, 30) + "...");
      }
    }

    // ===== SEND COMPLETION SIGNAL =====
    // Let the frontend know streaming is complete
    res.write(`data: ${JSON.stringify({ chunk: "", done: true })}\n\n`);

    console.log("✅ Streaming completed successfully");

    // Close the SSE connection
    res.end();
  } catch (error) {
    console.error("❌ Error during streaming:", error);

    // Send error through the stream (not as HTTP error)
    // This allows the frontend to handle errors gracefully
    const errorData = {
      error: "❌ Failed to generate AI response",
      details: error.message,
      done: true,
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  }
});

// Specialized streaming endpoint for interview functionality
// POST http://localhost:3000/api/v1/interview/stream/
// Body: { "prompt": "Full interview prompt", "isFirstMessage": true/false }
// This endpoint is specifically designed for the TextBot interview flow
app.post("/api/v1/interview/stream/", async (req, res) => {
  const { prompt, isFirstMessage = false } = req.body;

  // Validate input
  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in request body" });
  }

  console.log(`🎤 Processing ${isFirstMessage ? "initial" : "follow-up"} interview request`);
  console.log("📝 Prompt preview:", prompt.substring(0, 100) + "...");

  // ===== SET UP SSE HEADERS (same as above) =====
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  try {
    // ===== STREAM THE INTERVIEW RESPONSE =====
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContentStream({
      contents: prompt,
    });

    console.log("📡 Starting to stream interview response...");

    for await (const chunk of response) {
      if (chunk.text) {
        const sseData = {
          chunk: chunk.text,
          done: false,
          isFirstMessage, // Pass through for frontend context
        };

        res.write(`data: ${JSON.stringify(sseData)}\n\n`);

        console.log("🎙️ Interview chunk:", chunk.text.substring(0, 30) + "...");
      }
    }

    // Signal completion
    res.write(`data: ${JSON.stringify({ chunk: "", done: true, isFirstMessage })}\n\n`);
    console.log("✅ Interview response streaming completed");

    res.end();
  } catch (error) {
    console.error("❌ Error during interview streaming:", error);

    const errorData = {
      error: "❌ Failed to generate interview response",
      details: error.message,
      done: true,
      isFirstMessage,
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  }
});

// ===== SERVER STARTUP =====
app.listen(PORT, () => {
  console.log(`🚀 Server started successfully!`);
  console.log(`🌍 Server URL: http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • GET  /                           - Health check`);
  console.log(`   • GET  /api/v1/test/               - Test Gemini connection`);
  console.log(`   • POST /api/v1/chat/               - Traditional chat (complete response)`);
  console.log(`   • POST /api/v1/chat/stream/        - Streaming chat (real-time)`);
  console.log(`   • POST /api/v1/interview/stream/   - Streaming interview (for TextBot)`);
  console.log(`\n💡 Make sure GEMINI_API_KEY is set in your .env file`);

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn(`⚠️  WARNING: GEMINI_API_KEY not found in environment variables!`);
    console.log(`   Create a .env file with: GEMINI_API_KEY=your_api_key_here`);
  }
});
