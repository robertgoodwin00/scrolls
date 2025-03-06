import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '../editor/editor.component';
import { NoteService } from '../note.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNoteComponent } from './create-note.component';
import { of } from 'rxjs';

describe('CreateNoteComponent', () => {
  let component: CreateNoteComponent;
  let fixture: ComponentFixture<CreateNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [CreateNoteComponent, EditorComponent],
      providers: [{ provide: NoteService, useValue: { notifyNoteAdded: () => {}, createNote: () => of({}) } }]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNoteComponent);
    component = fixture.componentInstance;
    component.category = 1;
    fixture.detectChanges();
  });

  // Test component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test visibility toggle
  it('should toggle visibility', () => {
    component.toggleVisibility();
    expect(component.isVisible).toBeFalse();
  });

  // Test category name retrieval
  it('should get category name', () => {
    expect(component.getCategoryName(1)).toBe('Sleight');
  });

  // Test note creation handling
  it('should handle note creation', () => {
    const noteService = TestBed.inject(NoteService);
    spyOn(noteService, 'notifyNoteAdded');
    component.onNoteCreated();
    expect(component.isVisible).toBeFalse();
    expect(noteService.notifyNoteAdded).toHaveBeenCalled();
  });
});