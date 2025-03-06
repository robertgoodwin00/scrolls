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
  @Output() save = new EventEmitter<Note>();  // Add this output
  isVisible = true;

  constructor(private noteService: NoteService) {}

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  onNoteCreated(note: Note) {  // Update this method
    this.save.emit(note);
    this.isVisible = false;
    this.noteService.notifyNoteAdded();
  }

  getCategoryName(category: number): string {
    const names = ['Sleight', 'Trick', 'Routine', 'Act'];
    return names[category - 1];
  }
}