import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [TranslateModule,RouterLink],
  templateUrl: './games.html',
  styleUrl: './games.css'
})
export class Games {

}
