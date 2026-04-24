import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, switchMap } from 'rxjs';
import { Note } from '../models/note';
import { NoteService } from './note.service';
import { environment } from './environments/environment';

import { HttpClientXsrfModule } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiUrl = `${environment.apiUrl}/api/notes`;

  constructor(private http: HttpClient, private noteService: NoteService) {}

  exportNotes(password: string): Observable<any> {
    console.log('Exporting notes with password:', password);
    return this.noteService.getAllNotes().pipe(
      switchMap(notes => {
        const filteredNotes = notes.map(note => ({
          id: note.id,
          title: note.title || null,
          author: note.author || null,
          content: note.content || null,
          hashtags: note.hashtags || [],
          category: note.category !== undefined ? note.category : null,
          performing: note.performing || null,
          props: note.props || null,
          setup: note.setup || null,
          notes: note.notes || null
        }));
        console.log('Notes to export:', filteredNotes);
        return this.http.post(`${this.apiUrl}/upload`, { password, notes: filteredNotes });
      })
    );
  }

  importNotes(password: string): Observable<Note[]> {
    console.log('Importing notes with password:', password);
    return this.http.post<Note[]>(`${this.apiUrl}/download`, { password }).pipe(
      switchMap(notes => {
        console.log('Notes received from server:', notes);
        const saveObservables = notes.map(note => this.noteService.updateNote(note));
        return forkJoin(saveObservables).pipe(
          switchMap(() => this.noteService.getAllNotes())
        );
      })
    );
  }
  
}