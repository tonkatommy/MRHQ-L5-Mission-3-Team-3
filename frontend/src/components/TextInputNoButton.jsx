import { useState } from "react";

function MyTextInputNoButton({ setTextValue, setOnUse }) {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (e) => setInputValue(e.target.value);
  const commit = () => {
    if (!inputValue.trim()) return;
    setTextValue(inputValue.trim());
    setOnUse(true);
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      placeholder="Type job title here... press Enter to start the interview"
      className="text-input title-input"
    />
  );
}

export default MyTextInputNoButton;
