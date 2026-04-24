import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '../editor/editor.component';
import { NoteService } from '../note.service';
import { SanitizationService } from '../sanitization.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNoteComponent } from './create-note.component';
import { of } from 'rxjs';
import { Note } from '../../models/note';

describe('CreateNoteComponent', () => {
  let component: CreateNoteComponent;
  let fixture: ComponentFixture<CreateNoteComponent>;
  let noteService: jasmine.SpyObj<NoteService>;

  beforeEach(async () => {
    // Create a spy object for NoteService with all required methods
    const noteServiceSpy = jasmine.createSpyObj('NoteService', [
      'createNote',
      'notifyNoteAdded',
      'getAllNotes', // Add this method to the spy
    ]);

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [CreateNoteComponent, EditorComponent],
      providers: [
        { provide: NoteService, useValue: noteServiceSpy },
        {
          provide: SanitizationService,
          useValue: {
            sanitizeNote: jasmine.createSpy('sanitizeNote').and.returnValue(
              Promise.resolve({
                safeTitle: '',
                safeAuthor: '',
                safeContent: '',
                safePerforming: '',
                safeProps: '',
                safeSetup: '',
                safeNotes: '',
              })
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNoteComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;

    // Mock getAllNotes to return an empty array or some test data
    noteService.getAllNotes.and.returnValue(of([])); // Adjust this based on your needs

    component.category = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle visibility', () => {
    expect(component.isVisible).toBeTrue();
    component.toggleVisibility();
    expect(component.isVisible).toBeFalse();
  });

  it('should get category name', () => {
    expect(component.getCategoryName(1)).toBe('Sleight');
  });

  it('should handle note creation and emit save event', () => {
    const testNote: Note = {
      title: 'Test Note',
      author: 'Test Author',
      content: 'Test Content',
      hashtags: [],
      category: 1,
      performing: '',
      props: '',
      setup: '',
      notes: '',
    };

    noteService.createNote.and.returnValue(of(testNote));
    spyOn(component.save, 'emit');

    component.onNoteCreated(testNote);

    expect(noteService.createNote).toHaveBeenCalledWith(testNote);
    expect(component.save.emit).toHaveBeenCalledWith(testNote);
    expect(component.isVisible).toBeFalse();
  });
});