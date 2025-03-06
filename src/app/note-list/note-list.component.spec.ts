import { RouterTestingModule } from '@angular/router/testing';
import { NoteService } from '../note.service';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteListComponent } from './note-list.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ViewNoteComponent } from '../view-note/view-note.component';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '../editor/editor.component';
import { Note } from '../../models/note';


describe('NoteListComponent', () => {
  let component: NoteListComponent;
  let fixture: ComponentFixture<NoteListComponent>;
  let noteService: NoteService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, RouterModule.forRoot([])],
      declarations: [NoteListComponent, ViewNoteComponent, EditorComponent],
      providers: [
        { provide: NoteService, useValue: { getAllNotes: () => of([]), noteAdded$: of(), deleteNote: () => of({}), searchNotes: () => of([]), getNotesByHashtag: () => of([]) } },
        { provide: NgxIndexedDBService, useValue: { getAll: () => of([]), count: () => of(0) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NoteListComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService);
    router = TestBed.inject(Router);
    component.category = 1;
    fixture.detectChanges();
  });

  // Test component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test fetching notes on initialization
  it('should fetch notes on init', () => {
    const mockNote: Note = {
      id: '1',
      title: 'Test',
      author: 'Author',
      content: 'Content',
      category: 1,
      performing: '',
      props: '',
      setup: '',
      notes: '',
      hashtags: []
    };
    spyOn(noteService, 'getAllNotes').and.returnValue(of([mockNote]));
    component.ngOnInit();
    expect(component.notes.length).toBe(1);
    expect(component.notes[0].title).toBe('Test');
  });
  
  // Test note display toggle
  it('should toggle note display', () => {
    const note = { id: '1', isDisplayed: false, isEditing: false };
    component.toggleDisplay(note);
    expect(note.isDisplayed).toBeTrue();
  });

  // Test note edit toggle
  it('should toggle note edit', () => {
    const note = { id: '1', isDisplayed: false, isEditing: false };
    component.toggleEdit(note);
    expect(note.isEditing).toBeTrue();
  });

  // Test note deletion
  it('should delete note', () => {
    spyOn(noteService, 'deleteNote').and.returnValue(of({}));
    spyOn(component, 'fetchNotes');
    component.deleteNote('1');
    expect(noteService.deleteNote).toHaveBeenCalledWith('1');
    expect(component.fetchNotes).toHaveBeenCalled();
  });

  // Test note search
  it('should search notes', () => {
    spyOn(noteService, 'searchNotes').and.returnValue(of([]));
    component.searchNotes('test', false);
    expect(noteService.searchNotes).toHaveBeenCalledWith('test', false, 1);
  });

  // Test hashtag filtering
  it('should filter by hashtag', () => {
    spyOn(noteService, 'getNotesByHashtag').and.returnValue(of([]));
    component.filterByHashtag('tag');
    expect(noteService.getNotesByHashtag).toHaveBeenCalledWith('tag');
  });
});


