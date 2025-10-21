import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FillInTheBlanksGame } from './fill-in-the-blanks-game';

describe('FillInTheBlanksGame', () => {
  let component: FillInTheBlanksGame;
  let fixture: ComponentFixture<FillInTheBlanksGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FillInTheBlanksGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FillInTheBlanksGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
