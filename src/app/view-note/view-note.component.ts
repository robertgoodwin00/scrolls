import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NoteService } from '../note.service';
import { BackReferencesService } from '../back-reference.service';
import { SafeHtml } from '@angular/platform-browser';
import { SanitizationService } from '../sanitization.service';
import { Note } from '../../models/note';

@Component({
  standalone: false,
  selector: 'app-view-note',
  templateUrl: './view-note.component.html',
  styleUrls: ['./view-note.component.css']
})
export class ViewNoteComponent implements OnInit {
  @Input() note: Note | undefined;
  @Output() noteNavigate = new EventEmitter<string>();

  safeTitle: SafeHtml | undefined;
  safeAuthor: SafeHtml | undefined;
  safeContent: SafeHtml | undefined;
  safePerforming: SafeHtml | undefined;
  safeProps: SafeHtml | undefined;
  safeSetup: SafeHtml | undefined;
  safeNotes: SafeHtml | undefined;
  backReferences: Note[] = [];

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private backReferencesService: BackReferencesService,
    private sanitizationService: SanitizationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.noteService.getNote(params['id']).subscribe(note => {
          this.note = note;
          this.sanitizeNoteFields();
          this.loadBackReferences();
        });
      } else if (this.note) {
        this.sanitizeNoteFields();
        this.loadBackReferences();
      }
    });
  }

  // Handles clicks on dynamically rendered note-link elements inside [innerHTML]
  @HostListener('click', ['$event'])
  onContentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('note-link')) {
      event.preventDefault();
      const noteId = target.getAttribute('data-note-id');
      if (noteId) {
        this.onNoteClick(noteId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['note'] && this.note) {
      this.sanitizeNoteFields();
      this.loadBackReferences();
    }
  }

  private async sanitizeNoteFields() {
    if (!this.note) return;
    const sanitized = await this.sanitizationService.sanitizeNote(this.note);
    Object.assign(this, sanitized);
  }

  private loadBackReferences() {
    if (!this.note?.id) return;
    this.backReferencesService.getBackReferences(this.note.id).subscribe(
      references => {
        this.backReferences = references;
      }
    );
  }

  onNoteClick(noteId: string) {
    this.noteNavigate.emit(noteId);
  }
}
