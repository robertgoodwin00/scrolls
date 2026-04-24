import { TestBed } from '@angular/core/testing';
import { SyncService } from './sync.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoteService } from './note.service';
import { of } from 'rxjs';
import { Note } from '../models/note';
import { environment } from './environments/environment';

describe('SyncService', () => {
  let service: SyncService;
  let httpMock: HttpTestingController;
  let noteService: jasmine.SpyObj<NoteService>;

  beforeEach(() => {
    const noteServiceSpy = jasmine.createSpyObj('NoteService', ['getAllNotes', 'updateNote']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Provide HttpClient and testing utilities
      providers: [
        SyncService,
        { provide: NoteService, useValue: noteServiceSpy },
      ],
    });

    service = TestBed.inject(SyncService);
    httpMock = TestBed.inject(HttpTestingController);
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;

    // Default mocks
    noteService.getAllNotes.and.returnValue(of([]));
    noteService.updateNote.and.returnValue(of({} as Note));
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no pending HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export notes to the server', () => {
    const mockNotes: Note[] = [
      { id: '1', title: 'Test', author: 'Author', content: 'Content', category: 0, performing: '', props: '', setup: '', notes: '' },
    ];
    noteService.getAllNotes.and.returnValue(of(mockNotes));

    service.exportNotes('testPass').subscribe(response => {
      expect(response).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notes/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      password: 'testPass',
      notes: [
        {
          id: '1',
          title: 'Test',
          author: 'Author',
          content: 'Content',
          hashtags: [],
          category: 0,
          performing: null,
          props: null,
          setup: null,
          notes: null,
        },
      ],
    });
    req.flush({ success: true });
  });

  it('should import notes from the server and update locally', () => {
    const serverNotes: Note[] = [
      { id: '2', title: 'Imported', author: 'Author2', content: 'Content2', category: 1, performing: '', props: '', setup: '', notes: '' },
    ];
    const updatedNotes: Note[] = [
      { id: '2', title: 'Imported', author: 'Author2', content: 'Content2', category: 1, performing: '', props: '', setup: '', notes: '' },
    ];

    noteService.getAllNotes.and.returnValue(of(updatedNotes));

    service.importNotes('testPass').subscribe(notes => {
      expect(notes).toEqual(updatedNotes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/notes/download`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'testPass' });
    req.flush(serverNotes);

    expect(noteService.updateNote).toHaveBeenCalledWith(serverNotes[0]);
    expect(noteService.getAllNotes).toHaveBeenCalled();
  });
});