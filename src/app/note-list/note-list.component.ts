import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NoteService } from '../note.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  standalone: false,
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css']
})
export class NoteListComponent implements OnInit, OnDestroy {
  @Input() category!: number;
  @Output() editNote = new EventEmitter<any>();
  notes: any[] = [];
  private subscription: Subscription | undefined;

  constructor(
    private noteService: NoteService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.fetchNotes();
    this.subscription = this.noteService.noteAdded$.subscribe(() => this.fetchNotes());
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  public fetchNotes() {
    this.noteService.getAllNotes().subscribe((data: any[]) => {
      this.notes = data
        .filter(note => note.category === this.category)
        .map(note => ({
          id: note.id,
          title: note.title || '',
          author: note.author || '',
          content: note.content || '',
          hashtags: note.hashtags || [],
          category: note.category,
          performing: note.performing || '',
          props: note.props || '',
          setup: note.setup || '',
          notes: note.notes || '',
          isDisplayed: false,
          isEditing: false
        }));
    });
  }
  
  handleNoteCreated(createdNote: any) {
    if (createdNote.category === this.category) {
      this.notes.push({ ...createdNote, isDisplayed: true, isEditing: false });
    }
  }

  toggleDisplay(note: any) {
    note.isDisplayed = !note.isDisplayed;
    if (note.isDisplayed) note.isEditing = false;
  }

  toggleEdit(note: any) {
    this.editNote.emit(note);
  }

  deleteNote(id: string) {
    const noteToDelete = this.notes.find(note => note.id === id);
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '300px',
      data: { title: noteToDelete?.title || '', id: id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.noteService.deleteNote(id).subscribe(() => this.fetchNotes());
      }
    });
  }

  searchNotes(query: string, searchInContent: boolean) {
    this.noteService.searchNotes(query, searchInContent, this.category).subscribe(notes => this.notes = notes);
  }

  filterByHashtag(tag: string) {
    this.noteService.getNotesByHashtag(tag).subscribe(notes => this.notes = notes);
  }

  saveEdit(updatedNote: any) {
    const index = this.notes.findIndex(note => note.id === updatedNote.id);
    if (index !== -1) {
      this.notes[index] = { ...updatedNote, isDisplayed: true, isEditing: false };
    }
  }

  cancelEdit(note: any) {
    note.isEditing = false;
  }

  viewNote(id: string) {
    this.router.navigate(['/note', id]);
  }

  getCategoryName(category: number): string {
    const names = ['Sleight', 'Trick', 'Routine', 'Act'];
    return names[category - 1];
  }
}