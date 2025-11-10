import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FillInTheBlankGame } from './fill-in-the-blanks-game';

describe('FillInTheBlanksGame', () => {
  let component: FillInTheBlankGame;
  let fixture: ComponentFixture<FillInTheBlankGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FillInTheBlankGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FillInTheBlankGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
