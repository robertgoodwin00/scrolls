import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteListComponent } from './note-list.component';
import { NoteService } from '../note.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { Note } from '../../models/note';
import { ChangeDetectorRef } from '@angular/core';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';

describe('NoteListComponent', () => {
  let component: NoteListComponent;
  let fixture: ComponentFixture<NoteListComponent>;
  let noteService: jasmine.SpyObj<NoteService>;
  let router: jasmine.SpyObj<Router>;
  let dialog: MatDialog;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    const noteServiceSpy = jasmine.createSpyObj('NoteService', [
      'getAllNotes',
      'deleteNote',
      'searchNotes',
      'getNotesByHashtag',
    ], { noteAdded$: new Subject<string | null>() }); // Mock noteAdded$ as a Subject
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      declarations: [NoteListComponent],
      imports: [MatDialogModule],
      providers: [
        { provide: NoteService, useValue: noteServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy },
        MatDialog,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteListComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    dialog = TestBed.inject(MatDialog);
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;

    // Default mocks
    component.category = 0;
    noteService.getAllNotes.and.returnValue(of([]));
  });

  it('should create', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(component).toBeTruthy();
  });

  it('should fetch notes on init', () => {
    const mockNotes: Note[] = [
      { id: '1', title: 'Test', author: 'Me', content: 'Stuff', category: 0, performing: '', props: '', setup: '', notes: '' },
    ];
    noteService.getAllNotes.and.returnValue(of(mockNotes));
    fixture.detectChanges(); // Trigger ngOnInit
    expect(noteService.getAllNotes).toHaveBeenCalled();
    expect(component.notes.length).toBe(1);
    expect(component.notes[0].isDisplayed).toBeFalse();
    expect(component.notes[0].isEditing).toBeFalse();
  });

  it('should toggle note edit', () => {
    const note = { id: '1', isEditing: false, isDisplayed: true };
    spyOn(component.editNote, 'emit');
    component.toggleEdit(note);
    expect(component.editNote.emit).toHaveBeenCalledWith({ note, tab: 'raw' });
  });

  it('should delete note', async () => {
    const mockNotes: Note[] = [
      { id: '1', title: 'Test', author: 'Me', content: 'Stuff', category: 0, performing: '', props: '', setup: '', notes: '' },
    ];
    noteService.getAllNotes.and.returnValue(of(mockNotes));
    noteService.deleteNote.and.returnValue(of(undefined));

    spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(true), // Simulate user confirming deletion
    } as any);

    fixture.detectChanges(); // Init component
    component.deleteNote('1');
    await fixture.whenStable(); // Wait for async dialog

    expect(dialog.open).toHaveBeenCalledWith(DeleteConfirmationDialogComponent, {
      width: '300px',
      data: { title: 'Test', id: '1' },
    });
    expect(noteService.deleteNote).toHaveBeenCalledWith('1');
    expect(noteService.getAllNotes).toHaveBeenCalledTimes(2); // Once on init, once after delete
  });

  // Extra test: Toggle display
  it('should toggle note display', () => {
    const note = { id: '1', isDisplayed: false, isEditing: true };
    component.toggleDisplay(note);
    expect(note.isDisplayed).toBeTrue();
    expect(note.isEditing).toBeFalse(); // Should reset editing when displayed
  });

  // Extra test: Search notes
  it('should search notes', () => {
    const mockNotes: Note[] = [
      { id: '1', title: 'Test', author: 'Me', content: 'Stuff', category: 0, performing: '', props: '', setup: '', notes: '' },
    ];
    noteService.searchNotes.and.returnValue(of(mockNotes));
    component.searchNotes('test', true);
    expect(noteService.searchNotes).toHaveBeenCalledWith('test', true, 0);
    expect(component.notes).toEqual(mockNotes);
  });
});