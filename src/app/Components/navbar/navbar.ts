import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './navbar.html',
})
export class Navbar {
  isMenuOpen = false;
  isLangMenuOpen = false;
  selectedLanguage = 'English';
  private hideTimeout: any = null;
  isDarkMode = false;

  languages = [
    { code: 'en', name: 'English', displayName: 'English' },
    { code: 'ta', name: 'Tamil', displayName: 'தமிழ்' },
    { code: 'si', name: 'Sinhala', displayName: 'සිංහල' },
  ];

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.initializeTheme();
  }


  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  toggleLanguageMenu() {
    this.isLangMenuOpen = !this.isLangMenuOpen;
  }

  showLanguageMenu() {
    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.isLangMenuOpen = true;
  }

  hideLanguageMenu() {
    // Add a delay before hiding the menu
    this.hideTimeout = setTimeout(() => {
      this.isLangMenuOpen = false;
    }, 300); // 300ms delay
  }

  keepLanguageMenuOpen() {
    // Clear timeout when hovering over the dropdown itself
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  setLanguage(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    this.selectedLanguage = lang ? lang.displayName : 'English';
    this.translate.use(langCode);
    this.isLangMenuOpen = false;
  }

  onLanguageSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const langCode = select.value;
    this.setLanguage(langCode);
  }

  // Theme handling
  private initializeTheme(): void {
    const saved = localStorage.getItem('theme');
    this.isDarkMode = saved === 'dark';
    this.applyThemeClass();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyThemeClass();
  }

  private applyThemeClass(): void {
    const root = document.documentElement;
    if (this.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
