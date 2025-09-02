import "../App.css";

function ChatLog({ chat = [] }) {
  return (
    <div className="chat-box">
      <div className="chat-log">
        {chat.map((message, index) => (
          <div key={index} className="chat-line">
            {message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatLog;
