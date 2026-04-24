import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewNoteComponent } from './view-note.component';
import { NoteService } from '../note.service';
import { SanitizationService } from '../sanitization.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Note } from '../../models/note';

describe('ViewNoteComponent', () => {
  let component: ViewNoteComponent;
  let fixture: ComponentFixture<ViewNoteComponent>;
  let noteService: jasmine.SpyObj<NoteService>;
  let sanitizationService: jasmine.SpyObj<SanitizationService>;

  beforeEach(async () => {
    const noteServiceSpy = jasmine.createSpyObj('NoteService', ['getNote']);
    const sanitizationServiceSpy = jasmine.createSpyObj('SanitizationService', ['sanitizeNote']);
    const activatedRouteStub = {
      params: of({ id: '1' }),
    };

    await TestBed.configureTestingModule({
      declarations: [ViewNoteComponent],
      providers: [
        { provide: NoteService, useValue: noteServiceSpy },
        { provide: SanitizationService, useValue: sanitizationServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewNoteComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;
    sanitizationService = TestBed.inject(SanitizationService) as jasmine.SpyObj<SanitizationService>;

    const mockNote: Note = {
      id: '1',
      title: 'Test Note',
      author: 'Test Author',
      content: 'Test Content',
      category: 0,
      performing: '',
      props: '',
      setup: '',
      notes: '',
    };
    noteService.getNote.and.returnValue(of(mockNote));
    sanitizationService.sanitizeNote.and.returnValue(
      Promise.resolve({
        safeTitle: 'Safe Title',
        safeAuthor: 'Safe Author',
        safeContent: 'Safe Content',
        safePerforming: '',
        safeProps: '',
        safeSetup: '',
        safeNotes: '',
      })
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sanitize note fields on init', async () => {
    await fixture.whenStable(); // Wait for async operations
    expect(component.safeTitle).toBeDefined();
    expect(component.safeAuthor).toBeDefined();
  });
});