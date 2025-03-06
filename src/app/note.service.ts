import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { map, Observable, Subject, tap } from 'rxjs';
import { Note } from '../models/note';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private noteAddedSource = new Subject<void>();
  noteAdded$ = this.noteAddedSource.asObservable();

  constructor(private dbService: NgxIndexedDBService) { }

  private getIdPrefix(category: number): string {
    const prefixes: { [key: number]: string } = { 1: 's', 2: 't', 3: 'r', 4: 'a' };
    return prefixes[category] || 'n';
  }

  // New method to validate note ID
  isValidNoteId(id: string): boolean {
    const regex = /^[rats]\d+$/;
    return regex.test(id);
  }

  // New method to get note title by ID
  getNoteTitle(id: string): Observable<string> {
    return this.getNote(id).pipe(
      map(note => note?.title || id) // Return ID if title not found
    );
  }

  createNote(note: Note): Observable<any> {
    const idPrefix = this.getIdPrefix(note.category);
    return this.dbService.count('notes').pipe(
      tap(count => {
        note.id = `${idPrefix}${count + 1}`;
      }),
      tap(() => this.dbService.add('notes', {
        ...note,
        hashtags: note.hashtags || []
      }).subscribe(() => this.notifyNoteAdded()))
    );
  }

  getAllNotes(): Observable<Note[]> {
    return this.dbService.getAll('notes') as Observable<Note[]>;
  }

  getNote(id: string): Observable<Note> {
    return this.dbService.getByKey('notes', id) as Observable<Note>;
  }

  updateNote(note: Note): Observable<any> {
    return this.dbService.update('notes', { ...note, hashtags: note.hashtags || [] });
  }

  deleteNote(id: string): Observable<any> {
    return this.dbService.delete('notes', id);
  }

  notifyNoteAdded() {
    this.noteAddedSource.next();
  }

  searchNotes(query: string, searchInContent: boolean = false, category: number): Observable<Note[]> {
    return this.dbService.getAll('notes').pipe(
      map(notes =>
        notes.filter(note => {
          const typedNote = note as Note;
          return typedNote.category === category && (
            typedNote.title.toLowerCase().includes(query.toLowerCase()) ||
            (searchInContent && typedNote.content.toLowerCase().includes(query.toLowerCase()))
          );
        })
      )
    ) as Observable<Note[]>;
  }

  getNotesByHashtag(hashtag: string): Observable<Note[]> {
    return this.dbService.getAll('notes').pipe(
      map((notes: any[]) =>
        notes.filter(note => {
          const noteTyped = note as Note;
          return noteTyped.hashtags && noteTyped.hashtags.includes(hashtag);
        })
      )
    ) as Observable<Note[]>;
  }
}