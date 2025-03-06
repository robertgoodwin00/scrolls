import { TestBed } from '@angular/core/testing';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { of } from 'rxjs';
import { NoteService } from './note.service';

describe('NoteService', () => {
  let service: NoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgxIndexedDBService,
          useValue: {
            getAll: () => of([]),
            getByKey: () => of({}),
            add: () => of({}),
            update: () => of({}),
            delete: () => of({}),
            count: () => of(0)
          }
        }
      ]
    });
    service = TestBed.inject(NoteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


