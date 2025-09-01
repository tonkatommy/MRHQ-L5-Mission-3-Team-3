import React, { useEffect, useMemo, useState } from "react";
import "../App.css";

import { GoogleGenAI } from "@google/genai";

import MyTextInput from "../components/TextInput.jsx";
import ChatLog from "../components/ChatLog.jsx";
import MyTextInputNoButton from "../components/TextInputNoButton.jsx";

function TextBot() {
  const [textValue, setTextValue] = useState("");
  const [onUse, setOnUse] = useState(false);

  const [jobType, setJobType] = useState("");
  const [jobOnUse, setJobOnUse] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [originalPrompt, setOriginalPrompt] = useState("");

  // Create the Google GenAI client once
  const ai = useMemo(
    () => new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY }),
    []
  );

  /* -------------------- First prompt (kick off the interview) -------------------- */
  useEffect(() => {
    if (!jobOnUse || !jobType.trim()) return;

    async function main() {
      try {
        const prompt = `You are a job interviewer. You are interviewing a candidate for the position of "${jobType}".
Ask exactly one question at a time and wait for the candidate's reply before asking the next.
Begin with: "Tell me about yourself."
Ask a total of 6 questions (including the first). After the 6th answer, provide constructive feedback on how the candidate performed and how they can improve.`;

        setOriginalPrompt("User: " + prompt);

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const text = await response.text();
        setChatHistory((prev) => [...prev, "Model: " + text]);
      } catch (err) {
        console.error(err);
        setChatHistory((prev) => [
          ...prev,
          "Model: (error starting interview)",
        ]);
      } finally {
        // prevent re-firing
        setJobOnUse(false);
      }
    }

    main();
  }, [jobOnUse, jobType, ai]);

  /* -------------------- Follow-up turns -------------------- */
  useEffect(() => {
    if (!onUse || !textValue.trim()) return;

    async function main() {
      // stop the trigger immediately to avoid double fires
      setOnUse(false);

      // show user's message once
      setChatHistory((prev) => [...prev, "User: " + textValue]);

      try {
        // snapshot current history so we don't depend on it (avoids loops)
        const historySnapshot = chatHistory.join("\n");

        const prompt = `Here is the chat history so far:
${originalPrompt}
${historySnapshot}
The candidate just answered: "${textValue}"
Reply with the next interviewer message. If this was the 6th answer, provide final feedback and end the interview.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const text = await response.text();
        setChatHistory((prev) => [...prev, "Model: " + text]);
      } catch (err) {
        console.error(err);
        setChatHistory((prev) => [...prev, "Model: (error getting reply)"]);
      }
    }

    main();
    // NOTE: do not include chatHistory in deps to avoid append→rerender loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUse, textValue, originalPrompt, ai]);

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="title">AI Mock Interviewer</h1>

        <div className="field-row">
          <label className="field-label" htmlFor="jobTitle">
            Job Title:
          </label>
          <MyTextInputNoButton
            setTextValue={setJobType}
            setOnUse={setJobOnUse}
          />
        </div>

        <ChatLog chat={chatHistory} />

        <MyTextInput setTextValue={setTextValue} setOnUse={setOnUse} />
      </div>
    </div>
  );
}

export default TextBot;
