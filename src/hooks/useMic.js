import { useState, useRef, useCallback } from 'react';

export function useMic({ onAudioChunk }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recordSegment = () => {
        if (!streamRef.current) return;
        const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        let localChunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            localChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (localChunks.length > 0) {
            const blob = new Blob(localChunks, { type: 'audio/webm' });
            onAudioChunk(blob);
          }
        };

        mediaRecorder.start();
      };

      // Start first segment
      recordSegment();
      setIsRecording(true);

      // Loop to create standalone, valid WebM files every 30 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop(); // Stops gracefully, firing flush events and properly sealing WebM headers
          recordSegment(); // Instantiate the next fresh segment immediately
        }
      }, 30000);

    } catch (err) {
      console.error('Mic permission denied or error:', err);
      alert('Microphone permission is required to use this feature.');
    }
  }, [onAudioChunk]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  return { isRecording, toggleRecording, stopRecording };
}
