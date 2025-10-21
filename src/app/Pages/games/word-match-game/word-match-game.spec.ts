import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordMatchGame } from './word-match-game';

describe('WordMatchGame', () => {
  let component: WordMatchGame;
  let fixture: ComponentFixture<WordMatchGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordMatchGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordMatchGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
