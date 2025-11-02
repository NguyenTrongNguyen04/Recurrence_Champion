import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatBubbleIcon, XIcon, SendIcon } from '../icons/Icons';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Chào bạn! 👋 Tôi là AI Assistant của Test Studio AI. Bạn cần hỗ trợ gì không?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Đóng chat box khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Gửi tin nhắn đến Gemini API
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Đọc API key từ env - ưu tiên VITE_GEMINI_API_KEY vì Vite tự động expose biến có prefix VITE_
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || 
                      import.meta.env.GEMINI_API_KEY ||
                      (process.env as any).GEMINI_API_KEY) as string;
      
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY không được tìm thấy. Vui lòng kiểm tra file .env và đảm bảo có VITE_GEMINI_API_KEY=your_key. Nhớ restart dev server sau khi thêm biến env!');
      }

      // Gọi Gemini API - sử dụng model mới nhất gemini-2.5-pro
      const model = 'gemini-2.5-pro';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Bạn là AI Assistant của Test Studio AI - một công cụ giúp phân tích code và tạo test cases. Hãy trả lời một cách thân thiện và hữu ích bằng tiếng Việt.\n\nNgười dùng hỏi: ${userMessage.text}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Lỗi khi gọi Gemini API');
      }

      const data = await response.json();
      const assistantText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Xin lỗi, tôi không thể tạo phản hồi lúc này.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantText,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? `Xin lỗi, có lỗi xảy ra: ${error.message}` : 'Xin lỗi, có lỗi xảy ra khi gửi tin nhắn.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Chat Box */}
      {isOpen && (
        <div
          ref={chatBoxRef}
          className="absolute bottom-20 left-0 w-80 h-96 bg-surface border border-surface2 rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div className="bg-gradient-g1 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <h3 className="text-white font-semibold">Test Studio AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-64 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-gradient-g1 text-white'
                      : 'bg-surface2 text-primary'
                  }`}
                >
                  {message.sender === 'assistant' ? (
                    <div className="text-sm prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          // Style cho headings
                          h1: (props) => <h1 className="text-lg font-bold mt-2 mb-1 text-primary" {...props} />,
                          h2: (props) => <h2 className="text-base font-bold mt-2 mb-1 text-primary" {...props} />,
                          h3: (props) => <h3 className="text-sm font-semibold mt-2 mb-1 text-primary" {...props} />,
                          h4: (props) => <h4 className="text-sm font-semibold mt-1 mb-1 text-primary" {...props} />,
                          // Style cho paragraphs
                          p: (props) => <p className="mb-2 text-primary leading-relaxed" {...props} />,
                          // Style cho bold text
                          strong: (props) => <strong className="font-bold text-primary" {...props} />,
                          // Style cho lists
                          ul: (props) => <ul className="list-disc list-inside mb-2 space-y-1 text-primary" {...props} />,
                          ol: (props) => <ol className="list-decimal list-inside mb-2 space-y-1 text-primary" {...props} />,
                          li: (props) => <li className="ml-2 text-primary" {...props} />,
                          // Style cho code blocks
                          code: ({inline, ...props}: any) => 
                            inline ? (
                              <code className="bg-surface px-1 py-0.5 rounded text-xs font-mono text-primary" {...props} />
                            ) : (
                              <code className="block bg-surface p-2 rounded text-xs font-mono text-primary whitespace-pre-wrap" {...props} />
                            ),
                          // Style cho links
                          a: (props) => <a className="text-accent-violet underline" {...props} />,
                          // Style cho horizontal rule
                          hr: (props) => <hr className="my-2 border-surface2" {...props} />,
                          // Style cho blockquote
                          blockquote: (props) => <blockquote className="border-l-4 border-accent-cyan pl-3 italic text-primary-muted" {...props} />,
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface2 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface border-t border-surface2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 bg-surface2 border border-surface2 rounded-lg px-4 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-g1 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-gradient-g1 rounded-full shadow-lg shadow-accent-violet/30 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300"
        style={{
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        {/* Pulse ring animation */}
        <div 
          className="absolute inset-0 bg-gradient-g1 rounded-full opacity-30"
          style={{
            animation: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        ></div>
        
        {/* Icon */}
        <div className="relative z-10 transform transition-transform duration-300 hover:rotate-12">
          {!isOpen ? (
            <ChatBubbleIcon className="w-6 h-6" />
          ) : (
            <XIcon className="w-6 h-6" />
          )}
        </div>

        {/* Notification dot */}
        <div 
          className="absolute top-0 right-0 w-4 h-4 bg-status-danger rounded-full border-2 border-surface"
          style={{
            animation: 'bounce 1s infinite',
          }}
        ></div>
      </button>
    </div>
  );
};

export default ChatWidget;

