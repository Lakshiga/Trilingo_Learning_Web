import { Injectable, signal } from '@angular/core';
import { GameItem } from '../game_model';

@Injectable({
  providedIn: 'root'
})
export class WordMatchService {

  private readonly gameData: GameItem[] = [
    { id: 1, word: 'Apple', imageUrl: 'assets/images/apple.png', description: 'A red apple on a table' },
    { id: 2, word: 'Car', imageUrl: 'assets/images/car.png', description: 'A sleek, modern sports car' },
    { id: 3, word: 'Book', imageUrl: 'assets/images/book.png', description: 'An old, open book with worn pages' },
    { id: 4, word: 'Sun', imageUrl: 'assets/images/sun.png', description: 'A bright, shining sun in a clear sky' },
    { id: 5, word: 'Tree', imageUrl: 'assets/images/tree.png', description: 'A large, green oak tree in a field' },
  
];

getGameItems() {
  return signal(this.gameData);
}

}



