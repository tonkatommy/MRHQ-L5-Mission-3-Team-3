// ===== IMPORTS =====
// React hooks for state management and side effects
import { useEffect, useRef, useState } from "react";
import "../App.css";

// Import custom components for the interview interface
import MyTextInput from "../components/TextInput.jsx";
import ChatLog from "../components/ChatLog.jsx";
import MyTextInputNoButton from "../components/TextInputNoButton.jsx";

function TextBot() {
  // ===== STATE VARIABLES =====

  // --- User Input State ---
  const [textValue, setTextValue] = useState(""); // Current user's typed message
  const [onUse, setOnUse] = useState(false); // Trigger: when true, sends user message to AI

  // --- Job Setup State ---
  const [jobType, setJobType] = useState(""); // Job title entered by user (e.g., "Software Developer")
  const [jobOnUse, setJobOnUse] = useState(false); // Trigger: when true, starts the interview

  // --- Conversation State ---
  const [chatHistory, setChatHistory] = useState([]); // Array of all messages: ["User: Hello", "Model: Hi there!"]
  const [originalPrompt, setOriginalPrompt] = useState(""); // Stores the initial interview setup prompt

  // --- UI State ---
  const [isStreaming, setIsStreaming] = useState(false); // True when AI is currently generating a response
  // This prevents user from sending multiple messages while AI is "typing"

  // Ref to track if a request is in-flight
  const inFlightRef = useRef(false);

  // ===== STREAMING FUNCTION =====
  // This is the heart of the real-time streaming functionality
  // It handles Server-Sent Events (SSE) from our Express backend
  const streamResponse = async (prompt, isFirstMessage = false) => {
    console.log(
      `🔄 Starting to stream ${
        isFirstMessage ? "initial" : "follow-up"
      } response`
    );

    // Prevent multiple simultaneous requests
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Set streaming state to true - this will:
    // 1. Disable the input field (prevent multiple simultaneous requests)
    // 2. Show "AI is typing..." indicator
    setIsStreaming(true);

    // ===== MAKE STREAMING REQUEST =====
    // We use fetch() instead of axios because:
    // - fetch() has better support for ReadableStream
    // - SSE (Server-Sent Events) works more reliably with fetch()
    // - axios buffers responses, defeating the purpose of streaming
    let accumulatedText = "";
    let messageIndex = -1;

    try {
      // Add placeholder and capture index
      setChatHistory((prev) => {
        const newHistory = [...prev, "Model: "];
        messageIndex = newHistory.length - 1;
        console.log(
          `📝 Added placeholder at index ${messageIndex}, total messages: ${newHistory.length}`
        );
        return newHistory;
      });

      // Make request
      console.log(`🌐 Making request to backend...`);
      const response = await fetch(
        "http://localhost:3000/api/v1/interview/stream/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt, // The full prompt to send to Gemini
            isFirstMessage, // Context for the backend
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Got response, starting stream reading...`);

      // ===== SET UP STREAM READING =====
      // Get a reader for the response body stream
      const reader = response.body.getReader();

      // TextDecoder converts raw bytes to UTF-8 strings
      const decoder = new TextDecoder();

      let chunkCount = 0;

      // ===== MAIN STREAMING LOOP =====
      // This loop processes chunks of data as they arrive from the server
      while (true) {
        // Read the next chunk from the stream
        const { done, value } = await reader.read();

        // If done is true, we've reached the end of the stream
        if (done) {
          console.log(
            `🏁 Stream finished. Total chunks: ${chunkCount}, Final text length: ${accumulatedText.length}`
          );
          break;
        }

        // Convert the raw bytes to a string
        const chunk = decoder.decode(value);

        // SSE format uses newlines to separate events, so split by newline
        const lines = chunk.split("\n");
        console.log(`📦 Received chunk with ${lines.length} lines`);

        // ===== PROCESS EACH LINE =====
        // Server-Sent Events have a specific format: "data: {JSON}\n\n"
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              // Remove the "data: " prefix and parse the JSON
              const data = JSON.parse(line.slice(6));
              console.log(
                `📋 Parsed data: ${JSON.stringify(data).substring(0, 100)}...`
              );

              // ===== HANDLE ERROR RESPONSES =====
              if (data.error) {
                console.error("❌ Streaming error received:", data.error);

                // Update the chat with the error message
                setChatHistory((prev) => {
                  const newHistory = [...prev];
                  if (messageIndex >= 0) {
                    newHistory[messageIndex] = `Model: Error: ${data.error}`;
                  }
                  return newHistory;
                });
                return; // Stop processing this stream
              }

              // ===== HANDLE TEXT CHUNKS =====
              // This is where the magic happens - real-time text updates!
              if (!data.done && data.chunk) {
                // Add the new chunk to our accumulated text
                accumulatedText += data.chunk;

                console.log(
                  `📝 Chunk #${chunkCount}: "${data.chunk}" (accumulated: ${accumulatedText.length} chars)`
                );

                // Update the chat history with the growing response
                // This creates the typewriter effect where users see text appearing in real-time
                setChatHistory((prev) => {
                  const newHistory = [...prev]; // Create a copy of the array
                  if (messageIndex >= 0 && messageIndex < newHistory.length) {
                    newHistory[messageIndex] = `Model: ${accumulatedText}`;
                    console.log(`🔄 Updated message at index ${messageIndex}`);
                  } else {
                    console.log(
                      `⚠️ Invalid index: ${messageIndex}, array length: ${newHistory.length}`
                    );
                  }
                  return newHistory;
                });
              }

              // ===== HANDLE COMPLETION =====
              if (data.done) {
                console.log(
                  `🎉 Streaming completed. Final message: "${accumulatedText.substring(
                    0,
                    50
                  )}..."`
                );

                // Finalize the message with the complete text
                // This ensures the final message is properly formatted
                setChatHistory((prev) => {
                  const newHistory = [...prev];
                  if (messageIndex >= 0 && messageIndex < newHistory.length) {
                    newHistory[messageIndex] = `Model: ${accumulatedText}`;
                  }
                  return newHistory;
                });
              }
            } catch (parseError) {
              // Handle JSON parsing errors gracefully
              console.error(`❌ JSON parse error: ${parseError.message}`);
              console.error("Raw line that failed to parse:", line);
            }
          } else if (line.trim()) {
            console.log(`📄 Non-data line: "${line}"`);
          }
        }
      }
    } catch (networkError) {
      // Handle network errors (server down, connection lost, etc.)
      console.error(`❌ Network error: ${networkError.message}`);

      // Add an error message to the chat
      setChatHistory((prev) => [
        ...prev,
        `Model: ❌ Error: ${networkError.message}`,
      ]);
    } finally {
      // ===== CLEANUP =====
      // Always re-enable user input when streaming ends (success or failure)
      setIsStreaming(false);
      // Clear the in-flight ref
      inFlightRef.current = false;
      console.log(`🔓 Streaming ended, user input re-enabled`);
    }
  };

  // ===== REACT EFFECT HOOKS =====
  // These hooks manage the interview flow and trigger AI responses

  // ===== EFFECT 1: START INTERVIEW =====
  // This effect runs when the user submits a job type and starts the interview
  useEffect(() => {
    // Guard clause: only run if interview should start
    if (!jobOnUse) {
      console.log("⏸️ Interview not started yet, waiting for job type...");
      return;
    }

    // Reset trigger immediately
    setJobOnUse(false);

    console.log(`🎤 Starting interview for position: ${jobType}`);

    // ===== CREATE INITIAL INTERVIEW PROMPT =====
    // This prompt sets up the AI as a professional interviewer
    const prompt = `You are a professional interviewer for ${jobType}. 
    Ask exactly 6 questions, one at a time, starting with: "Tell me about your previous experience with ${jobType}." 
    Adjust wording of first question if needed so it reads naturally for the given job type. Do not include greetings. 
    Each follow-up must be based only on the candidate's previous answer, professional, varied, and one sentence max. 
    If off-topic, redirect without counting it as one of the 6 questions. 
    If they skip/refuse, rephrase or explain why it matters; if they continue, end the interview. 
    After 6 valid answers, give a 3-sentence feedback summary of strengths and improvements.`;

    // Store the original prompt for context in follow-up messages
    // This helps the AI understand the interview context throughout the conversation
    setOriginalPrompt("User: " + prompt);

    console.log("📋 Interview prompt created and stored");

    // Start streaming the AI's opening question (should be "Tell me about yourself")
    streamResponse(prompt, true);
  }, [jobOnUse, jobType]); // Dependencies: re-run when these values change

  // ===== EFFECT 2: HANDLE USER RESPONSES =====
  // This effect runs when the user submits an answer during the interview
  useEffect(() => {
    // Guard clauses: don't process if...
    if (!onUse) {
      console.log("⏸️ No user input to process");
      return; // User hasn't submitted anything
    }
    // Reset trigger immediately
    setOnUse(false);

    if (isStreaming) {
      console.log("⏸️ Already streaming, ignoring duplicate trigger");
      return; // Already processing a response (prevents conflicts)
    }

    console.log(`💬 Processing user response: "${textValue}"`);

    // ===== ADD USER MESSAGE TO CHAT IMMEDIATELY =====
    // We add the user's message right away (before building the prompt)
    // This ensures the user sees their message appear immediately for better UX
    setChatHistory((prevChatHistory) => {
      const updated = [...prevChatHistory, "User: " + textValue];
      console.log(`👤 Added user message, total messages: ${updated.length}`);

      // ===== BUILD CONTEXT FOR AI (with updated history) =====
      // Include the full conversation history so the AI can:
      // 1. Remember what questions were already asked
      // 2. Understand the flow of the interview
      // 3. Ask relevant follow-up questions
      // 4. Provide appropriate final feedback
      const conversationContext = updated.join("\n");
      const prompt = `Here is the chat history so far: ${originalPrompt}
${conversationContext}

Give your next reply as the interviewer. Remember to:
- Ask one question at a time
- Base your questions on their responses  
- After 6 questions total, provide feedback and suggestions for improvement`;

      console.log("📋 Built conversation context for AI with updated history");
      console.log(
        "📝 Current conversation length:",
        updated.length,
        "messages"
      );

      // ===== STREAM THE AI'S RESPONSE =====
      // The AI will generate the next interview question or provide final feedback
      streamResponse(prompt, false);

      return updated;
    });
  }, [onUse]); // Dependencies: re-run when user submits input

  // ===== COMPONENT RENDER =====

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="title">🤖 AI Mock Interviewer</h1>

        {/* ===== JOB TITLE INPUT SECTION ===== */}
        <div className="field-row">
          <label className="field-label" htmlFor="jobTitle">
            Job Title:
          </label>
          {/* 
            MyTextInputNoButton component:
            - setTextValue={setJobType}: Updates jobType state with user's input
            - setOnUse={setJobOnUse}: Triggers the interview start when user submits
          */}
          <MyTextInputNoButton
            setTextValue={setJobType}
            setOnUse={setJobOnUse}
          />
        </div>

        {/* ===== CONVERSATION DISPLAY ===== */}
        {/* 
          ChatLog component displays all messages in the conversation:
          - Shows both user messages and AI responses
          - Updates in real-time as AI response streams in
          - Format: ["User: Hello", "Model: Hi there!", "User: Tell me about yourself", "Model: I am..."]
        */}
        <ChatLog chat={chatHistory} />

        {/* ===== USER INPUT FOR INTERVIEW RESPONSES ===== */}
        {/* 
          MyTextInput component:
          - setTextValue={setTextValue}: Updates textValue state with user's response
          - setOnUse={setOnUse}: Triggers sending the response to AI when user submits
          - disabled={isStreaming}: Prevents user from sending messages while AI is responding
        */}
        <MyTextInput
          setTextValue={setTextValue}
          setOnUse={setOnUse}
          disabled={isStreaming} // This is crucial for preventing multiple simultaneous requests
        />

        {/* ===== STREAMING INDICATOR ===== */}
        {/* Show visual feedback when AI is generating a response */}
        {isStreaming && (
          <div className="streaming-indicator">
            <p>🤖 AI is thinking and responding...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TextBot;
