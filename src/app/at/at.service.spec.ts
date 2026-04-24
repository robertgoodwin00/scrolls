import { TestBed } from '@angular/core/testing';

import { atService } from './at.service';

describe('AtService', () => {
  let service: atService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(atService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
