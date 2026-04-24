import { Component, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { NoteListComponent } from '../note-list/note-list.component';
import { Note } from '../../models/note';
import { NoteService } from '../note.service';
import { EditorComponent } from '../editor/editor.component';

// Main component managing the split-screen layout and note editing functionality
// Handles responsive behavior with hamburger menu for mobile devices
@Component({
  standalone: false,
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements AfterViewInit {
  isNoteListVisible = true;
  isEditorVisible = false;
  activeTab = 2;
  selectedNote: Note | null = null;
  initialTab: 'raw' | 'rendered' = 'rendered';
  isMobileMenuOpen = false;

  @ViewChild(NoteListComponent) noteListComponent!: NoteListComponent;
  @ViewChild('editorSection') editorSection!: ElementRef;
  @ViewChild('splitScreen') splitScreen!: ElementRef;
  @ViewChild(EditorComponent) editorComponent!: EditorComponent;

  leftPanelWidth = 30;
  isResizing = false;
  private minWidth = 15;
  private maxWidth = 50;

 

  constructor(private noteService: NoteService) {}

  /* old
  ngAfterViewInit() {
    document.addEventListener('noteLinkClick', (event: any) => {
      const noteId = event.detail;
      this.loadNoteInEditor(noteId);
    });
    this.updatePanelWidths();
  }
    */

  ngAfterViewInit() {
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('note-link')) {
        const noteId = target.getAttribute('data-note-id');
        if (noteId) {
          this.loadNoteInEditor(noteId);
        }
      }
    });
    this.updatePanelWidths();
  }

  // Toggle mobile hamburger menu
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Close mobile menu (called from template)
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  startResize(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isResizing = true;
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onResize(event: MouseEvent | TouchEvent) {
    if (!this.isResizing) return;

    const clientX = event instanceof MouseEvent ? event.clientX : 
                   event.touches[0].clientX;
    const containerRect = this.splitScreen.nativeElement.getBoundingClientRect();
    const newWidth = (clientX - containerRect.left) / containerRect.width * 100;

    this.leftPanelWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
    this.updatePanelWidths();
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  stopResize() {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = 'default';
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updatePanelWidths();
    // Close mobile menu if resizing to larger screen
    if (window.innerWidth > 768) {
      this.isMobileMenuOpen = false;
    }
  }

  private updatePanelWidths() {
    this.leftPanelWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.leftPanelWidth));
    const splitScreen = this.splitScreen.nativeElement;
    splitScreen.style.display = 'flex';
    splitScreen.style.setProperty('--left-panel-width', `${this.leftPanelWidth}%`);
  }

  onTabSelected(index: number) {
    this.activeTab = index;
    this.selectedNote = null;
    this.isEditorVisible = false;
    if (this.noteListComponent) {
      this.noteListComponent.refresh();
    }
  }

  onNotesImported() { // 
    if (this.noteListComponent) {
      this.noteListComponent.refresh();
    }
  }

  onNotesCleared() {
    if (this.noteListComponent) {
      this.noteListComponent.refresh();
    }
    this.selectedNote = null;
    this.isEditorVisible = false;
    
    // Reset EditorComponent dropdowns
    if (this.editorComponent) {
      this.editorComponent.resetDropdowns(); // Call a new method in EditorComponent
    }
  }

  toggleEditor() {
    this.isEditorVisible = !this.isEditorVisible;
    if (this.isEditorVisible && !this.selectedNote) {
      this.initialTab = 'raw';
    }
  }

  onEditNote(event: { note: Note, tab: 'raw' | 'rendered' }) {
    this.selectedNote = { ...event.note };
    this.initialTab = event.tab;
    this.isEditorVisible = true;
    this.closeMobileMenu(); // Close menu when editing note on mobile
    this.scrollToEditor();
  }

  loadNoteInEditor(noteId: string) {
    this.noteService.getNote(noteId).subscribe(note => {
      this.selectedNote = { ...note };
      this.initialTab = 'rendered';
      this.isEditorVisible = true;
      this.closeMobileMenu(); // Close menu when loading note on mobile
      this.scrollToEditor();
    });
  }

  onNoteSaved(note: Note) {
    // Note now has the ID from the fixed service/event flow
    console.log('Note saved/created event handled in MainComponent:', note.id);
    this.selectedNote = null;
    this.isEditorVisible = false;
    
    if (this.noteListComponent) {
      console.log('MainComponent requesting NoteListComponent refresh after save/create.');
      this.noteListComponent.refresh(); // 
    }
  }

  onCancelEdit() {
    this.selectedNote = null;
    this.isEditorVisible = false;
  }

  private scrollToEditor() {
    if (this.editorSection) {
      this.editorSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
