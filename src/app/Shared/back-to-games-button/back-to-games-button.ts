import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-back-to-games-button',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './back-to-games-button.html',
  styleUrl: './back-to-games-button.css'
})
export class BackToGamesButton {}