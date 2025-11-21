import { TestBed } from '@angular/core/testing';

import { Completion } from './completion';

describe('Completion', () => {
  let service: Completion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Completion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
