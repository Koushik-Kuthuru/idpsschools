"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Mail, Users } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function ComposeMessagePage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState<string | null>(null);

 const [form, setForm] = useState({
 id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
 sender: "Admin",
 recipient: "",
 phoneNumber: "",
 subject: "",
 preview: "",
 channel: "Portal Only",
 dateLabel: "Just now",
 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 unread: false,
 hasAttachment: false,
 avatarColor: "bg-blue-100 text-blue-700",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: value }));
 };

 const sendTwilioMessage = async (isWhatsapp: boolean) => {
   const rawCreds = localStorage.getItem(`twilioCreds_${schoolId}`);
   if (!rawCreds) {
     throw new Error("No Twilio credentials found in settings.");
   }
   const creds = JSON.parse(rawCreds);
   const { accountSid, authToken, fromSms, fromWhatsapp } = creds;
   
   if (!accountSid || !authToken) {
     throw new Error("Twilio Account SID and Auth Token are required in Settings -> Integrations.");
   }

   const from = isWhatsapp ? fromWhatsapp : fromSms;
   const to = isWhatsapp ? `whatsapp:${form.phoneNumber}` : form.phoneNumber;
   
   if (!from) {
     throw new Error(`Twilio From ${isWhatsapp ? "WhatsApp" : "SMS"} number is missing in Settings.`);
   }
   if (!form.phoneNumber) {
     throw new Error("Recipient Phone Number is required.");
   }

   const auth = btoa(`${accountSid}:${authToken}`);
   const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
     method: "POST",
     headers: {
       "Content-Type": "application/x-www-form-urlencoded",
       Authorization: `Basic ${auth}`,
     },
     body: new URLSearchParams({
       From: from,
       To: to,
       Body: `${form.subject}\n\n${form.preview}`,
     }),
   });

   const data = await response.json();
   if (!response.ok) {
     throw new Error(data.message || "Failed to send message via Twilio.");
   }
   return data;
 };

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);
   setError(null);
   setSuccess(null);

   try {
     if (form.channel === "SMS (via Twilio)") {
       await sendTwilioMessage(false);
     } else if (form.channel === "WhatsApp (via Twilio)") {
       await sendTwilioMessage(true);
     } else if (form.channel === "WhatsApp (via Web Link)") {
       if (!form.phoneNumber) {
         throw new Error("Recipient Phone Number is required.");
       }
       const text = encodeURIComponent(`${form.subject}\n\n${form.preview}`);
       window.open(`https://web.whatsapp.com/send?phone=${form.phoneNumber.replace("+", "")}&text=${text}`, "_blank");
     }

     const payload = {
       ...form,
       createdAt: serverTimestamp(),
     };
     await setDoc(doc(db, "schools", schoolId, "messages", form.id), payload);
     setSuccess("Message sent and logged successfully!");
     setTimeout(() => {
       router.push(`/schools/${schoolId}/admin/communication/messages`);
     }, 1500);
   } catch (err: any) {
     setError(err.message || "An unexpected error occurred");
     setLoading(false);
   }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link 
 href={`/schools/${schoolId}/admin/communication/messages`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Compose Message</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Send a message to parents or staff</p>
 </div>
 </div>

 {error && (
    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      {error}
    </div>
  )}

  {success && (
    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {success}
    </div>
  )}

  <form onSubmit={handleSubmit} className="space-y-6">
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <Mail size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Message Details</h2>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Draft your message content and delivery channels</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Delivery Channel <span className="text-rose-500">*</span></label>
          <select
            name="channel"
            required
            value={form.channel}
            onChange={handleChange}
            className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm cursor-pointer"
          >
            <option>Portal Only</option>
            <option>SMS (via Twilio)</option>
            <option>WhatsApp (via Twilio)</option>
            <option>WhatsApp (via Web Link)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Recipient Phone Number {form.channel !== "Portal Only" && <span className="text-rose-500">*</span>}</label>
          <input
            name="phoneNumber"
            required={form.channel !== "Portal Only"}
            disabled={form.channel === "Portal Only"}
            placeholder="e.g. +919876543210"
            value={form.phoneNumber}
            onChange={handleChange}
            className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-700">Recipient Name / Description <span className="text-rose-500">*</span></label>
          <input
            name="recipient"
            required
            placeholder="e.g. All Parents, Grade 5 Staff, John Doe..."
            value={form.recipient}
            onChange={handleChange}
            className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-700">Subject <span className="text-rose-500">*</span></label>
          <input
            name="subject"
            required
            placeholder="Message Subject"
            value={form.subject}
            onChange={handleChange}
            className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-gray-700">Message Content <span className="text-rose-500">*</span></label>
          <textarea
            name="preview"
            required
            rows={6}
            placeholder="Type your message here..."
            value={form.preview}
            onChange={handleChange}
            className="w-full bg-white border border-gray-200 rounded-lg p-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm resize-y"
          />
        </div>
      </div>
    </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/communication/messages`}
 className="h-9 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center transition-colors shadow-sm"
 >
 Cancel
 </Link>
 <button
 type="submit"
 disabled={loading}
 className="h-9 px-6 bg-[#144835] text-white font-bold rounded-lg hover:bg-[#144835]/90 flex items-center gap-2 transition-colors shadow-sm shadow-[#144835]/20 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <Save size={18} />
 Send Message
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
