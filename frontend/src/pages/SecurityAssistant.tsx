import { useState, useRef, useEffect } from "react";
import api from "../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function SecurityAssistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/security-assistant/chat", {
        question: message,
        session_id: sessionId,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.answer,
        timestamp: new Date(),
      };

      setSessionId(response.data.session_id);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "How do I fix SQL Injection?",
    "What are the risks of hardcoded passwords?",
    "How can I improve my code security?",
    "Explain command injection vulnerabilities",
  ];

  return (
    <div className="security-assistant-container">
      <h1>AI Security Assistant</h1>
      <p className="subtitle">
        Ask questions about vulnerabilities, security best practices, and code remediation
      </p>

      <div className="chat-container">
        <div className="messages-area">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h3>🤖 Welcome to AI Security Assistant</h3>
              <p>I can help you with:</p>
              <ul>
                <li>Vulnerability explanations</li>
                <li>Remediation recommendations</li>
                <li>Security best practices</li>
                <li>Secure coding guidance</li>
              </ul>
              <p>Try asking one of these questions:</p>
              <div className="suggested-questions">
                {suggestedQuestions.map((q, index) => (
                  <button
                    key={index}
                    className="suggested-btn"
                    onClick={() => setMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
            >
              <div className="message-content">
                <strong>{msg.role === "user" ? "You" : "AI Assistant"}</strong>
                <p>{msg.content}</p>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant-message">
              <div className="message-content">
                <strong>AI Assistant</strong>
                <p className="typing-indicator">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a security question..."
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="send-btn"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <style>{`
        .security-assistant-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .security-assistant-container h1 {
          color: #1e293b;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          margin-bottom: 30px;
        }

        .chat-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .welcome-message {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .welcome-message h3 {
          color: #3b82f6;
          margin-bottom: 10px;
        }

        .welcome-message ul {
          list-style: none;
          padding: 0;
          margin: 15px 0;
        }

        .welcome-message li {
          color: #64748b;
          margin: 5px 0;
        }

        .suggested-questions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .suggested-btn {
          padding: 8px 16px;
          background: #e0f2fe;
          color: #0369a1;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }

        .suggested-btn:hover {
          background: #bae6fd;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }

        .user-message {
          align-self: flex-end;
        }

        .assistant-message {
          align-self: flex-start;
        }

        .message-content {
          background: #f1f5f9;
          padding: 12px 16px;
          border-radius: 12px;
        }

        .user-message .message-content {
          background: #3b82f6;
          color: white;
        }

        .message-content strong {
          display: block;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .message-time {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.7;
        }

        .typing-indicator {
          color: #64748b;
          font-style: italic;
        }

        .input-area {
          padding: 20px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .input-area textarea {
          flex: 1;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          resize: none;
          font-family: inherit;
          font-size: 14px;
        }

        .input-area textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .send-btn {
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
