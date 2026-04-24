import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NoteService } from '../note.service';
import { Note } from '../../models/note';

@Component({
  standalone: false,
  selector: 'app-create-note',
  templateUrl: './create-note.component.html',
  styleUrls: ['./create-note.component.css']
})
export class CreateNoteComponent {
  @Input() category!: number;
  @Output() save = new EventEmitter<Note>();  
  isVisible = true;

  constructor(private noteService: NoteService) {}

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  onNoteCreated(note: Note) {
    console.log('Note created with ID:', note.id);
    this.noteService.createNote(note).subscribe((savedNote: Note) => {
      console.log('Saved note with ID:', savedNote.id);
      this.save.emit(savedNote);
      this.isVisible = false;
    });
  }

  getCategoryName(category: number): string {
    const names = ['General', 'Sleight', 'Trick', 'Routine', 'Act'];
    return names[category];
  }
}

