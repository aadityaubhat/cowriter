"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Editor } from "@/components/editor";
import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Wand2, Minimize2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

type Tab = 'write' | 'configure';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('write');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm Co Writer. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      { text: inputMessage, isUser: true, timestamp: new Date() },
    ]);
    setInputMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-background">
        <div className="px-4 flex h-14 items-center">
          <span className="font-bold text-lg mr-8">CoWriter</span>

          <Button
            variant="ghost"
            className={`${activeTab === 'write' ? 'bg-muted' : ''}`}
            onClick={() => setActiveTab('write')}
          >
            Write
          </Button>
          <Button
            variant="ghost"
            className={`${activeTab === 'configure' ? 'bg-muted' : ''}`}
            onClick={() => setActiveTab('configure')}
          >
            Configure
          </Button>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {activeTab === 'write' && (
        <main className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
          <div className="flex-1 p-4 flex">
            <div className="flex gap-6 flex-1">
              {/* Left side - Rich Text Editor */}
              <Card className="flex-1 flex flex-col overflow-hidden">
                <Editor />
              </Card>

              {/* Right side - Action buttons and Chat */}
              <div className="w-80 flex flex-col gap-4">
                {/* Collapsible Buttons */}
                <Card className="shadow-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    <span className="font-semibold">Actions</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <div
                    className={`transition-all duration-200 ease-in-out ${isCollapsed ? "h-0" : "h-auto"
                      }`}
                  >
                    <div className="p-2 space-y-2">
                      <Button
                        variant="default"
                        className="w-full h-10 text-base font-medium bg-blue-500 hover:bg-blue-600"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Expand
                      </Button>
                      <Button
                        variant="default"
                        className="w-full h-10 text-base font-medium bg-blue-500 hover:bg-blue-600"
                      >
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Shorten
                      </Button>
                      <Button
                        variant="default"
                        className="w-full h-10 text-base font-medium bg-blue-500 hover:bg-blue-600"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Critique
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Chat */}
                <Card className="shadow-lg flex-1">
                  <div className="p-4 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Chat</h3>
                    <div className={`flex flex-col flex-1 ${isCollapsed ? 'h-[calc(100vh-16rem)]' : 'h-[400px]'} transition-all duration-200`}>
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.isUser ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${message.isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      )}
      {activeTab === 'configure' && (
        <main className="flex-1 p-4">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
            <p className="text-muted-foreground">Configuration options coming soon...</p>
          </Card>
        </main>
      )}
    </div>
  );
}
