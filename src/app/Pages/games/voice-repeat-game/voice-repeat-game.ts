import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

// Language configuration with words and images
const LANGUAGE_CONFIG = {
  'en': {
    name: 'English',
    langCode: 'en-US',
    words: [
      { word: 'Apple', image: 'assets/images/apple.png', audio: 'assets/Voices/apple-en.mp3' },
      { word: 'Book', image: 'assets/images/book.png', audio: 'assets/Voices/book-en.mp3' },
      { word: 'Car', image: 'assets/images/car.png', audio: 'assets/Voices/car-en.mp3' },
      { word: 'Sun', image: 'assets/images/sun.png', audio: 'assets/Voices/sun-en.mp3' },
      { word: 'Tree', image: 'assets/images/tree.png', audio: 'assets/Voices/tree-en.mp3' }
    ]
  },
  'ta': {
    name: 'தமிழ்',
    langCode: 'ta-IN',
    words: [
      { word: 'ஆப்பிள்', image: 'assets/images/apple.png', audio: 'assets/Voices/apple-ta.mp3' },
      { word: 'புத்தகம்', image: 'assets/images/book.png', audio: 'assets/Voices/book-ta.mp3' },
      { word: 'கார்', image: 'assets/images/car.png', audio: 'assets/Voices/car-en.mp3' },
      { word: 'சூரியன்', image: 'assets/images/sun.png', audio: 'assets/Voices/sun-ta.mp3' },
      { word: 'மரம்', image: 'assets/images/tree.png', audio: 'assets/Voices/tree-ta.mp3' }
    ]
  },
  'si': {
    name: 'සිංහල',
    langCode: 'si-LK',
    words: [
      { word: 'ඇපල්', image: 'assets/images/apple.png', audio: 'assets/Voices/apple-si.mp3' },
      { word: 'පොත', image: 'assets/images/book.png', audio: 'assets/Voices/book-si.mp3' },
      { word: 'කාර්', image: 'assets/images/car.png', audio: 'assets/Voices/car-si.mp3' },
      { word: 'හිරු', image: 'assets/images/sun.png', audio: 'assets/Voices/sun-si.mp3' },
      { word: 'ගස', image: 'assets/images/tree.png', audio: 'assets/Voices/tree-si.mp3' }
    ]
  }
};

type GameStatus = 'idle' | 'listening' | 'checking' | 'match' | 'mismatch' | 'error';

@Component({
  selector: 'app-voice-repeat-game',
  imports: [CommonModule, TranslateModule, RouterModule],
  templateUrl: './voice-repeat-game.html',
  styleUrl: './voice-repeat-game.css'
})
export class VoiceRepeatGame implements OnInit, OnDestroy {
  private translateService = inject(TranslateService);

  // Game state
  targetIndex: number = 0;
  status: GameStatus = 'idle';
  transcript: string = '';
  resultMessage: string = '';
  isSupported: boolean = true;

  // Speech recognition
  private recognition: any = null;
  private audio: HTMLAudioElement | null = null;
  private speechTimeout: any = null;
isRecognitionInitialized: any;

  // Getters for current language data
  get currentLang() {
    return this.translateService.currentLang || 'en';
  }

  get currentLanguageData() {
    return LANGUAGE_CONFIG[this.currentLang as keyof typeof LANGUAGE_CONFIG];
  }

  get targetWord() {
    return this.currentLanguageData.words[this.targetIndex];
  }

  ngOnInit() {
    this.initializeSpeechRecognition();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initializeSpeechRecognition() {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.isSupported = false;
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true; // Enable interim results for faster feedback
      this.recognition.maxAlternatives = 1; // Only get the best result
      this.recognition.lang = this.currentLanguageData.langCode;
      
      console.log('Speech Recognition initialized with language:', this.currentLanguageData.langCode);
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      this.isSupported = false;
      return;
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[0];
      const spokenText = result[0].transcript;
      
      // Show interim results immediately for faster feedback
      this.transcript = spokenText;
      
      // Only process final results
      if (result.isFinal) {
        this.status = 'checking';
        this.compareWords(spokenText, this.targetWord.word);
        // Stop recognition immediately after getting final result
        this.recognition.stop();
      }
    };

    this.recognition.onend = () => {
      // Clear the timeout when recognition ends
      if (this.speechTimeout) {
        clearTimeout(this.speechTimeout);
        this.speechTimeout = null;
      }
      
      if (this.status === 'listening' || this.status === 'checking') {
        this.status = 'idle';
      }
    };

    this.recognition.onerror = (event: any) => {
      this.status = 'error';
      this.handleSpeechError(event.error);
    };
  }

  private compareWords(spokenText: string, targetWord: string) {
    const spoken = spokenText.trim().toLowerCase();
    const target = targetWord.trim().toLowerCase();

    // More flexible comparison - check if spoken word contains target word or vice versa
    const isMatch = spoken === target || 
                   spoken.includes(target) || 
                   target.includes(spoken) ||
                   this.calculateSimilarity(spoken, target) > 0.7;

    if (isMatch) {
      this.status = 'match';
      this.resultMessage = this.translateService.instant('GAME.VOICE_REPEAT.CORRECT') + ' "' + spokenText + '"';
    } else {
      this.status = 'mismatch';
      this.resultMessage = this.translateService.instant('GAME.VOICE_REPEAT.INCORRECT') + ' "' + spokenText + '" ' + 
                          this.translateService.instant('GAME.VOICE_REPEAT.BUT_TARGET') + ' "' + targetWord + '"';
    }
  }

  // Calculate similarity between two strings (0-1 scale)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Calculate Levenshtein distance between two strings
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private handleSpeechError(error: string) {
    let message = '';
    
    switch (error) {
      case 'no-speech':
        message = this.translateService.instant('GAME.VOICE_REPEAT.ERROR_NO_SPEECH');
        break;
      case 'not-allowed':
        message = this.translateService.instant('GAME.VOICE_REPEAT.ERROR_NOT_ALLOWED');
        break;
      default:
        message = this.translateService.instant('GAME.VOICE_REPEAT.ERROR_GENERAL');
    }
    
    this.resultMessage = message;
  }


  nextWord() {
    this.targetIndex = (this.targetIndex + 1) % this.currentLanguageData.words.length;
    this.status = 'idle';
    this.transcript = '';
    this.resultMessage = '';
  }

  startListening() {
    console.log('Start listening clicked');
    
    if (!this.isSupported) {
      this.resultMessage = this.translateService.instant('GAME.VOICE_REPEAT.NOT_SUPPORTED');
      this.status = 'error';
      return;
    }

    if (!this.recognition) {
      this.resultMessage = 'Speech recognition not initialized';
      this.status = 'error';
      return;
    }

    try {
      // Clear previous state
      this.transcript = '';
      this.resultMessage = '';
      this.status = 'listening';
      
      console.log('Starting speech recognition...');
      
      // Set a timeout to stop listening after 5 seconds
      this.speechTimeout = setTimeout(() => {
        if (this.status === 'listening') {
          console.log('Speech recognition timeout');
          this.recognition.stop();
          this.status = 'error';
          this.resultMessage = this.translateService.instant('GAME.VOICE_REPEAT.ERROR_NO_SPEECH');
        }
      }, 5000);
      
      // Update language before starting
      this.recognition.lang = this.currentLanguageData.langCode;
      this.recognition.start();
      
      console.log('Speech recognition started');
      
    } catch (e: any) {
      console.error('Error starting speech recognition:', e);
      
      if (e.name === 'InvalidStateError') {
        // Recognition is already running, just update status
        this.status = 'listening';
        this.resultMessage = this.translateService.instant('GAME.VOICE_REPEAT.SPEAK_NOW');
      } else {
        this.status = 'error';
        this.resultMessage = this.translateService.instant('GAME.VOICE_REPEAT.ERROR_GENERAL') + ': ' + e.message;
      }
    }
  }

  playAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    
    this.audio = new Audio(this.targetWord.audio);
    this.audio.play().catch(() => {
      console.warn('Could not play audio file');
    });
  }

  private cleanup() {
    if (this.recognition) {
      this.recognition.abort();
    }
    if (this.audio) {
      this.audio.pause();
    }
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
    }
  }

  getStatusClass() {
    const statusClasses = {
      'listening': 'bg-yellow-400 border-yellow-600',
      'match': 'bg-green-500 border-green-700',
      'mismatch': 'bg-red-500 border-red-700',
      'error': 'bg-red-700 border-red-900',
      'idle': 'bg-blue-500 border-blue-700',
      'checking': 'bg-purple-500 border-purple-700'
    };
    return statusClasses[this.status] || 'bg-gray-500 border-gray-700';
  }

  getStatusText() {
    switch (this.status) {
      case 'idle':
        return this.translateService.instant('GAME.VOICE_REPEAT.READY');
      case 'listening':
        return this.translateService.instant('GAME.VOICE_REPEAT.LISTENING');
      case 'checking':
        return this.translateService.instant('GAME.VOICE_REPEAT.CHECKING');
      case 'match':
      case 'mismatch':
      case 'error':
        return this.resultMessage;
      default:
        return '';
    }
  }

  isButtonDisabled() {
    return this.status === 'listening' || this.status === 'checking';
  }

  // Method to reinitialize speech recognition if needed
  reinitializeSpeechRecognition() {
    console.log('Reinitializing speech recognition...');
    this.cleanup();
    this.initializeSpeechRecognition();
  }
}
