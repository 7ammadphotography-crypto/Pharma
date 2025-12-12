import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

export default function VoicePlayer({ audioUrl, duration, waveformData }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const changeSpeed = () => {
        const speeds = [1, 1.5, 2, 0.5];
        const currentIndex = speeds.indexOf(playbackRate);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-3 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-3 min-w-[280px]">
            <Button
                onClick={togglePlayback}
                size="icon"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-shrink-0"
            >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            <div className="flex-1 space-y-2">
                {/* Waveform / Progress Bar */}
                <div
                    className="flex items-center gap-0.5 h-8 cursor-pointer"
                    onClick={handleSeek}
                >
                    {waveformData && waveformData.length > 0 ? (
                        waveformData.map((bar, i) => {
                            const barProgress = (i / waveformData.length) * 100;
                            const isPassed = barProgress <= progress;
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-colors ${isPassed
                                            ? 'bg-gradient-to-t from-indigo-600 to-purple-600'
                                            : 'bg-slate-700'
                                        }`}
                                    style={{
                                        height: `${Math.max(bar * 100, 10)}%`,
                                    }}
                                />
                            );
                        })
                    ) : (
                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Time & Speed */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <button
                        onClick={changeSpeed}
                        className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors font-mono font-bold"
                    >
                        {playbackRate}x
                    </button>
                </div>
            </div>

            <audio ref={audioRef} src={audioUrl} preload="metadata" />
        </div>
    );
}
