import { TestBed } from '@angular/core/testing';
import { SanitizationService } from './sanitization.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoteService } from './note.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Note } from '../models/note';

describe('SanitizationService', () => {
  let service: SanitizationService;
  let noteService: jasmine.SpyObj<NoteService>;
  let sanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(() => {
    const noteServiceSpy = jasmine.createSpyObj('NoteService', ['isValidNoteId', 'getNoteTitle']);
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Provide HttpClient for NoteService
      providers: [
        SanitizationService,
        { provide: NoteService, useValue: noteServiceSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy },
      ],
    });

    service = TestBed.inject(SanitizationService);
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;
    sanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;

    // Default mocks
    noteService.isValidNoteId.and.returnValue(true);
    noteService.getNoteTitle.and.returnValue(of('Test Title'));
    sanitizer.bypassSecurityTrustHtml.and.callFake((html: string) => html as SafeHtml);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sanitize content with replacements', async () => {
    const content = 'Hello <spade> and <heart>';
    const result = await service.sanitizeContent(content);

    expect(result).toBe('Hello <span style="color: black">♠</span> and <span style="color: red">♥</span>');
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
      'Hello <span style="color: black">♠</span> and <span style="color: red">♥</span>'
    );
  });

  it('should sanitize note ID tags with links', async () => {
    const content = 'See <r123>';
    const result = await service.sanitizeContent(content);

    expect(noteService.isValidNoteId).toHaveBeenCalledWith('r123');
    expect(noteService.getNoteTitle).toHaveBeenCalledWith('r123');
    expect(result).toContain('<span style="color: blue; text-decoration: underline; cursor: pointer;"');
    expect(result).toContain('Test Title');
  });

  it('should sanitize a note object', async () => {
    const note: Note = {
      id: '1',
      title: 'Test <spade>',
      author: 'Author',
      content: 'Content <heart>',
      category: 0,
      performing: '',
      props: '',
      setup: '',
      notes: '',
    };

    const result = await service.sanitizeNote(note);

    expect(result['safeTitle']).toBe('Test <span style="color: black">♠</span>');
    expect(result['safeAuthor']).toBe('Author');
    expect(result['safeContent']).toBe('Content <span style="color: red">♥</span>');
    expect(result['safePerforming']).toBe('');
    expect(result['safeProps']).toBe('');
    expect(result['safeSetup']).toBe('');
    expect(result['safeNotes']).toBe('');
  });
});