import { Component, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { NoteListComponent } from '../note-list/note-list.component';
import { Note } from '../../models/note';
import { NoteService } from '../note.service';

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
  initialTab: 'raw' | 'rendered' = 'raw'; // New property to control initial tab

  @ViewChild(NoteListComponent) noteListComponent!: NoteListComponent;
  @ViewChild('editorSection') editorSection!: ElementRef;

  constructor(private noteService: NoteService) {}

  ngAfterViewInit() {
    document.addEventListener('noteLinkClick', (event: any) => {
      const noteId = event.detail;
      this.loadNoteInEditor(noteId);
    });
  }

  onTabSelected(index: number) {
    this.activeTab = index + 1;
    this.selectedNote = null;
    this.isEditorVisible = false;
    if (this.noteListComponent) {
      this.noteListComponent.fetchNotes();
    }
  }

  toggleEditor() {
    this.isEditorVisible = !this.isEditorVisible;
    if (this.isEditorVisible && !this.selectedNote) {
      this.initialTab = 'raw';
    }
  }

  onEditNote(note: Note) {
    this.selectedNote = {
      id: note.id,
      title: note.title || '',
      author: note.author || '',
      content: note.content || '',
      hashtags: note.hashtags || [],
      category: note.category,
      performing: note.performing || '',
      props: note.props || '',
      setup: note.setup || '',
      notes: note.notes || ''
    };
    this.initialTab = 'raw'; // Raw tab for Edit button
    this.isEditorVisible = true;
    this.scrollToEditor();
  }

  loadNoteInEditor(noteId: string) {
    this.noteService.getNote(noteId).subscribe(note => {
      this.selectedNote = {
        id: note.id,
        title: note.title || '',
        author: note.author || '',
        content: note.content || '',
        hashtags: note.hashtags || [],
        category: note.category,
        performing: note.performing || '',
        props: note.props || '',
        setup: note.setup || '',
        notes: note.notes || ''
      };
      this.initialTab = 'rendered'; // Rendered tab for note link
      this.isEditorVisible = true;
      this.scrollToEditor();
    });
  }

  onNoteSaved(note: Note) {
    this.selectedNote = null;
    this.isEditorVisible = false;
    if (this.noteListComponent) {
      this.noteListComponent.fetchNotes();
    }
  }

  onCancelEdit() {
    this.selectedNote = null;
    this.isEditorVisible = false;
  }

  private scrollToEditor() {
    setTimeout(() => {
      if (this.editorSection) {
        this.editorSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }
}