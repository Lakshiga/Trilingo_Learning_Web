import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Card {
  id: number;
  type: 'word' | 'image' | 'definition';
  value: string;
  linksTo: string;
  power?: boolean;
  isFlipped?: boolean;
  isMatched?: boolean;
  isMismatched?: boolean;
}

const INITIAL_CARDS_DATA: Omit<Card, 'isFlipped' | 'isMatched' | 'isMismatched'>[] = [
  { id: 1, type: 'word', value: 'Apple', linksTo: 'apple' },
  { id: 2, type: 'image', value: 'assets/images/apple.png', linksTo: 'apple' },
  
  { id: 3, type: 'word', value: 'Car', linksTo: 'car' },
  { id: 4, type: 'image', value: 'assets/images/car.png', linksTo: 'car' },
  
  { id: 5, type: 'word', value: 'Book', linksTo: 'book' },
  { id: 6, type: 'image', value: 'assets/images/book.png', linksTo: 'book' },
  
  { id: 7, type: 'word', value: 'Sun', linksTo: 'sun', power: true },
  { id: 8, type: 'image', value: 'assets/images/sun.png', linksTo: 'sun' },
  
  { id: 9, type: 'word', value: 'Tree', linksTo: 'tree' },
  { id: 10, type: 'image', value: 'assets/images/tree.png', linksTo: 'tree' },
];

@Component({
  selector: 'app-memory-pair-game',
  standalone: true,
  imports: [CommonModule,NgOptimizedImage,RouterLink],
  templateUrl: './memory-pair-game.html',
  styleUrls: ['./memory-pair-game.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemoryPairGame {
  cards = signal<Card[]>([]);
  flippedCards = signal<Card[]>([]);
  score = signal(0);
  combo = signal(0);
  timer = signal(90);
  highScore = signal(0);
  powerMatchMessage = signal<string | null>(null);
  isChecking = signal(false);

  private timerInterval: any;

  allCardsMatched = computed(() => this.cards().length > 0 && this.cards().every(c => c.isMatched));
  isGameOver = computed(() => this.timer() === 0 || this.allCardsMatched());

  constructor() {
    this.highScore.set(Number(localStorage.getItem('wordMemoryHighScore') || '0'));
    this.restartGame();

    // Check if 2 cards are flipped
    effect(() => {
      if (this.flippedCards().length === 2) {
        this.isChecking.set(true);
        setTimeout(() => this.checkMatch(), 600);
      }
    });

    // Stop timer and save high score
    effect(() => {
      if (this.isGameOver()) {
        this.stopTimer();
        if (this.score() > this.highScore()) {
          this.highScore.set(this.score());
          localStorage.setItem('wordMemoryHighScore', this.score().toString());
        }
      }
    });
  }

  restartGame(): void {
    this.stopTimer();
    this.score.set(0);
    this.combo.set(0);
    this.timer.set(90);
    this.isChecking.set(false);
    this.powerMatchMessage.set(null);
    this.flippedCards.set([]);
    this.cards.set(this.shuffleCards(this.initializeCards()));
    this.startTimer();
  }

  private initializeCards(): Card[] {
    return INITIAL_CARDS_DATA.map(c => ({
      ...c,
      isFlipped: false,
      isMatched: false,
      isMismatched: false
    }));
  }

  private shuffleCards(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timer.update(t => (t > 0 ? t - 1 : 0));
    }, 1000);
  }

  private stopTimer(): void {
    clearInterval(this.timerInterval);
  }

  onCardClick(card: Card): void {
    if (this.isChecking() || card.isFlipped || card.isMatched || this.isGameOver()) return;

    this.cards.update(cards =>
      cards.map(c => (c.id === card.id ? { ...c, isFlipped: true } : c))
    );
    this.flippedCards.update(f => [...f, { ...card, isFlipped: true }]);
  }

  private checkMatch(): void {
    const [a, b] = this.flippedCards();
    const match = a.linksTo === b.linksTo;

    if (match) this.handleMatch(a, b);
    else this.handleMismatch(a, b);
  }

  private handleMatch(a: Card, b: Card): void {
    this.cards.update(cards =>
      cards.map(c => (c.id === a.id || c.id === b.id ? { ...c, isMatched: true } : c))
    );

    let points = 10;
    if (a.type === 'definition' || b.type === 'definition') points += 5;
    if (a.power || b.power) {
      points += 30;
      this.powerMatchMessage.set('🔥 POWER MATCH! 🔥');
      setTimeout(() => this.powerMatchMessage.set(null), 1500);
    }

    this.score.update(s => s + points);
    this.combo.update(c => c + 1);

    if (this.combo() > 0 && this.combo() % 3 === 0) {
      this.score.update(s => s + 10);
      this.powerMatchMessage.set('💥 COMBO BONUS! +10 💥');
      setTimeout(() => this.powerMatchMessage.set(null), 1500);
    }

    this.flippedCards.set([]);
    this.isChecking.set(false);
  }

  private handleMismatch(a: Card, b: Card): void {
    this.combo.set(0);
    this.cards.update(cards =>
      cards.map(c =>
        c.id === a.id || c.id === b.id ? { ...c, isMismatched: true } : c
      )
    );

    setTimeout(() => {
      this.cards.update(cards =>
        cards.map(c =>
          c.id === a.id || c.id === b.id
            ? { ...c, isFlipped: false, isMismatched: false }
            : c
        )
      );
      this.flippedCards.set([]);
      this.isChecking.set(false);
    }, 1000);
  }
}
