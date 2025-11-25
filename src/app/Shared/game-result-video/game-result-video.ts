import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameStatusMessagesService } from '../../services/game-status-messages.service';
import { GameMediaService } from '../../services/game-media.service';

@Component({
  selector: 'app-game-result-video',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './game-result-video.html',
  styleUrl: './game-result-video.css',
})
export class GameResultVideoComponent {
  private readonly statusService = inject(GameStatusMessagesService);
  private readonly mediaService = inject(GameMediaService);

  readonly shouldShow = computed(() => {
    const outcome = this.statusService.outcome();
    return outcome === 'success' || outcome === 'failure';
  });

  readonly videoSrc = computed(() => {
    const outcome = this.statusService.outcome();
    if (outcome === 'success') {
      return this.mediaService.getVideo('success');
    }
    if (outcome === 'failure') {
      return this.mediaService.getVideo('failure');
    }
    return null;
  });

  readonly headline = this.statusService.headline;
  readonly description = this.statusService.description;

  handleVideoEnd(): void {
    this.statusService.reset();
  }
}


