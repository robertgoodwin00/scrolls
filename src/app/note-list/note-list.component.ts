import { Component, OnDestroy, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { NoteService } from '../note.service';
import { Router } from '@angular/router';
import { Subject, Subscription, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { BackReferencesService } from '../back-reference.service';

@Component({
  standalone: false,
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css']
})
export class NoteListComponent implements OnInit, OnDestroy {
  @Input() category!: number;
  @Output() editNote = new EventEmitter<{ note: any, tab: 'raw' | 'rendered' }>();
  notes: any[] = [];
  //private subscription: Subscription | undefined;
  @ViewChild('noteListContainer', { static: false }) noteListContainer!: ElementRef;
  private newlyCreatedNoteId: string | null = null;

  private fetchTrigger$ = new Subject<void>();
  private subscription!: Subscription;

   public refresh() {
    this.fetchTrigger$.next();
  }

  constructor(
    private noteService: NoteService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef, // Add ChangeDetectorRef
    private backReferencesService: BackReferencesService
  ) {}

  ngOnInit() {
    this.subscription = this.fetchTrigger$
      .pipe(
        switchMap(() => this.noteService.getNotesByCategory(this.category))
      )
      .subscribe((data: any[]) => {
        this.processNotes(data);
      });

    // Initial load
    this.fetchTrigger$.next();

    // When a note is added → trigger reload
    this.noteService.noteAdded$.subscribe((newNoteId: string | null) => {
      this.newlyCreatedNoteId = newNoteId;
      this.fetchTrigger$.next();
    });
  }

  ngAfterViewInit() {
    console.log('Note list container initialized:', this.noteListContainer); // Debug log
  }

  ngOnChanges() {
    this.fetchTrigger$.next();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private processNotes(data: any[]) {
    const defaultNote = {
      title: '',
      author: '',
      content: '',
      hashtags: [],
      performing: '',
      props: '',
      setup: '',
      notes: '',
      isDisplayed: false,
      isEditing: false
    };

    this.notes = data
      .map(note => ({ ...defaultNote, ...note }))
      .sort((a, b) => {
        const getIdNumber = (id: string) => {
          const match = id.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        };
        return getIdNumber(b.id) - getIdNumber(a.id);
      });

    this.cdr.detectChanges();

    if (this.newlyCreatedNoteId) {
      setTimeout(() => {
        this.scrollToNote(this.newlyCreatedNoteId!);
        this.newlyCreatedNoteId = null;
      }, 0);
    }
  }

  private scrollToNote(noteId: string) {
    if (!this.noteListContainer) {
      console.warn('Note list container not found');
      return;
    }

    // Wait for next tick to ensure DOM is fully updated
    setTimeout(() => {
      const container = this.noteListContainer.nativeElement;
      const noteElement = container.querySelector(`[data-note-id="${noteId}"]`);
      if (noteElement) {
        console.log('Found note element, scrolling to:', noteId);
        if ('scrollBehavior' in document.documentElement.style) {
          noteElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          noteElement.scrollIntoView(true);
        }
        noteElement.classList.add('highlight');
        setTimeout(() => noteElement.classList.remove('highlight'), 2000);
      } else {
        console.warn('Could not find note element with ID:', noteId);
        //console.log('Available note IDs:', Array.from(container.querySelectorAll('[data-note-id]'))
        //  .map((el: HTMLElement) => el.getAttribute('data-note-id')));
      }
    }, 100); // Increased timeout to ensure DOM is ready
  }

  toggleDisplay(note: any) {
    note.isDisplayed = !note.isDisplayed;
    if (note.isDisplayed) note.isEditing = false;
  }

  toggleEdit(note: any) {
    this.editNote.emit({ note, tab: 'raw' }); // Emit with tab 'raw' for edit button
  }

  /*
  deleteNote(id: string) {
    const noteToDelete = this.notes.find(note => note.id === id);
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '300px',
      data: { title: noteToDelete?.title || '', id: id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.noteService.deleteNote(id).subscribe(() => {
          this.fetchTrigger$.next();
        });
      }
    });
  }
    */


  // the check for backreferences is currently broken
  deleteNote(id: string) {
    const noteToDelete = this.notes.find(note => note.id === id);
    
    // Check for back-references first
    this.backReferencesService.getBackReferences(id).subscribe((references: any[]) => {
      let confirmMessage = `Are you sure you want to delete "${noteToDelete?.title || id}"?`;
      
      if (references.length > 0) {
        confirmMessage += `\n\nWarning: This note is referenced by ${references.length} other note(s). ` +
                        'Deleting it will create broken links in:\n' +
                        references.slice(0, 5).map(r => `- ${r.title || r.id}`).join('\n');
        
        if (references.length > 5) {
          confirmMessage += `\n...and ${references.length - 5} more`;
        }
      }
      
      const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
        width: '400px',
        data: { 
          title: noteToDelete?.title || '', 
          id: id,
          message: confirmMessage,
          hasReferences: references.length > 0
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.noteService.deleteNote(id).subscribe(() => {
            this.fetchTrigger$.next();
          });
        }
      });
    });
  }


  searchNotes(query: string, searchInContent: boolean) {
    this.noteService.searchNotes(query, searchInContent, this.category).subscribe(notes => {
      // Apply the same sorting logic
      this.notes = notes.sort((a, b) => {
        const getIdNumber = (id: string) => {
          const match = id.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        };
        return getIdNumber(b.id!) - getIdNumber(a.id!);
      });
    });
  }

  filterByHashtag(tag: string) {
    this.noteService.getNotesByHashtag(tag).subscribe(notes => {
      // Apply the same sorting logic
      this.notes = notes.sort((a, b) => {
        const getIdNumber = (id: string) => {
          const match = id.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        };
        return getIdNumber(b.id!) - getIdNumber(a.id!);
      });
    });
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

  viewNote(note: any) {
    this.editNote.emit({ note, tab: 'rendered' }); // Emit with tab 'rendered' for title click
  }

  getCategoryName(category: number): string {
    const names = ['General', 'Sleight', 'Trick', 'Routine', 'Act'];
    return names[category];
  }
}