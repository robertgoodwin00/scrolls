import { FormsModule } from '@angular/forms';
import { EditorComponent } from './editor.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteService } from '../note.service';
import { of } from 'rxjs';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let noteService: NoteService;

  // Set up the testing module with necessary imports and providers
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EditorComponent],
      providers: [{ provide: NoteService, useValue: { createNote: () => of({}), updateNote: () => of({}) } }]
    }).compileComponents();

    // Create component instance and initialize required inputs
    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService);
    component.note = { title: 'Test', author: '', content: '', hashtags: [], category: 1, performing: '', props: '', setup: '', notes: '' };
    component.category = 1;
    fixture.detectChanges();
  });

  // Test component creation
  it('should create', () => {
    // Verify that the component instance is created successfully
    expect(component).toBeTruthy();
  });

  /*
  // Test text formatting with bold
  it('should format text with bold', () => {
    component.contentTextarea = { nativeElement: { selectionStart: 0, selectionEnd: 0 } } as any;
    component.onFocus(component.contentTextarea.nativeElement);
    component.formatText('bold');
    expect(component.note.content).toBe('<b></b>');
  });
  */

  // Test note saving in create mode
  it('should save note in create mode', () => {
    // Spy on noteService.createNote and simulate save
    component.mode = 'create';
    spyOn(noteService, 'createNote').and.returnValue(of({}));
    component.saveNote();
    expect(noteService.createNote).toHaveBeenCalled();
  });

  // Test note cancellation
  it('should cancel note editing', () => {
    // Spy on cancel event emission and simulate cancel
    spyOn(component.cancel, 'emit');
    component.cancelEdit();
    expect(component.cancel.emit).toHaveBeenCalled();
  });
});