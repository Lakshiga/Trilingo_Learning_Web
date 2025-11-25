import { Injectable, signal } from '@angular/core';

export type GameOutcome = 'none' | 'success' | 'partial' | 'failure';

@Injectable({
  providedIn: 'root',
})
export class GameStatusMessagesService {
  // generic game status that components can bind to
  readonly outcome = signal<GameOutcome>('none');
  readonly headline = signal<string>('');
  readonly description = signal<string>('');

  reset(): void {
    this.outcome.set('none');
    this.headline.set('');
    this.description.set('');
  }

  setSuccess(headline: string, description: string): void {
    this.outcome.set('success');
    this.headline.set(headline);
    this.description.set(description);
  }

  setPartial(headline: string, description: string): void {
    this.outcome.set('partial');
    this.headline.set(headline);
    this.description.set(description);
  }

  setFailure(headline: string, description: string): void {
    this.outcome.set('failure');
    this.headline.set(headline);
    this.description.set(description);
  }
}


