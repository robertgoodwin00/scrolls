import { TestBed } from '@angular/core/testing';

import { BackReferenceService } from './back-reference.service';

describe('BackReferenceService', () => {
  let service: BackReferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackReferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
