import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceRepeatGame } from './voice-repeat-game';

describe('VoiceRepeatGame', () => {
  let component: VoiceRepeatGame;
  let fixture: ComponentFixture<VoiceRepeatGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceRepeatGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceRepeatGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
