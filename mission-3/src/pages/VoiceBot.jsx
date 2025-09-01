import { useEffect, useState } from "react";
import "../App.css";
import MyTextInput from "../components/TextInput.jsx";

function VoiceBot() {
  const [jobType, setJobType] = useState("");
  const [jobOnUse, setJobOnUse] = useState(false);

  useEffect(() => {
    if (!jobOnUse) return;
    async function main() {
      // pass
    }
    main();
  }, [jobOnUse, jobType]);

  return (
    <div className="app-shell">
      <div className="card">
        <h1 className="title">Voice Bot</h1>
        <p className="muted">{jobType}</p>
        <MyTextInput setTextValue={setJobType} setOnUse={setJobOnUse} />
      </div>
    </div>
  );
}

export default VoiceBot;
