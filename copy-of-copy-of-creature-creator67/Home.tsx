/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {Content, GoogleGenAI, Modality} from '@google/genai';
import {
  BookOpen,
  LoaderCircle,
  Mic,
  Music,
  Music2,
  Save,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// --- Constants ---
const LOCAL_STORAGE_KEY = 'gemini-creature-creator-saves';
const IMAGE_MODEL = 'gemini-2.5-flash-image-preview';
const TEXT_MODEL = 'gemini-2.5-flash';
const COLORS = ['#FF0000', '#0000FF', '#FFFF00', '#008000', '#000000'];

// Add SpeechRecognition to the window object type
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function parseError(error: string) {
  // A simple error parser for Gemini API errors
  const regex = /{"error":(.*)}/gm;
  const m = regex.exec(error);
  try {
    const e = m[1];
    const err = JSON.parse(e);
    return err.message || error;
  } catch (e) {
    return error;
  }
}

export default function Home() {
  const canvasRef = useRef(null);
  const isMountedRef = useRef(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [originalDrawing, setOriginalDrawing] = useState(null);
  const [story, setStory] = useState('');
  const [songLyrics, setSongLyrics] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State for Modals
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);

  // Refs for Modal Accessibility
  const errorModalCloseRef = useRef(null);
  const galleryModalCloseRef = useRef(null);

  // State for Audio and Speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSinging, setIsSinging] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const utteranceRef = useRef(null);
  const audioContextRef = useRef(null);
  const musicNodesRef = useRef({oscillator: null, gain: null, interval: null});
  const singAlongMelodyNodesRef = useRef({
    oscillator: null,
    gain: null,
    interval: null,
  });

  const [savedCreations, setSavedCreations] = useState([]);

  // --- Component Lifecycle & Cleanup ---
  useEffect(() => {
    isMountedRef.current = true;
    initializeCanvas();

    // Load saved creations safely from localStorage on mount
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate data structure to prevent crashes from old/malformed data
        if (Array.isArray(parsed)) {
          const validCreations = parsed.filter(
            (c) =>
              c.id && c.originalDrawing && c.generatedImage && c.storyTitle,
          );
          setSavedCreations(validCreations);
        }
      }
    } catch (error) {
      console.error('Failed to load creations from local storage:', error);
    }

    // Load available speech synthesis voices
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      // Set mounted flag to false to prevent state updates on unmounted component
      isMountedRef.current = false;

      // --- Comprehensive Cleanup ---
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // Stop background music
      if (musicNodesRef.current.interval) clearInterval(musicNodesRef.current.interval);
      if (musicNodesRef.current.oscillator) try { musicNodesRef.current.oscillator.stop(); } catch (e) {}
      
      // Stop sing-along music
      if (singAlongMelodyNodesRef.current.interval) clearInterval(singAlongMelodyNodesRef.current.interval);
      if (singAlongMelodyNodesRef.current.oscillator) try { singAlongMelodyNodesRef.current.oscillator.stop(); } catch (e) {}
      
      // Close audio context
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);
  
  // --- Accessibility Effect for Modals ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showGallery) setShowGallery(false);
        if (showErrorModal) setShowErrorModal(false);
        if (deleteConfirmationId) setDeleteConfirmationId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Focus management for modals
    if (showErrorModal) errorModalCloseRef.current?.focus();
    if (showGallery) galleryModalCloseRef.current?.focus();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGallery, showErrorModal, deleteConfirmationId]);

  // --- Audio Functions ---
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
    }
  };

  const playSound = (type) => {
    initAudio();
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    switch (type) {
      case 'boop':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
        break;
      case 'save':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        break;
      case 'tada':
        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0.4, now);
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          oscillator.frequency.setValueAtTime(freq, now + i * 0.1);
        });
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        break;
    }
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  };

  const toggleMusic = () => {
    initAudio();
    if (isMusicPlaying) {
      if (musicNodesRef.current.interval) clearInterval(musicNodesRef.current.interval);
      if (musicNodesRef.current.oscillator) musicNodesRef.current.oscillator.stop();
      musicNodesRef.current = {oscillator: null, gain: null, interval: null};
      setIsMusicPlaying(false);
    } else {
      const audioCtx = audioContextRef.current;
      if (!audioCtx) return;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      const notes = [261.63, 329.63, 392.0, 440.0];
      let noteIndex = 0;
      const playNote = () => {
        if (audioCtx.state === 'running') {
          oscillator.frequency.linearRampToValueAtTime(notes[noteIndex], audioCtx.currentTime + 0.4);
          noteIndex = (noteIndex + 1) % notes.length;
        }
      };
      const interval = setInterval(playNote, 500);
      musicNodesRef.current = {oscillator, gain: gainNode, interval};
      setIsMusicPlaying(true);
    }
  };

  const toggleSingAlongMelody = (start) => {
    initAudio();
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    if (singAlongMelodyNodesRef.current.interval) clearInterval(singAlongMelodyNodesRef.current.interval);
    if (singAlongMelodyNodesRef.current.oscillator) singAlongMelodyNodesRef.current.oscillator.stop();
    singAlongMelodyNodesRef.current = {oscillator: null, gain: null, interval: null};

    if (start) {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      const notes = [329.63, 329.63, 392.0, 392.0, 440.0, 440.0, 392.0, 349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63];
      let noteIndex = 0;
      const playNote = () => {
        if (audioCtx.state === 'running') {
          oscillator.frequency.setValueAtTime(notes[noteIndex], audioCtx.currentTime);
          noteIndex = (noteIndex + 1) % notes.length;
        }
      };
      const interval = setInterval(playNote, 300);
      singAlongMelodyNodesRef.current = {oscillator, gain: gainNode, interval};
    }
  };

  // --- Canvas & Drawing Functions ---
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.nativeEvent.offsetX || e.nativeEvent.touches?.[0]?.clientX - rect.left) * scaleX,
      y: (e.nativeEvent.offsetY || e.nativeEvent.touches?.[0]?.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    initAudio();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const {x, y} = getCoordinates(e);
    if (e.type === 'touchstart') e.preventDefault();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.type === 'touchmove') e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const {x, y} = getCoordinates(e);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  // --- Main App Logic ---
  const handleStartOver = () => {
    initializeCanvas();
    setGeneratedImage(null);
    setOriginalDrawing(null);
    setStory('');
    setSongLyrics('');
    setPrompt('');
    setStoryTitle('');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    toggleSingAlongMelody(false);
    setIsSpeaking(false);
    setIsSinging(false);
    setCurrentWordIndex(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
  
    // Reset state and capture drawing *before* loading
    setGeneratedImage(null);
    setStory('');
    setSongLyrics('');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    toggleSingAlongMelody(false);
    setIsSpeaking(false);
    setIsSinging(false);
    setCurrentWordIndex(-1);
  
    const canvas = canvasRef.current;
    const drawingDataUrl = canvas.toDataURL('image/png');
    setOriginalDrawing(drawingDataUrl); // Set for loading animation
    setIsLoading(true);
  
    try {
      const drawingData = drawingDataUrl.split(',')[1];
      const creatureName = prompt.trim() || 'my magical friend';
      setStoryTitle(creatureName);
  
      // --- API Calls using Promise.allSettled for resilience ---
      const imageContents: Content = { parts: [ {inlineData: {data: drawingData, mimeType: 'image/png'}}, { text: `This is a drawing by a young child of a creature they named "${creatureName}". Make this drawing a colorful and friendly cartoon character. Keep the original shape and idea.` } ] };
      const imagePromise = ai.models.generateContent({ model: IMAGE_MODEL, contents: imageContents, config: { responseModalities: [Modality.IMAGE, Modality.TEXT] } });
      const storyPromise = ai.models.generateContent({ model: TEXT_MODEL, contents: `Tell me a short, happy story for a 3-year-old about a creature called "${creatureName}". Describe its personality, what it loves to eat, and a secret magical power it has. Keep sentences short and simple. The story should be about 3 paragraphs long.` });
      const songPromise = ai.models.generateContent({ model: TEXT_MODEL, contents: `Write a very simple, short, rhyming song for a 2-year-old about a creature named "${creatureName}". The song should have two short verses and a chorus. Keep it happy and easy to sing.` });
  
      const [imageResult, storyResult, songResult] = await Promise.allSettled([imagePromise, storyPromise, songPromise]);
  
      let hasCriticalError = false;
      // FIX: Define a type for partialResults to avoid TypeScript errors.
      let partialResults: {
        generatedImage?: string;
        story?: string;
        songLyrics?: string;
      } = {};

      // Process image response (critical)
      if (imageResult.status === 'fulfilled') {
        const imagePart = imageResult.value.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (imagePart?.inlineData) {
          partialResults.generatedImage = `data:image/png;base64,${imagePart.inlineData.data}`;
        } else {
          hasCriticalError = true;
          console.error('Image generation failed: No image data in response', imageResult.value);
          setErrorMessage('I had trouble creating a picture of your creature!');
        }
      } else {
        hasCriticalError = true;
        // FIX: Add a status check to ensure type-narrowing for accessing 'reason'.
        if (imageResult.status === 'rejected') {
          console.error('Image generation promise rejected:', imageResult.reason);
        }
        setErrorMessage('I had trouble creating a picture of your creature!');
      }

      // Process story response (critical)
      if (storyResult.status === 'fulfilled' && !hasCriticalError) {
        const storyText = storyResult.value.text;
        if (storyText) {
          partialResults.story = storyText.trim();
        } else {
          hasCriticalError = true;
          setErrorMessage('I couldn\'t think of a story for your creature!');
        }
      } else if (!hasCriticalError) {
        hasCriticalError = true;
        // FIX: Add a status check to ensure type-narrowing for accessing 'reason'.
        if (storyResult.status === 'rejected') {
          console.error('Story generation promise rejected:', storyResult.reason);
        }
        setErrorMessage('I couldn\'t think of a story for your creature!');
      }
      
      // Process song response (non-critical)
      if (songResult.status === 'fulfilled') {
        const songText = songResult.value.text;
        if (songText) partialResults.songLyrics = songText.trim();
        else console.warn('Song generation succeeded but returned empty text.');
      } else {
        // FIX: Add a status check to ensure type-narrowing for accessing 'reason'.
        if (songResult.status === 'rejected') {
          console.warn('Song generation promise rejected:', songResult.reason);
        }
      }
      
      if (!isMountedRef.current) return; // Abort if component unmounted
      
      if (hasCriticalError) {
        setShowErrorModal(true);
      } else {
        setGeneratedImage(partialResults.generatedImage);
        setStory(partialResults.story);
        setSongLyrics(partialResults.songLyrics || '');
        playSound('tada');
      }

    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Error in handleSubmit:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setShowErrorModal(true);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // --- Speech and Storytelling Functions ---
  const handleListen = () => {
    if (!story || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (isSinging) { // Stop singing if it's happening
      window.speechSynthesis.cancel();
      setIsSinging(false);
      setCurrentWordIndex(-1);
      toggleSingAlongMelody(false);
    }
    const utterance = new SpeechSynthesisUtterance(story);
    utteranceRef.current = utterance;
    utterance.onend = () => { if(isMountedRef.current) setIsSpeaking(false); };
    utterance.onerror = () => { if(isMountedRef.current) setIsSpeaking(false); };
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSingAlong = () => {
    if (!songLyrics || !window.speechSynthesis) return;
    if (isSinging) {
      window.speechSynthesis.cancel();
      toggleSingAlongMelody(false);
      setIsSinging(false);
      setCurrentWordIndex(-1);
      return;
    }
    if (isSpeaking) { // Stop story reading if it's happening
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    toggleSingAlongMelody(true);
    const utterance = new SpeechSynthesisUtterance(songLyrics);
    const childVoice = availableVoices.find((v: any) => v.lang.startsWith('en') && (v.name.includes('Child') || v.name.includes('Female') || v.name.includes('Zoe')));
    if (childVoice) utterance.voice = childVoice;
    utterance.pitch = 1.2;
    utterance.rate = 0.9;
    const words = songLyrics.split(/\s+/);
    let charIndex = 0;
    let wordIndex = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        while (charIndex < event.charIndex) {
          charIndex += words[wordIndex].length + 1;
          wordIndex++;
        }
        setCurrentWordIndex(wordIndex);
      }
    };
    const onEnd = () => {
      if(isMountedRef.current) {
        setIsSinging(false);
        setCurrentWordIndex(-1);
        toggleSingAlongMelody(false);
      }
    };
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
    setIsSinging(true);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setErrorMessage("Oops! Your browser doesn't support voice recognition.");
        setShowErrorModal(true);
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => setPrompt(event.results[0][0].transcript);
    recognition.onend = () => { if (isMountedRef.current) setIsListening(false); };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (isMountedRef.current) setIsListening(false);
    };
    recognition.start();
  };

  // --- Save/Load Functions ---
  const handleSaveCreation = () => {
    if (!originalDrawing || !generatedImage || !story || !storyTitle) return;
    const newCreation = { id: Date.now(), originalDrawing, generatedImage, story, songLyrics, storyTitle };
    const updatedCreations = [...savedCreations, newCreation];
    setSavedCreations(updatedCreations);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCreations));
    playSound('save');
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000); // Auto-hide notification
  };

  const handleLoadCreation = (creation) => {
    handleStartOver();
    setOriginalDrawing(creation.originalDrawing);
    setGeneratedImage(creation.generatedImage);
    setStory(creation.story);
    setSongLyrics(creation.songLyrics || '');
    setStoryTitle(creation.storyTitle);
    setShowGallery(false);
  };

  const confirmDeleteCreation = () => {
    const idToDelete = deleteConfirmationId;
    if (!idToDelete) return;
    const updatedCreations = savedCreations.filter((c) => c.id !== idToDelete);
    setSavedCreations(updatedCreations);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCreations));
    setDeleteConfirmationId(null);
  };

  const songWords = useMemo(() => songLyrics ? songLyrics.split(/\s+/) : [], [songLyrics]);

  return (
    <>
      <style>{`
        @keyframes dance { 0%, 100% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(-3deg) scale(1.02) translateY(-2px); } 75% { transform: rotate(3deg) scale(1.02) translateY(-2px); } }
        .dancing { animation: dance 0.6s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.02); } }
        .pulsing { animation: pulse 1.5s infinite ease-in-out; }
        @keyframes pulse-mic { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .listening-mic { animation: pulse-mic 1s infinite ease-in-out; }
      `}</style>
      <div className="min-h-screen notebook-paper-bg text-gray-900 flex flex-col justify-start items-center">
        <main className="container mx-auto px-3 sm:px-6 py-5 sm:py-10 pb-32 max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold mb-1 font-mega">Creature Creator</h1>
            <p className="text-md sm:text-lg text-gray-500">Draw an imaginary creature and watch Gemini bring it to life with a story and a song!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Drawing Area */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center bg-gray-200 rounded-full p-2 shadow-sm space-x-2">
                  {COLORS.map((color) => (
                    <button key={color} type="button" className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${penColor === color ? 'border-gray-800 scale-110' : 'border-white'}`} style={{backgroundColor: color}} onClick={() => { setPenColor(color); playSound('boop'); }} aria-label={`Select ${color} color`} />
                  ))}
                </div>
                <menu className="flex items-center bg-gray-300 rounded-full p-2 shadow-sm space-x-2">
                  <button type="button" onClick={toggleMusic} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 ${isMusicPlaying ? 'bg-green-400' : 'bg-white hover:bg-gray-50'}`}><Music className={`w-5 h-5 ${isMusicPlaying ? 'text-white' : 'text-gray-700'}`} aria-label="Toggle Music" /></button>
                  <button type="button" onClick={() => setShowGallery(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110"><BookOpen className="w-5 h-5 text-gray-700" aria-label="My Creations" /></button>
                  <button type="button" onClick={handleStartOver} className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110"><Trash2 className="w-5 h-5 text-gray-700" aria-label="Start Over" /></button>
                </menu>
              </div>

              <canvas ref={canvasRef} width={960} height={720} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="border-2 border-black w-full h-auto aspect-[4/3] hover:cursor-crosshair bg-white/90 touch-none rounded-lg shadow-lg" />

              <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Give your creature a name..." className="w-full p-3 sm:p-4 text-sm sm:text-base border-2 border-black bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all font-mono rounded-md" />
                  <button type="button" onClick={handleVoiceInput} disabled={isListening} className={`p-3 sm:p-4 rounded-md text-white shadow-lg transition-colors disabled:bg-gray-400 ${isListening ? 'bg-red-500 listening-mic' : 'bg-blue-500 hover:bg-blue-600'}`}><Mic className="w-6 h-6" /></button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full p-4 text-lg font-bold rounded-md bg-green-500 text-white hover:cursor-pointer hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg transform hover:scale-105">
                  {isLoading ? (<div className="flex items-center justify-center"><LoaderCircle className="w-6 h-6 animate-spin mr-2" aria-label="Loading" />Creating...</div>) : ('Create Magic!')}
                </button>
              </form>
            </div>

            {/* Right Column: Results Area */}
            <div className="w-full">
              {isLoading && (<div className="aspect-[4/3] flex flex-col items-center justify-center bg-white/90 border-2 border-dashed border-gray-400 rounded-lg p-8"><img src={originalDrawing} alt="Your drawing coming to life" className="w-2/3 pulsing rounded-md shadow-lg mb-6" /><p className="text-gray-600 font-medium text-lg">Magic in progress...</p><p className="text-gray-500 text-center">Your creature is being brought to life!</p></div>)}
              {!isLoading && !originalDrawing && (<div className="aspect-[4/3] flex flex-col items-center justify-center bg-white/90 border-2 border-dashed border-gray-400 rounded-lg p-8"><p className="text-gray-500 font-medium text-center text-lg">Your creation will appear here!</p></div>)}
              {!isLoading && originalDrawing && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><h3 className="font-bold text-lg mb-2 text-center">Your Drawing</h3><img src={originalDrawing} alt="User's drawing" className="border-2 border-gray-300 rounded-md w-full shadow-md" /></div>
                    <div><h3 className="font-bold text-lg mb-2 text-center">Gemini's Version</h3><img src={generatedImage} alt="Gemini generated creature" className={`border-2 border-gray-300 rounded-md w-full shadow-md ${isSinging ? 'dancing' : ''}`} /></div>
                  </div>
                  <div className="space-y-6">
                    {story && <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-xl capitalize">The Story of {storyTitle}</h3>
                        <div className="flex items-center space-x-2">
                          <button onClick={handleListen} className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors" aria-label={isSpeaking ? 'Stop reading' : 'Read story aloud'}>{isSpeaking ? <Square className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                          {generatedImage && <button onClick={handleSaveCreation} className="p-2 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors" aria-label="Save Creation"><Save className="w-5 h-5" /></button>}
                        </div>
                      </div>
                      <div className="bg-yellow-100/50 border border-yellow-300 rounded-md p-4 whitespace-pre-wrap font-serif text-gray-800 shadow-inner">{story}</div>
                    </div>}

                    {songLyrics && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-xl capitalize">Sing Along with {storyTitle}!</h3>
                          <button onClick={handleSingAlong} className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors" aria-label={isSinging ? 'Stop singing' : 'Sing the song'}>{isSinging ? <Square className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}</button>
                        </div>
                        <div className="bg-blue-100/50 border border-blue-300 rounded-md p-4 whitespace-pre-wrap font-serif text-gray-800 shadow-inner">
                          {songWords.map((word, index) => (<span key={index} className={`transition-all duration-150 ${currentWordIndex === index ? 'text-pink-600 font-bold scale-110 inline-block' : ''}`}>{word}{' '}</span>))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* --- Modals --- */}
        {showGallery && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="gallery-title">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4"><h3 id="gallery-title" className="text-2xl font-bold text-gray-700">Creature Treasure Box</h3><button ref={galleryModalCloseRef} onClick={() => setShowGallery(false)} className="text-gray-400 hover:text-gray-500"><X className="w-6 h-6" /></button></div>
              <div className="overflow-y-auto flex-grow">
                {savedCreations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {savedCreations.map((creation) => (
                      <div key={creation.id} className="border rounded-lg p-2 shadow-sm flex flex-col">
                        <img src={creation.generatedImage} alt={creation.storyTitle} className="rounded-md mb-2 aspect-square object-cover" />
                        <h4 className="font-bold text-center capitalize truncate mb-2">{creation.storyTitle}</h4>
                        <div className="mt-auto flex justify-around">
                          <button onClick={() => handleLoadCreation(creation)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">View</button>
                          <button onClick={() => setDeleteConfirmationId(creation.id)} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-center text-gray-500 py-10">Your treasure box is empty. Go create some magic!</p>)}
              </div>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="error-title">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4"><h3 id="error-title" className="text-xl font-bold text-red-600">Uh oh!</h3><button ref={errorModalCloseRef} onClick={() => setShowErrorModal(false)} className="text-gray-400 hover:text-gray-500"><X className="w-5 h-5" /></button></div>
              <p className="font-medium text-gray-600">{parseError(errorMessage)}</p>
            </div>
          </div>
        )}

        {deleteConfirmationId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
                <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                    <h3 id="delete-title" className="text-lg font-bold text-gray-800 mb-2">Are you sure?</h3>
                    <p className="text-gray-600 mb-6">This creature will be removed from your Treasure Box forever.</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setDeleteConfirmationId(null)} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                        <button onClick={confirmDeleteCreation} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600">Delete</button>
                    </div>
                </div>
            </div>
        )}
        
        {showSaveNotification && (
            <div className="fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
                Creature saved to Treasure Box!
            </div>
        )}
      </div>
    </>
  );
}