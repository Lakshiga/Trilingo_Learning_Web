import { Injectable } from '@angular/core';

export type GameMediaType = 'success' | 'failure';

@Injectable({
  providedIn: 'root',
})
export class GameMediaService {
  private readonly successVideoPath = 'assets/Videos/mainsucess.mp4.mp4';
  private readonly failureVideoPath = 'assets/Videos/tryagain.mp4.mp4';

  getVideo(type: GameMediaType): string {
    return type === 'success' ? this.successVideoPath : this.failureVideoPath;
  }
}


