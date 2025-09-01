import React, { useState, useEffect } from 'react';
import '../App.css'

import { GoogleGenAI } from "@google/genai";

import MyTextInput from '../components/TextInput.jsx'
import ChatLog from '../components/ChatLog.jsx'
import MyTextInputNoButton from '../components/TextInputNoButton.jsx';

function TextBot() {
  const [textValue, setTextValue] = useState('');
  const [onUse, setOnUse] = useState(false);

  const [jobType, setJobType] = useState('');
  const [jobOnUse, setJobOnUse] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [originalPrompt, setOriginalPrompt] = useState("");

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });  

  // First Prompt
  useEffect(() => {
    if (!jobOnUse) return;
    async function main() {
      // Replace this with your code
      /*
      const prompt = `You are a job interviewer. You are interviewing a candidate for the position of ${jobType}.
        Ask them one question at a time and wait for their response before asking the next question.
        The flow will start with the you saying “Tell me about yourself”. You should ask exactly 6 questions
        based on response of the user.  Other than the first question. At the end of the whole interview,
        You should comment on how well the user answered the questions, and suggest how the user can improve
        its response.`
      */
      setOriginalPrompt("User: " + prompt);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text;
      //you can replace chat history with how you want to implement it too
      setChatHistory(prevChatHistory => [...prevChatHistory,"Model: " + text]);
    }
    main();
  }, [jobOnUse, jobType]);

  // Following Chat
  useEffect(() => {
    if (!onUse) return;
    async function main() {
      // Here too
      /*
      const prompt = `Here is the chat history so far: ${originalPrompt} ${chatHistory.toString()}
        The candidate just answered: ${textValue} give your next reply`;
      */
      // And here if you want
      setChatHistory(prevChatHistory => [...prevChatHistory, "User: " + textValue]);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text;
      // aaaand here
      setChatHistory(prevChatHistory => [...prevChatHistory, "Model: " + text]);
    }
    main();
  }, [onUse, textValue]);


  return (
    <>
      <div className='section'>
        <h1>AI Mock Interviewer Text</h1>
        <div className='sectionChild'>
          <div className='sectionLeft'>
            <h2>Job Title:</h2>
          </div>
          <MyTextInputNoButton setTextValue={setJobType} setOnUse={setJobOnUse}/>
        </div>
        <div className='sectionChild'>
          <ChatLog chat={chatHistory} />
        </div>
        <div className='sectionChild'>
          <MyTextInput setTextValue={setTextValue} setOnUse={setOnUse} />
        </div>
      </div>
    </>
  )
}

export default TextBot;
