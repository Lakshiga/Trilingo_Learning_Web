import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ImageItem, WordItem } from '../game_model';
import { WordMatchService } from './word-match-service';

import { TranslateModule } from '@ngx-translate/core';
import { BackToGamesButton } from '../../../Shared/back-to-games-button/back-to-games-button';
import { GameResultVideoComponent } from '../../../Shared/game-result-video/game-result-video';
import { GameStatusMessagesService } from '../../../services/game-status-messages.service';
import { CompletionService } from '../../../services/completion';

@Component({
  selector: 'app-word-match-game',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TranslateModule, BackToGamesButton, GameResultVideoComponent],
  templateUrl: './word-match-game.html',
  styleUrls: ['./word-match-game.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordMatchGame implements OnInit {
  private gameService = inject(WordMatchService);
  private readonly statusMessages = inject(GameStatusMessagesService);
  private readonly completion = inject(CompletionService);
  
  words = signal<WordItem[]>([]);
  images = signal<ImageItem[]>([]);
  
  selectedWord = signal<WordItem | null>(null);
  selectedImage = signal<ImageItem | null>(null);
  
  userPairs = signal<Map<number, number>>(new Map());
  gameState = signal<'playing' | 'finished'>('playing');

  results = computed(() => {
    if (this.gameState() !== 'finished') {
      return new Map<number, boolean>();
    }
    const resultMap = new Map<number, boolean>();
    this.userPairs().forEach((imageId, wordId) => {
      resultMap.set(wordId, wordId === imageId);
    });
    return resultMap;
  });

  allPairsMade = computed(() => this.userPairs().size === this.words().length && this.words().length > 0);
  allCorrect = computed(() => {
    if(!this.allPairsMade() || this.gameState() !== 'finished') return false;
    return Array.from(this.results().values()).every(isCorrect => isCorrect);
  });

  correctCount = computed(() => {
    if (this.gameState() !== 'finished') return 0;
    return Array.from(this.results().values()).filter(isCorrect => isCorrect).length;
  });

  incorrectCount = computed(() => {
    if (this.gameState() !== 'finished') return 0;
    return Array.from(this.results().values()).filter(isCorrect => !isCorrect).length;
  });

  score = computed(() => {
    return this.correctCount() * 10;
  });

  ngOnInit() {
    this.setupGame();
  }

  setupGame(): void {
    this.statusMessages.reset();
    const gameItems = this.gameService.getGameItems()();
    this.words.set(gameItems.map(item => ({ id: item.id, text: item.word })));
    
    const imageItems = gameItems.map(item => ({ id: item.id, url: item.imageUrl, alt: item.description }));
    this.images.set(this.shuffleArray(imageItems));
    
    this.selectedWord.set(null);
    this.selectedImage.set(null);
    this.userPairs.set(new Map());
    this.gameState.set('playing');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  selectWord(word: WordItem): void {
    if (this.gameState() === 'finished' || this.isWordPaired(word.id)) {
      return;
    }
    this.selectedWord.set(word);
    this.tryFormPair();
  }

  selectImage(image: ImageItem): void {
    if (this.gameState() === 'finished' || this.isImagePaired(image.id)) {
      return;
    }
    this.selectedImage.set(image);
    this.tryFormPair();
  }

  private tryFormPair(): void {
    const word = this.selectedWord();
    const image = this.selectedImage();

    if (word && image) {
      this.userPairs.update(pairs => {
        const newPairs = new Map(pairs);
        newPairs.set(word.id, image.id);
        return newPairs;
      });
      this.selectedWord.set(null);
      this.selectedImage.set(null);
    }
  }

  checkAnswers(): void {
    if (this.allPairsMade()) {
      this.gameState.set('finished');

      // update shared status for reuse
      if (this.allCorrect()) {
        this.statusMessages.setSuccess('GAME.WORD_MATCH.CONGRATULATIONS', 'GAME.WORD_MATCH.ALL_CORRECT');
        this.completion.triggerFireworks();
      } else {
        this.statusMessages.setPartial('GAME.WORD_MATCH.RESULTS', 'GAME.WORD_MATCH.SCORE');
      }
    }
  }

  isWordSelected(wordId: number): boolean {
    return this.selectedWord()?.id === wordId;
  }

  isImageSelected(imageId: number): boolean {
    return this.selectedImage()?.id === imageId;
  }

  isWordPaired(wordId: number): boolean {
    return this.userPairs().has(wordId);
  }
  
  isImagePaired(imageId: number): boolean {
    return Array.from(this.userPairs().values()).includes(imageId);
  }

  getWordResultClass(wordId: number): string {
    if (this.gameState() !== 'finished') return '';
    const isCorrect = this.results().get(wordId);
    return isCorrect ? 'ring-green-500' : 'ring-red-500';
  }

  getImageResultClass(imageId: number): string {
    if (this.gameState() !== 'finished') return '';
    const pairedWordId = Array.from(this.userPairs().entries()).find(([_, imgId]) => imgId === imageId)?.[0];
    if (pairedWordId === undefined) return '';
    const isCorrect = this.results().get(pairedWordId);
    return isCorrect ? 'ring-green-500' : 'ring-red-500';
  }
}
