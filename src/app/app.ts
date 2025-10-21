import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './Components/footer/footer';
import { Navbar } from './Components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Footer, RouterOutlet,Navbar],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('TriLingo_Learning_App_GuestPage');
}
