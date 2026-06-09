import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Smartphone, Monitor, RefreshCw, Check } from 'lucide-react';
import Webcam from 'react-webcam';
import QRCode from 'react-qr-code';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CapturePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (fileOrUrl: File | string, type: 'student' | 'father' | 'mother' | 'guardian') => void;
  schoolId: string;
  studentId: string;
  photoType: 'student' | 'father' | 'mother' | 'guardian';
}

export default function CapturePhotoModal({ isOpen, onClose, onCapture, schoolId, studentId, photoType }: CapturePhotoModalProps) {
  const [mode, setMode] = useState<'selection' | 'desktop' | 'mobile'>('selection');
  
  // Desktop mode states
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Mobile mode states
  const [sessionId, setSessionId] = useState<string>('');
  const [mobileStatus, setMobileStatus] = useState<'waiting' | 'completed'>('waiting');

  useEffect(() => {
    if (!isOpen) {
      setMode('selection');
      setCapturedImage(null);
      setSessionId('');
    }
  }, [isOpen]);

  // Handle Desktop Devices
  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  useEffect(() => {
    if (mode === 'desktop') {
      navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }
  }, [mode, handleDevices]);

  // Handle Mobile Session
  useEffect(() => {
    if (mode === 'mobile') {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      setSessionId(newSessionId);
      
      const sessionRef = doc(db, 'photo_sessions', newSessionId);
      
      setDoc(sessionRef, {
        status: 'waiting',
        schoolId,
        studentId,
        photoType,
        createdAt: serverTimestamp()
      }).catch(console.error);

      const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'completed' && data.photoUrl) {
            setMobileStatus('completed');
            // Give it a second to show the success state before closing
            setTimeout(() => {
              onCapture(data.photoUrl, photoType);
              onClose();
            }, 1500);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [mode, schoolId, studentId, photoType, onCapture, onClose]);

  if (!isOpen) return null;

  const handleDesktopCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  const handleDesktopConfirm = () => {
    if (capturedImage) {
      // Convert base64 to File
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${photoType}_capture.jpg`, { type: 'image/jpeg' });
          onCapture(file, photoType);
          onClose();
        });
    }
  };

  const getCaptureUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    // If testing locally, the user must access the desktop via their local IP instead of localhost
    // otherwise the mobile device can't connect to localhost
    return `${origin}/capture/${sessionId}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Camera size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Capture Photo</h2>
              <p className="text-xs text-gray-500 font-medium">For {photoType.charAt(0).toUpperCase() + photoType.slice(1)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {mode === 'selection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => setMode('desktop')}
                className="flex flex-col items-center gap-4 p-8 border-2 border-gray-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Monitor size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 mb-1">Desktop Camera</h3>
                  <p className="text-sm text-gray-500">Use your computer's webcam</p>
                </div>
              </button>

              <button 
                onClick={() => setMode('mobile')}
                className="flex flex-col items-center gap-4 p-8 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 mb-1">Mobile Camera</h3>
                  <p className="text-sm text-gray-500">Scan QR code to use phone camera</p>
                </div>
              </button>
            </div>
          )}

          {mode === 'desktop' && (
            <div className="flex flex-col items-center gap-6">
              {!capturedImage ? (
                <>
                  <div className="w-full flex justify-end">
                    {devices.length > 0 && (
                      <select 
                        className="text-sm border-gray-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                      >
                        {devices.map((device, key) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${key + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full max-w-lg">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ deviceId: selectedDeviceId }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setMode('selection')} className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider">
                      Back
                    </button>
                    <button onClick={handleDesktopCapture} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-2">
                      <Camera size={16} /> Capture
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full max-w-lg">
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setCapturedImage(null)} className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider flex items-center gap-2">
                      <RefreshCw size={16} /> Retake
                    </button>
                    <button onClick={handleDesktopConfirm} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-2">
                      <Check size={16} /> Confirm & Save
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'mobile' && (
            <div className="flex flex-col items-center text-center gap-6 py-4">
              {mobileStatus === 'waiting' ? (
                <>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block">
                    <QRCode value={getCaptureUrl()} size={200} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Scan to Capture</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                      Scan this QR code with your mobile device to open the camera and take a photo.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg inline-block border border-blue-100 font-medium">
                      Waiting for photo upload from mobile...
                    </div>
                  </div>
                  <button onClick={() => setMode('selection')} className="mt-2 px-6 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider">
                    Back
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Photo Captured!</h3>
                  <p className="text-sm text-gray-500">Updating profile...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
