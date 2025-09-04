import {useState} from "react";

import {GoogleGenAI} from "@google/genai";

export default function Chatbot() {
  const [jobTitle, setJobTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});

  const handleInitialRequest = async () => {
    if (!jobTitle) return;

    setMessages([
      {
        role: "system",
        content: `You are a professional job interviewer. Interviewing a user for the role of ${jobTitle}. You will need to:
            1. Act like a real interviewer in a formal job interview setting.
            2. Start the interview by asking an opening question about the users experience or background.
            3. Ask clear, realistic ${jobTitle} interview questions one at a time. 
            When the user answers; Ask a natural follow-up question related to their answer OR move on to the next question
            4. Keep the tone professional, realistic and friendly.`,
      },
    ]);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
    });

    const data = await response.json();

    updateMessages("interviewer", data.reply);
  };

  const handleModelRequest = async () => {
    if (!userInput) return;

    updateMessages("user", userInput);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
    });

    const data = await response.json();

    updateMessages("interviewer", data.reply);
    setUserInput("");
  };

  const updateMessages = (name, message) => {
    setMessages(...messages, {
      role: name,
      content: message,
    });
  };
  return <div></div>;
}
