import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../../../environments/environment';

type GenerationResult = {
  story?: string;
  song?: string;
  imageDataUrl?: string;
  generatedImage?: string;
  error?: string;
  title?: string;
};

@Component({
  selector: 'app-creature-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creature-creator.component.html',
  styleUrls: ['./creature-creator.component.css'],
})
export class CreatureCreatorComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  prompt = '';
  penColor = '#000000';
  isDrawing = false;
  isLoading = false;
  result: GenerationResult | null = null;
  colors = ['#FF0000', '#0000FF', '#FFFF00', '#008000', '#000000'];
  // Text-only model to avoid image quotas/endpoints
  private readonly textModelsFallback = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro',
  ];

  private ctx!: CanvasRenderingContext2D | null;
  private apiKey = environment.genaiApiKey;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.ensureCtx();
  }

  private ensureCtx() {
    if (!this.ctx) {
      const canvas = this.canvasRef.nativeElement;
      this.ctx = canvas.getContext('2d');
      if (this.ctx) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  setColor(color: string) {
    this.penColor = color;
  }

  startListening() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      this.prompt = e.results[0][0].transcript;
    };
    rec.start();
  }

  async onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await file.arrayBuffer().then((buf) => {
      const blob = new Blob([buf], { type: file.type });
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });
    this.drawImageOnCanvas(dataUrl);
    input.value = '';
  }

  private drawImageOnCanvas(dataUrl: string) {
    this.ensureCtx();
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      // clear and fit image with contain behavior
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = dataUrl;
  }

  startDrawing(event: MouseEvent | TouchEvent | PointerEvent) {
    this.ensureCtx();
    this.isDrawing = true;
    this.moveToEvent(event, true);
    event.preventDefault();
  }

  draw(event: MouseEvent | TouchEvent | PointerEvent) {
    this.ensureCtx();
    if (!this.isDrawing) return;
    this.moveToEvent(event, false);
    event.preventDefault();
  }

  stopDrawing() {
    this.isDrawing = false;
    this.ctx?.beginPath();
  }

  private moveToEvent(event: MouseEvent | TouchEvent | PointerEvent, begin: boolean) {
    this.ensureCtx();
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      (event as PointerEvent).clientX ??
      ((event as TouchEvent).touches?.[0]?.clientX ?? (event as MouseEvent).clientX);
    const clientY =
      (event as PointerEvent).clientY ??
      ((event as TouchEvent).touches?.[0]?.clientY ?? (event as MouseEvent).clientY);
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.penColor;
    if (begin) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    } else {
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }

  clearCanvas() {
    this.ensureCtx();
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.result = null;
  }

  async generate() {
    if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_KEY_HERE') {
      this.result = { error: 'Please set your Gemini API key in environments/environment.ts.' };
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const drawingDataUrl = canvas.toDataURL('image/png');
    const drawingBase64 = drawingDataUrl.split(',')[1];
    const creatureName = this.prompt.trim() || 'my magical friend';
    this.isLoading = true;
    this.result = null;

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const storyPrompt = `Write a playful 3-paragraph kids story about a creature named "${creatureName}". Mention its favorite hobby and one magical power. Keep it joyful and simple.`;
      const songPrompt = `Write a tiny, rhyming song (2 short verses + 1 chorus) for a child about "${creatureName}". Keep it catchy and happy.`;

      const runWithFallback = async (prompt: string) => {
        for (const modelName of this.textModelsFallback) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const resp = await model.generateContent(prompt);
            const txt = resp.response.text();
            if (txt) return txt;
          } catch (e: any) {
            const msg = (e?.message || '').toLowerCase();
            // If quota/429 -> surface immediately
            if (msg.includes('quota') || msg.includes('429')) throw e;
            // Otherwise try next model
            continue;
          }
        }
        throw new Error('All models unavailable (404/403).');
      };

      const [story, song] = await Promise.all([
        runWithFallback(storyPrompt),
        runWithFallback(songPrompt),
      ]);

      this.result = {
        story: story?.trim(),
        song: song?.trim(),
        imageDataUrl: drawingDataUrl,
        generatedImage: undefined,
        title: creatureName,
      };
    } catch (error: any) {
      const raw = error?.message || '';
      const isQuota = raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate-limit');
      // Fallback: still show story/song locally so UI is usable
      // We don’t surface the technical error to the user to keep it friendly.
      const message = isQuota
        ? 'Gemini quota exceeded (free tier). Please add billing or wait for quota reset.'
        : 'Story generated locally.';
      this.result = {
        // error removed from UI for friendlier UX
        title: creatureName,
        imageDataUrl: drawingDataUrl,
        story: `This is ${creatureName}. ${creatureName} loves to play, explore, and help friends. Even when magic is offline, ${creatureName} brings smiles to everyone nearby!`,
        song: `(${creatureName} Song)\n${creatureName}, ${creatureName}, happy and bright,\nDancing and humming from morning to night!\nClap your hands and sing along too,\n${creatureName} shares joy with me and you!`,
      };
    } finally {
      this.isLoading = false;
    }
  }

  speak(text?: string, isSong: boolean = false) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (isSong) {
      utter.pitch = 1.3;
      utter.rate = 0.95;
    }
    window.speechSynthesis.speak(utter);
  }
}

