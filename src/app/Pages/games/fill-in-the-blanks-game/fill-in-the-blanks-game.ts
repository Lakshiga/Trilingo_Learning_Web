import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fill-in-the-blank-game',
  standalone: true,
  imports: [CommonModule,NgOptimizedImage,RouterLink],
  templateUrl: './fill-in-the-blanks-game.html',
  styleUrls: ['./fill-in-the-blanks-game.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FillInTheBlankGame{
  gameData = [
    {
      word: 'apple',
      hint: 'A sweet fruit, often red or green',
      imageUrl: 'assets/images/apple.png'
    },
    {
      word: 'car',
      hint: 'A vehicle with four wheels used for transportation',
      imageUrl: 'assets/images/car.png'
    },
    {
      word: 'book',
      hint: 'A set of written or printed pages bound together',
      imageUrl: 'assets/images/book.png'
    },
    {
      word: 'sun',
      hint: 'The star that gives Earth light and heat',
      imageUrl: 'assets/images/sun.png'
    },    
    {
      word: 'tree',
      hint: 'A tall plant with a trunk, branches and leaves',
      imageUrl: 'assets/images/tree.png'
    }
  ];

  currentLevelIndex = signal(0);
  userAnswer: string[] = [];
  scrambledLetters: any[] = [];
  state: 'playing' | 'correct' | 'incorrect' | 'finished' = 'playing';

  ngOnInit() {
    this.loadLevel();
  }

  currentLevel() {
    return this.gameData[this.currentLevelIndex()];
  }

  loadLevel() {
    const level = this.currentLevel();
    if (!level) return;

    this.userAnswer = Array(level.word.length).fill('');
    this.scrambledLetters = this.shuffle(level.word.split('')).map((letter, i) => ({
      letter,
      chosen: false,
      originalIndex: i
    }));
    this.state = 'playing';
  }

  shuffle(array: string[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  selectLetter(letterObj: any) {
    const emptyIndex = this.userAnswer.findIndex(l => l === '');
    if (emptyIndex !== -1) {
      this.userAnswer[emptyIndex] = letterObj.letter;
      letterObj.chosen = true;
    }

    if (!this.userAnswer.includes('')) {
      this.checkAnswer();
    }
  }

  removeLetter(index: number) {
    const letter = this.userAnswer[index];
    if (!letter) return;

    const original = this.scrambledLetters.find(l => l.letter === letter && l.chosen);
    if (original) original.chosen = false;

    this.userAnswer[index] = '';
    this.state = 'playing';
  }

  checkAnswer() {
    const level = this.currentLevel();
    if (this.userAnswer.join('').toLowerCase() === level.word.toLowerCase()) {
      this.state = 'correct';
    } else {
      this.state = 'incorrect';
    }
  }

  retryLevel() {
    this.loadLevel();
  }

  nextLevel() {
    if (this.currentLevelIndex() < this.gameData.length - 1) {
      this.currentLevelIndex.update(i => i + 1);
      this.loadLevel();
    } else {
      this.state = 'finished';
    }
  }

  restartGame() {
    this.currentLevelIndex.set(0);
    this.loadLevel();
  }

  allLettersChosen() {
    return this.scrambledLetters.every(l => l.chosen);
  }

  gameState() {
    return this.state;
  }
}
