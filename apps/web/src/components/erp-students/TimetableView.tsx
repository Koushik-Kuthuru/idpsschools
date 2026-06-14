"use client";

import React, { useState } from "react";
import { 
  Clock, 
  MapPin, 
  Video, 
  Info, 
  CheckCircle, 
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function TimetableView() {
  const [activeDay, setActiveDay] = useState("MON");

  const days = ["MON", "TUE", "WED", "THU", "FRI"];
  const periods = [
    { num: 1, time: "08:30 AM - 09:20 AM", MON: { subject: "Mathematics", room: "Room 302", teacher: "Mr. Ramesh" }, TUE: { subject: "English Literature", room: "Room 104", teacher: "Mrs. Sen" }, WED: { subject: "Science (Physics)", room: "Lab 2", teacher: "Dr. Rao" }, THU: { subject: "Mathematics", room: "Room 302", teacher: "Mr. Ramesh" }, FRI: { subject: "Fine Arts", room: "Studio A", teacher: "Miss Roy" } },
    { num: 2, time: "09:25 AM - 10:15 AM", MON: { subject: "Science (Physics)", room: "Lab 2", teacher: "Dr. Rao" }, TUE: { subject: "Mathematics", room: "Room 302", teacher: "Mr. Ramesh" }, WED: { subject: "History & Civics", room: "Room 205", teacher: "Mr. Joshi" }, THU: { subject: "English Literature", room: "Room 104", teacher: "Mrs. Sen" }, FRI: { subject: "Physical Education", room: "Ground", teacher: "Coach Kumar" } },
    { num: 3, time: "10:20 AM - 11:10 AM", MON: { subject: "History & Civics", room: "Room 205", teacher: "Mr. Joshi" }, TUE: { subject: "Science (Physics)", room: "Lab 2", teacher: "Dr. Rao" }, WED: { subject: "Fine Arts", room: "Studio A", teacher: "Miss Roy" }, THU: { subject: "Computer Science", room: "Lab 1", teacher: "Mrs. Murthy" }, FRI: { subject: "Mathematics", room: "Room 302", teacher: "Mr. Ramesh" } },
    { num: 4, time: "11:15 AM - 12:05 PM", MON: { subject: "Computer Science", room: "Lab 1", teacher: "Mrs. Murthy" }, TUE: { subject: "History & Civics", room: "Room 205", teacher: "Mr. Joshi" }, WED: { subject: "English Literature", room: "Room 104", teacher: "Mrs. Sen" }, THU: { subject: "Physical Education", room: "Ground", teacher: "Coach Kumar" }, FRI: { subject: "Science (Physics)", room: "Lab 2", teacher: "Dr. Rao" } },
    { num: 5, time: "12:05 PM - 12:55 PM", MON: { subject: "Lunch Break", room: "Cafeteria", teacher: "-" }, TUE: { subject: "Lunch Break", room: "Cafeteria", teacher: "-" }, WED: { subject: "Lunch Break", room: "Cafeteria", teacher: "-" }, THU: { subject: "Lunch Break", room: "Cafeteria", teacher: "-" }, FRI: { subject: "Lunch Break", room: "Cafeteria", teacher: "-" } },
    { num: 6, time: "01:00 PM - 01:50 PM", MON: { subject: "English Literature", room: "Room 104", teacher: "Mrs. Sen" }, TUE: { subject: "Fine Arts", room: "Studio A", teacher: "Miss Roy" }, WED: { subject: "Computer Science", room: "Lab 1", teacher: "Mrs. Murthy" }, THU: { subject: "Science (Physics)", room: "Lab 2", teacher: "Dr. Rao" }, FRI: { subject: "History & Civics", room: "Room 205", teacher: "Mr. Joshi" } },
    { num: 7, time: "01:55 PM - 02:45 PM", MON: { subject: "Physical Education", room: "Ground", teacher: "Coach Kumar" }, TUE: { subject: "Computer Science", room: "Lab 1", teacher: "Mrs. Murthy" }, WED: { subject: "Mathematics", room: "Room 302", teacher: "Mr. Ramesh" }, THU: { subject: "History & Civics", room: "Room 205", teacher: "Mr. Joshi" }, FRI: { subject: "Library Session", room: "Reading Room", teacher: "Mrs. Hema" } },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Class Timetable</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Daily schedule, class timings, and session details</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeDay === day 
                  ? "bg-[#144835] text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Happening Now Banner */}
      <div className="bg-gradient-to-r from-[#144835] to-[#0f3628] text-white p-6 rounded-[16px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="bg-[#a2c144]/20 text-[#a2c144] border border-[#a2c144]/10 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Happening Now
          </span>
          <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wide mt-2">Mathematics Session</h3>
          <div className="flex items-center gap-4 mt-2 text-xs font-bold text-emerald-100">
            <span className="flex items-center gap-1"><Clock size={14} /> 08:30 AM - 09:20 AM</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> Block A, Room 302</span>
          </div>
        </div>
        <button 
          onClick={() => alert("Redirecting to online classroom portal...")}
          className="relative z-10 flex items-center gap-2 px-4 py-2 bg-[#a2c144] hover:bg-[#b5d355] text-[#144835] transition-colors rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm"
        >
          <Video size={14} />
          Join Class Online
        </button>
      </div>

      {/* Timetable Period Grid */}
      <div className="bg-white border border-gray-100 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB]">
          <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wider">
            Timeline of periods ({activeDay})
          </h4>
        </div>

        <div className="divide-y divide-gray-100">
          {periods.map((period) => {
            const slot = (period as any)[activeDay] || {};
            const isLunch = slot.subject === "Lunch Break";
            return (
              <div 
                key={period.num} 
                className={`grid grid-cols-[100px_1fr] md:grid-cols-[150px_1fr] items-center p-4 min-h-[80px] hover:bg-gray-50/30 transition-colors ${
                  isLunch ? "bg-amber-50/10 italic" : ""
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#144835] uppercase tracking-wide">Period {period.num}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase mt-0.5">{period.time}</span>
                </div>
                
                <div className="pl-4 md:pl-8 border-l border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wide ${isLunch ? "text-amber-800" : "text-[#144835]"}`}>
                      {slot.subject}
                    </p>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-0.5 flex items-center gap-1">
                      {!isLunch && <MapPin size={11} />} {slot.room}
                    </p>
                  </div>

                  {!isLunch && (
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Instructor</span>
                      <p className="text-xs font-bold text-gray-800">{slot.teacher}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Professor Notes & Upcoming Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <h3 className="text-xs font-bold text-[#144835] uppercase tracking-wider mb-4 border-l-4 border-[#144835] pl-2">Professor Announcements</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Info className="text-[#a2c144] shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-extrabold text-[#144835]">Mathematics - Mr. Ramesh</p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  "Midterm assignment projects must be uploaded via the dashboard by Friday at 5:00 PM. No late submittals will be accepted."
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-extrabold text-[#144835]">Physics Lab - Dr. Rao</p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  "Reading guides and lab logs for Calculus and Optics have been published to resources."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <h3 className="text-xs font-bold text-[#144835] uppercase tracking-wider mb-4 border-l-4 border-[#144835] pl-2">Upcoming Homework Deadlines</h3>
          <div className="divide-y divide-gray-100">
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-extrabold text-gray-700">Lab Journal Submission</span>
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs uppercase">Due Tomorrow</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-extrabold text-gray-700">Computer Science Project Draft</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs uppercase">Due in 3 Days</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-extrabold text-gray-700">English Book Review</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs uppercase">Due Oct 24</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
