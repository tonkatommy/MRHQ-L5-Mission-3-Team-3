import {useState} from "react";

function MyTextInput({setTextValue, setOnUse}) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setTextValue(inputValue.trim());
    setOnUse(true);
    setInputValue("");
  };

  return (
    <form className="input-row" onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter response here..."
        className="text-input"
      />
      <button type="submit" className="btn-primary">
        Submit
      </button>
    </form>
  );
}

export default MyTextInput;
