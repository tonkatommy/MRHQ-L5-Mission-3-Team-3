import { useState } from "react";

function MyTextInput({ setTextValue, setOnUse }) {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (e) => setInputValue(e.target.value);
  const handleClick = () => {
    if (!inputValue.trim()) return;
    setTextValue(inputValue.trim());
    setOnUse(true);
    setInputValue("");
  };

  return (
    <div className="input-row">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Enter response here..."
        className="text-input"
      />
      <input
        type="button"
        value="Submit"
        onClick={handleClick}
        className="btn-primary"
      />
    </div>
  );
}

export default MyTextInput;
