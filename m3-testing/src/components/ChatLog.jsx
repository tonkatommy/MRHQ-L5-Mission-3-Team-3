import '../App.css'

function ChatLog(props) {

  return (
    <div className="chat-log">
      {props.chat.map((message, index) => (
        <div key={index} className="chat-message">
          {message}
        </div>
      ))}
    </div>
  );
}

export default ChatLog;