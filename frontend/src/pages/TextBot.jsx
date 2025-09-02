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
  //FOR TOMORROW 03/09 SHANE - WORK ON PROMPT - MAYBE CREATE A 3RD API CALL THAT WILL GET AI TO SUMMARIZE CONVERSATION HISTORY
  // First Prompt
  useEffect(() => {
    if (!jobOnUse) return;
    async function main() {
      const prompt = `You are a job interviewer. You are interviewing a candidate for the position of ${jobType}.
        Ask them one question at a time and wait for their response before asking the next question.
        The flow will start with the you saying “Tell me about yourself”. You should ask exactly 6 questions
        based on response of the user.  Other than the first question. At the end of the whole interview,
        You should comment on how well the user answered the questions, and suggest how the user can improve
        its response.`;
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
