import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './library.html',
  styleUrl: './library.css'
})
export class Library implements OnInit, OnDestroy {
  private players: { [key: string]: any } = {};
  private allVideoIds = [
    'tamil-video-1', 'tamil-video-2', 'tamil-video-3',
    'sinhala-video-1', 'sinhala-video-2', 'sinhala-video-3',
    'english-video-1', 'english-video-2', 'english-video-3'
  ];

  ngOnInit() {
    this.loadYouTubeAPI();
  }

  ngOnDestroy() {
    // Clean up players
    Object.values(this.players).forEach((player: any) => {
      if (player && player.destroy) {
        player.destroy();
      }
    });
  }

  private loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      this.initializePlayers();
    } else {
      // Load YouTube API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.initializePlayers();
      };
    }
  }

  private initializePlayers() {
    this.allVideoIds.forEach(videoId => {
      const iframe = document.getElementById(videoId) as HTMLIFrameElement;
      if (iframe) {
        this.players[videoId] = new window.YT.Player(videoId, {
          events: {
            'onStateChange': (event: any) => this.onPlayerStateChange(event, videoId)
          }
        });
      }
    });
  }

  private onPlayerStateChange(event: any, currentVideoId: string) {
    // If a video starts playing (state = 1), pause all other videos
    if (event.data === 1) { // Playing state
      this.pauseAllOtherVideos(currentVideoId);
    }
  }

  private pauseAllOtherVideos(currentVideoId: string) {
    this.allVideoIds.forEach(videoId => {
      if (videoId !== currentVideoId && this.players[videoId]) {
        try {
          this.players[videoId].pauseVideo();
        } catch (error) {
          console.log('Could not pause video:', videoId);
        }
      }
    });
  }
}
