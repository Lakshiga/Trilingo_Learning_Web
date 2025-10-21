export interface GameItem {
  id: number;
  word: string;
  imageUrl: string;
  description: string;
}

export interface WordItem {
  id: number;
  text: string;
}

export interface ImageItem {
  id: number;
  url: string;
  alt: string;
}


export interface GameLevel {
  word: string;
  imageUrl: string;
  hint: string;
}

export interface LetterChoice {
  letter: string;
  originalIndex: number;
  chosen: boolean;
}

export interface Card {
  id: number;
  type: 'word' | 'image' | 'definition';
  value: string; // The word, image URL, or definition text
  linksTo: string; // Identifier to link pairs, e.g., 'apple'
  power?: boolean; // Is it a power word?
  isFlipped: boolean;
  isMatched: boolean;
  isMismatched: boolean; // Temporary state for animation
}
