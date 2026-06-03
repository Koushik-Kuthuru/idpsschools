'use client';

import React, { useState, useEffect } from 'react';
import { useRouteParam } from '@/hooks/useRouteParams';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function MobileCapturePage({
 params,
}: {
 params: Promise<{ sessionId: string }>;
}) {
 const sessionId = useRouteParam(params, 'sessionId');
 const [sessionData, setSessionData] = useState<any>(null);
 const [status, setStatus] = useState<'loading' | 'waiting' | 'uploading' | 'success' | 'error'>('loading');
 const [errorMsg, setErrorMsg] = useState('');

 useEffect(() => {
 async function fetchSession() {
 if (!sessionId) return;
 try {
 const docRef = doc(db, 'photo_sessions', sessionId as string);
 const snap = await getDoc(docRef);
 if (snap.exists()) {
 const data = snap.data();
 if (data.status === 'completed') {
 setStatus('success');
 } else {
 setSessionData(data);
 setStatus('waiting');
 }
 } else {
 setStatus('error');
 setErrorMsg('Invalid or expired capture session.');
 }
 } catch (err: any) {
 setStatus('error');
 setErrorMsg(err.message || 'Failed to load session.');
 }
 }
 fetchSession();
 }, [sessionId]);

 const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file || !sessionData) return;

 if (file.size > 10 * 1024 * 1024) {
 alert("File size exceeds 10MB limit.");
 return;
 }

 setStatus('uploading');

 try {
 const { schoolId, studentId, photoType } = sessionData;
 const fileRef = ref(storage, `schools/${schoolId}/students/${studentId}/photos/${photoType}_${Date.now()}`);
 
 const uploadTask = uploadBytes(fileRef, file);
 const timeoutPromise = new Promise((_, reject) => 
 setTimeout(() => reject(new Error("Upload timed out. Please check your mobile internet connection.")), 45000)
 );

 const snapshot = await Promise.race([uploadTask, timeoutPromise]) as any;
 const url = await getDownloadURL(snapshot.ref);

 const sessionRef = doc(db, 'photo_sessions', sessionId as string);
 await updateDoc(sessionRef, {
 status: 'completed',
 photoUrl: url,
 completedAt: new Date()
 });

 setStatus('success');
 } catch (err: any) {
 console.error("Upload failed:", err);
 setStatus('error');
 setErrorMsg(err.message || 'Failed to upload photo. Please try again.');
 }
 };

 if (status === 'loading') {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
 <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
 <p className="text-gray-500 font-medium animate-pulse">Loading capture session...</p>
 </div>
 );
 }

 if (status === 'error') {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
 <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center max-w-sm w-full text-center">
 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
 <AlertCircle className="text-red-500" size={32} />
 </div>
 <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
 <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
 <button onClick={() => window.location.reload()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider text-sm">
 Try Again
 </button>
 </div>
 </div>
 );
 }

 if (status === 'success') {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
 <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center max-w-sm w-full text-center">
 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
 <CheckCircle className="text-emerald-500" size={40} />
 </div>
 <h2 className="text-2xl font-black text-gray-900 mb-2">Success!</h2>
 <p className="text-gray-500 text-sm">
 The photo has been captured and uploaded successfully. You can now close this tab and return to your desktop.
 </p>
 </div>
 </div>
 );
 }

 // status === 'waiting' or 'uploading'
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
 <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center max-w-sm w-full text-center relative overflow-hidden">
 {/* Decorative background element */}
 <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10"></div>
 
 <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 relative z-10">
 <Camera className="text-white" size={40} />
 </div>
 
 <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Capture Photo</h1>
 <p className="text-gray-500 text-sm mb-8 font-medium">
 Take a photo for <span className="text-emerald-600 font-bold">{sessionData?.photoType?.toUpperCase()}</span>
 </p>

 {status === 'uploading' ? (
 <div className="w-full py-4 flex flex-col items-center gap-3">
 <Loader2 className="animate-spin text-emerald-500" size={28} />
 <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Uploading...</span>
 </div>
 ) : (
 <div className="w-full relative group">
 <button className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2 group-hover:-translate-y-1">
 <Camera size={18} /> Open Camera
 </button>
 <input 
 type="file" 
 accept="image/*" 
 capture="environment" 
 onChange={handleCapture}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 </div>
 )}
 </div>
 </div>
 );
}
