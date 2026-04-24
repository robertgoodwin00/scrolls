import { Injectable } from '@angular/core';
import { NoteService } from './note.service';
import { Note } from '../models/note';
import { Observable, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackReferencesService {
  private noteIdRegex = /<([grats]\d+)>/g;

  constructor(private noteService: NoteService) {}

  /**
   * Gets all notes that reference the given note ID
   */
  getBackReferences(noteId: string): Observable<Note[]> {
    return this.noteService.getAllNotes().pipe(
      map(notes => {
        return notes.filter(note => {
          if (note.id === noteId) return false; // Don't include self-references
          
          // Check all text fields for note references
          const fieldsToCheck = [
            note.title, note.author, note.content, 
            note.performing, note.props, note.setup, note.notes
          ];
          
          return fieldsToCheck.some(field => {
            if (!field) return false;
            return this.containsNoteReference(field, noteId);
          });
        });
      })
    );
  }

  /**
   * Checks if a text field contains a reference to the given note ID
   */
  private containsNoteReference(text: string, noteId: string): boolean {
    const matches = text.match(this.noteIdRegex);
    if (!matches) return false;
    
    return matches.some(match => {
      const referencedId = match.replace('<', '').replace('>', '');
      return referencedId === noteId;
    });
  }

  /**
   * Gets all note IDs referenced in a given text
   */
  getReferencedNoteIds(text: string): string[] {
    const matches = text.match(this.noteIdRegex);
    if (!matches) return [];
    
    return matches.map(match => match.replace('<', '').replace('>', ''));
  }

  /**
   * Invalidates back-references cache when notes change
   * This method can be called when notes are updated/created/deleted
   */
  invalidateCache(): void {
    // For now, we're doing real-time queries
    // In the future, we could implement caching here
  }
}