import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import TextBot from './pages/TextBot';
import VoiceBot from './pages/VoiceBot';

function App() {
  return (
    <BrowserRouter>
      <nav>
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
