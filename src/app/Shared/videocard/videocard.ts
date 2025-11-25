import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-card',
  templateUrl: 'videocard.html',
  styleUrls: ['videocard.css'],
  standalone: true
})
export class VideoCardComponent implements OnInit {
  @Input() videoId!: string;
  @Input() title!: string;
  @Input() description!: string;

  safeUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const url = `https://www.youtube-nocookie.com/embed/${this.videoId}?rel=0&modestbranding=1&controls=0`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}