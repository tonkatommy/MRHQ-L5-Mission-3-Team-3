import React, {useEffect, useMemo, useState} from "react";
import "../App.css";

import {GoogleGenAI} from "@google/genai";

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

  const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});
  //FOR TOMORROW 03/09 SHANE - WORK ON PROMPT - MAYBE CREATE A 3RD API CALL THAT WILL GET AI TO SUMMARIZE CONVERSATION HISTORY
  // First Prompt
  useEffect(() => {
    if (!jobOnUse) return;
    async function main() {
      const prompt = `You are a professional job interviewer for the position of ${jobType}. Conduct a structured interview with exactly 6 questions, Always begin with: ‘Tell me about your previous experience with ${jobType}.’ Adjust wording if needed so it reads naturally for the given job type. 
            Avoid introductions or greetings, begin with only the first question.
            Ask each subsequent question based only on the candidate’s previous answer, keeping questions concise (one sentence max), professional, and focused
            If the candidate gives an off-topic answer, politely redirect them back to the interview without counting it as one of the 6 questions. If they refuse or skip a question, rephrase it or gently prompt them to respond.
            After all 6 valid questions, provide constructive feedback summarizing the candidate’s strengths and suggesting specific improvements. Track project internally to ensure exactly 6 questions are asked.
      `;
      setOriginalPrompt("User: " + prompt);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text;
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        "Model: " + text,
      ]);
      console.log(prompt);
    }
    main();
  }, [jobOnUse, jobType]);

  // Following Chat
  useEffect(() => {
    if (!onUse) return;
    async function main() {
      const prompt = `Here is the chat history so far: ${originalPrompt} ${chatHistory.toString()}
        The candidate just answered: ${textValue} give your next reply`;
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        "User: " + textValue,
      ]);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text;
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        "Model: " + text,
      ]);
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
