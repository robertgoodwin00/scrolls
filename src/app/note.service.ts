import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { map, Observable, Subject, switchMap, tap } from 'rxjs';
import { Note } from '../models/note';


@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private noteAddedSource = new Subject<string | null>();
  noteAdded$ = this.noteAddedSource.asObservable();


  // Subject to notify back-references of note changes
  private noteChangedSource = new Subject<void>();
  noteChanged$ = this.noteChangedSource.asObservable();


  constructor(private dbService: NgxIndexedDBService) { }


  /**
   * Maps category to a prefix for generating unique note IDs.
   * @param category - The category number (0-4).
   * @returns A string prefix (e.g., 'g' for General).
   */
  private getIdPrefix(category: number): string {
    const prefixes: { [key: number]: string } = { 0: 'g', 1: 's', 2: 't', 3: 'r', 4: 'a' };
    return prefixes[category] || 'n';
  }


  /**
   * Validates a note ID format (e.g., 'g123', 's456').
   * @param id - The note ID to validate.
   * @returns True if the ID is valid, otherwise false.
   */
  isValidNoteId(id: string): boolean {
    const regex = /^[grats]\d+$/;
    return regex.test(id);
  }


  /**
   * Retrieves the title of a note by its ID.
   * @param id - The note ID.
   * @returns An observable with the note title or the ID if not found.
   */
  getNoteTitle(id: string): Observable<string> {
    return this.getNote(id).pipe(
      map(note => note?.title || id) // Return ID if title not found
    );
  }


  /**
   * Creates a new note with a generated ID based on category.
   * @param note - The note to create.
   * @returns An observable with the created note.
   */
  createNote(note: Note): Observable<Note> {
    const idPrefix = this.getIdPrefix(note.category);


    return this.getNotesByCategory(note.category).pipe(
      switchMap((categoryNotes: Note[]): Observable<Note> => {
        let maxId = 0;


        // Find the highest ID in the same category
        categoryNotes.forEach(n => {
          if (n.id?.startsWith(idPrefix)) {
            const idNum = parseInt(n.id.substring(idPrefix.length), 10);
            if (!isNaN(idNum) && idNum > maxId) {
              maxId = idNum;
            }
          }
        });


        // Generate the next ID in the sequence
        note.id = `${idPrefix}${maxId + 1}`;
        console.log('Generated note ID:', note.id);


        const noteToAdd: Note = {
          ...note,
          hashtags: note.hashtags || []
        };


        return this.dbService.add('notes', noteToAdd).pipe(
          map(() => noteToAdd)
        );
      }),
      tap((savedNote: Note) => {
        console.log('Notifying note added with ID:', savedNote.id);
        this.notifyNoteAdded(savedNote.id!);
        this.noteChangedSource.next();
      })
    );
  }


  /**
   * Retrieves all notes from the database.
   * @returns An observable of all notes.
   */
  getAllNotes(): Observable<Note[]> {
    return this.dbService.getAll('notes') as Observable<Note[]>;
  }


  /**
   * Retrieves a note by its ID.
   * @param id - The note ID.
   * @returns An observable with the note.
   */
  getNote(id: string): Observable<Note> {
    return this.dbService.getByKey('notes', id) as Observable<Note>;
  }


  /**
   * Updates an existing note in the database.
   * @param note - The updated note.
   * @returns An observable indicating success.
   */
  updateNote(note: Note): Observable<any> {
    return this.dbService.update('notes', { ...note, hashtags: note.hashtags || [] }).pipe(
      tap(() => {
        this.noteChangedSource.next(); // Notify back-references of the update
      })
    );
  }


  /**
   * Deletes a note by its ID.
   * @param id - The note ID.
   * @returns An observable indicating success.
   */
  deleteNote(id: string): Observable<any> {
    return this.dbService.delete('notes', id).pipe(
      tap(() => {
        this.noteChangedSource.next(); // Notify back-references of the deletion
      })
    );
  }


  /**
   * Notifies subscribers that a note has been added.
   * @param noteId - The ID of the newly added note.
   */
  notifyNoteAdded(noteId: string | null = null) {
    this.noteAddedSource.next(noteId);
  }


  /**
   * Searches notes by title or content within a specific category.
   * @param query - The search term.
   * @param searchInContent - Whether to search in the content field.
   * @param category - The category to filter by.
   * @returns An observable of matching notes.
   */

  searchNotes(query: string, searchInContent: boolean = false, category: number): Observable<Note[]> {
    const normalizedQuery = query.toLowerCase();


    return this.getNotesByCategory(category).pipe(
      map(notes =>
        notes.filter(note =>
          (note.title?.toLowerCase().includes(normalizedQuery) ?? false) ||
          (searchInContent && (note.content?.toLowerCase().includes(normalizedQuery) ?? false))
        )
      )
    );
  }

  /**
   * Retrieves notes by a specific hashtag.
   * @param hashtag - The hashtag to search for.
   * @returns An observable of matching notes.
   */
  /* the old way before 4/20/2026
  getNotesByHashtag(hashtag: string): Observable<Note[]> {
    return this.dbService.getAll('notes').pipe(
      map((notes: any[]) =>
        notes.filter(note => {
          const noteTyped = note as Note;
          return noteTyped.hashtags && noteTyped.hashtags.includes(hashtag);
        })
      )
    ) as Observable<Note[]>;
  }*/

  // creating a composite index
getNotesByHashtag(hashtag: string): Observable<Note[]> {
  return this.getAllNotes().pipe(
    map(notes => 
      notes.filter(note => note.hashtags?.includes(hashtag))
    )
  );
}

  /**
   * Retrieves notes for a specific category using the IndexedDB category index.
   * @param category - The category number (0-4).
   * @returns An observable of notes in that category.
   */
  getNotesByCategory(category: number): Observable<Note[]> {
    return this.dbService.getAllByIndex(
      'notes',
      'category',
      IDBKeyRange.only(category)
    ) as Observable<Note[]>;
  }

}