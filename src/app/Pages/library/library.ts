import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { VideoCardComponent } from '../../videocard/videocard'; 

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [TranslateModule, CommonModule, VideoCardComponent],
  templateUrl: './library.html',
  styleUrls: ['./library.css']
})
export class Library {

  tamilVideos = [
    { id: 'QNYB7Tsb880', title: 'LIBRARY.TAMIL_VIDEO_1.TITLE', description: 'LIBRARY.TAMIL_VIDEO_1.DESCRIPTION' },
    { id: 'hVajuTFFqKA', title: 'LIBRARY.TAMIL_VIDEO_2.TITLE', description: 'LIBRARY.TAMIL_VIDEO_2.DESCRIPTION' },
    { id: 'EaRl0KZNEdQ', title: 'LIBRARY.TAMIL_VIDEO_3.TITLE', description: 'LIBRARY.TAMIL_VIDEO_3.DESCRIPTION' }
  ];

  sinhalaVideos = [
    { id: '3idE6NKcPDA', title: 'LIBRARY.SINHALA_VIDEO_1.TITLE', description: 'LIBRARY.SINHALA_VIDEO_1.DESCRIPTION' },
    { id: 'w8b1-60UZZk', title: 'LIBRARY.SINHALA_VIDEO_2.TITLE', description: 'LIBRARY.SINHALA_VIDEO_2.DESCRIPTION' },
    { id: 'NLUW7LrcU48', title: 'LIBRARY.SINHALA_VIDEO_3.TITLE', description: 'LIBRARY.SINHALA_VIDEO_3.DESCRIPTION' }
  ];

  englishVideos = [
    { id: 'ccEpTTZW34g', title: 'LIBRARY.ENGLISH_VIDEO_1.TITLE', description: 'LIBRARY.ENGLISH_VIDEO_1.DESCRIPTION' },
    { id: 'XqZsoesa55w', title: 'LIBRARY.ENGLISH_VIDEO_2.TITLE', description: 'LIBRARY.ENGLISH_VIDEO_2.DESCRIPTION' },
    { id: 'Zu6o23Pu0Do', title: 'LIBRARY.ENGLISH_VIDEO_3.TITLE', description: 'LIBRARY.ENGLISH_VIDEO_3.DESCRIPTION' }
  ];

}