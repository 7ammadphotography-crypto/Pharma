import { useState, useEffect, useCallback } from 'react';

export const useSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const updateVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback((text) => {
        if (!isEnabled || !text) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good English voice
        const voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0];

        if (voice) utterance.voice = voice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [isEnabled, voices]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const toggle = useCallback(() => {
        setIsEnabled(prev => {
            if (prev) stop();
            return !prev;
        });
    }, [stop]);

    return { isSpeaking, isEnabled, speak, stop, toggle };
};
