import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, X, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceRecorder({ onSend, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveformData, setWaveformData] = useState([]);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const audioElementRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup audio context for waveform
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerIntervalRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= 120) { // 2 minutes max
                        stopRecording();
                        return 120;
                    }
                    return prev + 1;
                });
            }, 1000);

            // Animate waveform
            animateWaveform();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Could not access microphone');
        }
    };

    const animateWaveform = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording && !isPaused) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            const bars = Array.from(dataArray.slice(0, 32)).map(val => val / 255);
            setWaveformData(bars);

            requestAnimationFrame(draw);
        };

        draw();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        }
    };

    const togglePlayback = () => {
        if (!audioElementRef.current) return;

        if (isPlaying) {
            audioElementRef.current.pause();
        } else {
            audioElementRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob, duration);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-card border border-indigo-500/30 rounded-2xl p-4 space-y-4">
            {/* Waveform Visualization */}
            <div className="flex items-center justify-center gap-1 h-24 bg-zinc-900/50 rounded-xl p-4">
                {isRecording || audioBlob ? (
                    waveformData.map((bar, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-full transition-all duration-100"
                            style={{
                                height: `${Math.max(bar * 100, 2)}%`,
                                opacity: isRecording ? 1 : 0.5
                            }}
                        />
                    ))
                ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Mic className="w-6 h-6" />
                        <span className="text-sm">Click to start recording</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {!isRecording && !audioBlob ? (
                        <Button
                            onClick={startRecording}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            <Mic className="w-5 h-5" />
                        </Button>
                    ) : isRecording ? (
                        <Button
                            onClick={stopRecording}
                            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
                        >
                            <Square className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button
                            onClick={togglePlayback}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                    )}

                    <div className="flex flex-col">
                        <span className="text-white font-mono text-lg font-bold">
                            {formatTime(duration)}
                        </span>
                        <span className="text-xs text-slate-500">
                            {isRecording ? 'Recording...' : audioBlob ? 'Preview' : 'Ready'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    {audioBlob && (
                        <Button
                            onClick={handleSend}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Send
                        </Button>
                    )}
                </div>
            </div>

            {/* Hidden audio element for playback */}
            {audioUrl && (
                <audio
                    ref={audioElementRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                />
            )}
        </div>
    );
}
