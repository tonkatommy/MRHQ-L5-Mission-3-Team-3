import { useEffect, useMemo, useState } from "react";
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

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  // First Prompt
  useEffect(() => {
    if (!jobOnUse) return;
    async function main() {
      const prompt = `You are a professional job interviewer for ${jobType}. 
      Conduct a structured interview with exactly 6 questions, starting with "Tell me about your previous experience with ${jobType}," adjusting wording for grammar if needed. 
      Avoid greetings or introductions. Ask each subsequent question, keep in mind previous questions and answers received to avoid questions that are too similar. Keep questions concise (one sentence max), professional, focused, and phrasing varied to avoid repetition. 
      If the candidate gives an off-topic answer or skips a question, politely redirect or prompt for a relevant response; allow partial answers if needed. 
      If the candidate repeatedly refuses, explain why the information is important and, if refusal continues, conclude the interview professionally. 
      After 6 valid questions, provide a concise 3-sentence feedback summary highlighting strengths and suggesting improvements. 
      Track progress internally to ensure exactly 6 valid questions are asked.
      `;
      setOriginalPrompt("User: " + prompt);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text;
      setChatHistory((prevChatHistory) => [...prevChatHistory, "Model: " + text]);
    }
    main();
  }, [jobOnUse, jobType]);

  // Following Chat
  useEffect(() => {
    if (!onUse) return;
    async function main() {
      const prompt = `Here is the chat history so far: ${originalPrompt} ${chatHistory.toString()}
        The candidate just answered: ${textValue} give your next reply`;
      setChatHistory((prevChatHistory) => [...prevChatHistory, "User: " + textValue]);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text;
      setChatHistory((prevChatHistory) => [...prevChatHistory, "Model: " + text]);
    }
    main();
  }, [onUse, textValue]);

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="title">AI Mock Interviewer</h1>

        <div className="field-row">
          <label className="field-label" htmlFor="jobTitle">
            Job Title:
          </label>
          <MyTextInputNoButton setTextValue={setJobType} setOnUse={setJobOnUse} />
        </div>

        <ChatLog chat={chatHistory} />

        <MyTextInput setTextValue={setTextValue} setOnUse={setOnUse} />
      </div>
    </div>
  );
}

export default TextBot;
