import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TextBot from "./pages/TextBot.jsx";
import VoiceBot from "./pages/VoiceBot.jsx";

function App() {
  return (
    <BrowserRouter>
      <nav className="top-nav">
        <Link to="/">TextBot</Link>
        <Link to="/voicebot">VoiceBot</Link>
      </nav>
      <Routes>
        <Route path="/" element={<TextBot />} />
        <Route path="/voicebot" element={<VoiceBot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
