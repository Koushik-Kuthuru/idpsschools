"use client";

import React, { useState } from "react";
import { 
  MessageSquare, 
  Megaphone, 
  Send, 
  User, 
  Calendar,
  CheckCheck,
  ChevronRight
} from "lucide-react";

export default function MessagesView() {
  const [selectedMessage, setSelectedMessage] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [activeInboxTab, setActiveInboxTab] = useState("direct");

  const [announcements] = useState([
    { id: 1, title: "Summer Vacation Schedule 2026", date: "May 28, 2026", sender: "Principal Office", content: "The school will remain closed for summer vacation from June 10, 2026 to July 15, 2026. Online classes will resume on July 16, 2026." },
    { id: 2, title: "Annual Science Exhibition Registration", date: "May 20, 2026", sender: "Science Dept", content: "Registration for the annual science exhibition is now open. Students interested in showing projects can register before June 5." },
    { id: 3, title: "Upcoming Sports Day Athletics trial", date: "May 15, 2026", sender: "Physical Edu Dept", content: "Athletics selection trials will be held tomorrow morning at the main ground starting at 09:00 AM." },
  ]);

  const [inboxThreads, setInboxThreads] = useState([
    {
      id: 0,
      sender: "Mr. Ramesh (Mathematics)",
      role: "Class Teacher",
      lastMsg: "Please submit your homework workbook by Friday.",
      time: "10:30 AM",
      unread: true,
      messages: [
        { sender: "Mr. Ramesh", text: "Hello, remember to submit your Calculus homework by Friday.", time: "10:28 AM", self: false },
        { sender: "Mr. Ramesh", text: "Please bring your completed formula books as well.", time: "10:30 AM", self: false }
      ]
    },
    {
      id: 1,
      sender: "Mrs. Sen (English)",
      role: "Subject Teacher",
      lastMsg: "Great project work on the review analysis!",
      time: "Yesterday",
      unread: false,
      messages: [
        { sender: "Mrs. Sen", text: "Hi, I have reviewed your book review report.", time: "Yesterday", self: false },
        { sender: "Student", text: "Thank you ma'am, did I need to make revisions?", time: "Yesterday", self: true },
        { sender: "Mrs. Sen", text: "No, great project work on the review analysis! Keep it up.", time: "Yesterday", self: false }
      ]
    }
  ]);

  const activeThread = inboxThreads[selectedMessage] || inboxThreads[0] || {};

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const updatedThreads = [...inboxThreads];
    updatedThreads[selectedMessage].messages.push({
      sender: "Student",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      self: true
    });
    updatedThreads[selectedMessage].lastMsg = newMessage;
    updatedThreads[selectedMessage].time = "Now";
    setInboxThreads(updatedThreads);
    setNewMessage("");
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Communication Hub</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Direct classroom chats and school notice boards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Notice Board */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB] flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
              <Megaphone size={14} strokeWidth={2.5} />
            </div>
            <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Notice Board & Announcements</h4>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-xs font-extrabold text-[#144835] group-hover:text-[#a2c144] transition-colors leading-normal">{ann.title}</h5>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-3 flex items-center gap-1.5">
                  <User size={12} /> {ann.sender} | <Calendar size={12} /> {ann.date}
                </p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Chat Inbox */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex grid grid-cols-1 md:grid-cols-12 h-[600px]">
          {/* Thread List sidebar (4/12 cols) */}
          <div className="md:col-span-5 border-r border-gray-100 flex flex-col h-full">
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Inbox Messages</span>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {inboxThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedMessage(thread.id)}
                  className={`w-full p-4 flex flex-col text-left transition-colors relative ${
                    selectedMessage === thread.id ? "bg-emerald-50/20" : "hover:bg-gray-50/50"
                  }`}
                >
                  {thread.unread && (
                    <span className="absolute top-4 right-4 h-2 w-2 bg-emerald-500 rounded-full" />
                  )}
                  <span className="text-xs font-extrabold text-gray-900 truncate pr-4">{thread.sender}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">{thread.role}</span>
                  <p className="text-xs text-gray-500 truncate mt-2 font-medium">{thread.lastMsg}</p>
                  <span className="text-xs text-gray-400 font-bold mt-1 text-right w-full block">{thread.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation view (7/12 cols) */}
          <div className="md:col-span-7 flex flex-col h-full">
            {/* Active Header */}
            <div className="px-6 py-3.5 border-b border-gray-100 bg-[#F8FAFB] flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wider">{activeThread.sender}</h4>
                <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{activeThread.role}</p>
              </div>
            </div>

            {/* Message History bubble list */}
            <div className="flex-grow p-6 overflow-y-auto bg-gray-50/30 space-y-4">
              {activeThread.messages?.map((msg: any, mIdx: number) => (
                <div 
                  key={mIdx} 
                  className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}
                >
                  <div className={`max-w-[85%] rounded-[16px] px-4 py-2.5 text-xs ${
                    msg.self 
                      ? "bg-[#144835] text-white rounded-tr-none" 
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm"
                  }`}>
                    <p className="font-medium leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-bold mt-1 px-1 flex items-center gap-1">
                    {msg.time} {msg.self && <CheckCheck size={11} className="text-emerald-600" />}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-100 flex items-center gap-3">
              <input
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all font-medium text-gray-900"
              />
              <button
                onClick={handleSendMessage}
                className="h-9 w-9 rounded-lg bg-[#144835] text-white hover:bg-[#144835]/90 flex items-center justify-center shrink-0 shadow-md shadow-[#144835]/20 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
