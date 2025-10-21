import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryPairGame } from './memory-pair-game';

describe('MemoryPairGame', () => {
  let component: MemoryPairGame;
  let fixture: ComponentFixture<MemoryPairGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryPairGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryPairGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
