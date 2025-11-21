import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackToGamesButton } from './back-to-games-button';

describe('BackToGamesButton', () => {
  let component: BackToGamesButton;
  let fixture: ComponentFixture<BackToGamesButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackToGamesButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackToGamesButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
