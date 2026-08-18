import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { audioService } from '../utils/audio';

interface AudioRecorderProps {
  id: string;
  onRecordingComplete?: (blobUrl: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ id, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (onRecordingComplete) {
          onRecordingComplete(url);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);
      audioService.playSuccess();

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access not granted or unavailable:', err);
      setHasMicPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      audioService.playClick();
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordSeconds(0);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
      {!audioUrl && !isRecording && (
        <button
          type="button"
          id={`start-rec-${id}`}
          onClick={startRecording}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition active:scale-95"
        >
          <Mic className="w-4 h-4 animate-pulse" />
          <span>錄音作答</span>
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span className="font-mono font-medium">錄音中 {recordSeconds}s</span>
          </div>
          <button
            type="button"
            id={`stop-rec-${id}`}
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium transition active:scale-95"
          >
            <Square className="w-3.5 h-3.5" />
            <span>完成錄音</span>
          </button>
        </div>
      )}

      {audioUrl && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id={`play-rec-${id}`}
            onClick={togglePlayback}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? '暫停播放' : '重溫錄音'}</span>
          </button>
          <button
            type="button"
            id={`reset-rec-${id}`}
            onClick={resetRecording}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition text-xs"
            title="重新錄音"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重錄</span>
          </button>
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
            <Volume2 className="w-3.5 h-3.5" /> 已記錄作答 ({recordSeconds}s)
          </span>
        </div>
      )}

      {hasMicPermission === false && (
        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
          未能取得麥克風權限（亦可由考官手動評分）
        </span>
      )}
    </div>
  );
};
