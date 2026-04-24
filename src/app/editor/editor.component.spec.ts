import { FormsModule } from '@angular/forms';
import { EditorComponent } from './editor.component';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoteService } from '../note.service';
import { SanitizationService } from '../sanitization.service';
import { of } from 'rxjs';
import { Note } from '../../models/note';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let noteService: jasmine.SpyObj<NoteService>;
  let sanitizationService: jasmine.SpyObj<SanitizationService>;

  beforeEach(async () => {
    const noteServiceSpy = jasmine.createSpyObj('NoteService', ['createNote', 'updateNote', 'getAllNotes']);
    const sanitizationServiceSpy = jasmine.createSpyObj('SanitizationService', ['sanitizeNote']);

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EditorComponent],
      providers: [
        { provide: NoteService, useValue: noteServiceSpy },
        { provide: SanitizationService, useValue: sanitizationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;
    sanitizationService = TestBed.inject(SanitizationService) as jasmine.SpyObj<SanitizationService>;

    noteService.getAllNotes.and.returnValue(
      of([
        { id: '1', title: 'General Note', category: 0, author: '', content: '', hashtags: [], performing: '', props: '', setup: '', notes: '' },
        { id: '2', title: 'Sleight Note', category: 1, author: '', content: '', hashtags: [], performing: '', props: '', setup: '', notes: '' },
      ])
    );

    sanitizationService.sanitizeNote.and.returnValue(
      Promise.resolve({
        safeTitle: 'Safe Test',
        safeAuthor: 'Safe Author',
        safeContent: 'Safe Content',
        safePerforming: '',
        safeProps: '',
        safeSetup: '',
        safeNotes: '',
      })
    );

    component.note = {
      title: 'Test',
      author: '',
      content: '',
      hashtags: [],
      category: 1,
      performing: '',
      props: '',
      setup: '',
      notes: '',
    };
    component.category = 1;
    component.mode = 'create';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty note in create mode', () => {
    component.note = undefined as any;
    component.ngOnInit();
    expect(component.note).toBeDefined();
    expect(component.note.title).toBe('');
    expect(component.note.category).toBe(1);
    expect(component.activeTab).toBe('raw');
  });

  it('should initialize with provided note in edit mode', () => {
    component.mode = 'edit';
    component.initialTab = 'rendered';
    component.note = { id: '1', title: 'Edit Note', author: 'Author', content: 'Content', hashtags: ['tag'], category: 1, performing: '', props: '', setup: '', notes: '' };
    component.ngOnInit();
    expect(component.activeTab).toBe('rendered');
    expect(component.hashtagInput).toBe('tag');
  });

  it('should emit save event in create mode', () => {
    spyOn(component.save, 'emit');
    const expectedNote = { ...component.note };
    component.saveNote();
    expect(component.save.emit).toHaveBeenCalledWith(expectedNote);
    expect(noteService.createNote).not.toHaveBeenCalled();
    expect(component.note.title).toBe('');
  });

  it('should update note in edit mode', fakeAsync(() => {
    component.mode = 'edit';
    component.note.id = '1';
    noteService.updateNote.and.returnValue(of({}));
    spyOn(component.save, 'emit');
    component.saveNote();
    tick();
    expect(noteService.updateNote).toHaveBeenCalledWith(component.note);
    expect(component.save.emit).toHaveBeenCalledWith({ ...component.note, isDisplayed: true, isEditing: false });
  }));

  it('should cancel note editing', () => {
    spyOn(component.cancel, 'emit');
    component.cancelEdit();
    expect(component.cancel.emit).toHaveBeenCalled();
    expect(component.note.title).toBe('');
  });

  it('should convert hashtags to array', () => {
    component.hashtagInput = 'tag1, tag2, tag3';
    component.convertHashtagsToArray(component.hashtagInput);
    expect(component.note.hashtags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should switch to rendered tab and update view', fakeAsync(() => {
    component.selectTab('rendered');
    tick();
    expect(component.activeTab).toBe('rendered');
    expect(component.safeTitle).toBe('Safe Test');
  }));

  it('should format text with bold', fakeAsync(() => {
    fixture.detectChanges();
    const textarea = component.contentTextarea.nativeElement;
    textarea.value = 'Hello';
    textarea.dispatchEvent(new Event('focus'));
    textarea.setSelectionRange(0, 5);
    component.formatText('bold');
    tick();
    expect(component.note.content).toBe('<b>Hello</b>'); // Fixed expectation
  }));

  it('should insert note tag into content', fakeAsync(() => {
    fixture.detectChanges();
    const textarea = component.contentTextarea.nativeElement;
    textarea.value = 'Text ';
    textarea.dispatchEvent(new Event('focus'));
    textarea.setSelectionRange(5, 5);
    component.insertNoteTag({ target: { value: '1' } } as any);
    tick();
    expect(component.note.content).toBe('Text <1>'); // Fixed expectation
  }));

  it('should insert trump suit symbol', fakeAsync(() => {
    fixture.detectChanges();
    const textarea = component.contentTextarea.nativeElement;
    textarea.value = 'Suit ';
    textarea.dispatchEvent(new Event('focus'));
    textarea.setSelectionRange(5, 5);
    component.insertTrumpSuit('spade');
    tick();
    expect(component.note.content).toBe('Suit <spade>'); // Fixed expectation
  }));

  it('should load notes into dropdowns', () => {
    component.ngOnInit();
    expect(component.generalNotes.length).toBe(1);
    expect(component.sleightNotes.length).toBe(1);
    expect(component.trickNotes.length).toBe(0);
  });

  it('should update note category in create mode', fakeAsync(() => {
    component.mode = 'create';
    component.category = 2;
    component.ngOnChanges({ category: { currentValue: 2, previousValue: 1, firstChange: false, isFirstChange: () => false } } as any);
    tick();
    expect(component.note.category).toBe(2);
  }));

  it('should update active tab when note changes', fakeAsync(() => {
    component.initialTab = 'rendered';
    component.ngOnChanges({ note: { currentValue: { ...component.note }, previousValue: null, firstChange: false, isFirstChange: () => false } } as any);
    tick();
    expect(component.activeTab).toBe('rendered');
    expect(component.safeTitle).toBe('Safe Test');
  }));

  it('should reset dropdowns', () => {
    component.ngOnInit();
    component.resetDropdowns();
    expect(component.generalNotes.length).toBe(0);
    expect(component.sleightNotes.length).toBe(0);
  });
});