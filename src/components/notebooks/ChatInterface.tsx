// src/components/notebooks/ChatInterface.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getUserInfo } from "@/hooks/getUserInfo";

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}
interface ChatInterfaceProps {
  notebookId?: string;
  userId?: string;
}
export const ChatInterface = ({ notebookId, userId}:ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { text: inputText, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const question = inputText;
    setInputText("");
    const loadingMsg: Message = {text:"Thinking....",sender:"bot", timestamp:new Date()};
    setMessages((prev) => [...prev, loadingMsg]);
    try {
      const botText = await generateBotResponse(question);
      
      setMessages((prev) => prev.filter(msg => msg.text !== "Thinking...."));
      // const formattedBotText = botText.replace(/\n{2,}/g, "\n").trim(); // Clean up excessive newlines
      // const formattedBotText = botText.replace(/\n{2,}/g, "\n").replace(/\*\*/g, "").trim();
      const formattedBotText = botText.replace(/\n{2,}/g, "\n").replace(/[*_~`#]/g, "").trim();


const botMsg: Message = { text: formattedBotText, sender: "bot", timestamp: new Date() };
setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        text: "Error retrieving answer",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  async function generateBotResponse(question: string): Promise<string> {
    const { userId } = await getUserInfo();
    
    const response = await fetch("http://localhost:5001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: question,
        user_id: userId,
        notebook_id: notebookId, // If needed
      }),
    });
  
    if (!response.ok) throw new Error("Chat query failed");
    const data = await response.json();
    return data.response; // Ensure backend returns "response" not "answer"
  }
  
  

  return (
    <div className="border  border-black/20 rounded-lg p-6 h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg  whitespace-pre-line break-words  ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              <p>{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ask about your documents..."
          className="flex-1 p-3 border rounded-lg"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
      </div>
    </div>
  );
};




