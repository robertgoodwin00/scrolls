import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NoteService } from '../note.service';
import { SafeHtml } from '@angular/platform-browser';
import { SanitizationService } from '../sanitization.service';

@Component({
  standalone: false,
  selector: 'app-view-note',
  templateUrl: './view-note.component.html',
  styleUrls: ['./view-note.component.css']
})
export class ViewNoteComponent implements OnInit {
  @Input() note: any;
  safeTitle: SafeHtml | undefined;
  safeAuthor: SafeHtml | undefined;
  safeContent: SafeHtml | undefined;
  safePerforming: SafeHtml | undefined;
  safeProps: SafeHtml | undefined;
  safeSetup: SafeHtml | undefined;
  safeNotes: SafeHtml | undefined;

  constructor(
    private route: ActivatedRoute,
    private noteService: NoteService,
    private sanitizationService: SanitizationService
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      if (params['id']) {
        this.noteService.getNote(params['id']).subscribe(async note => {
          this.note = note;
          this.safeTitle = await this.sanitizationService.sanitizeContent(note?.title || '');
          this.safeAuthor = await this.sanitizationService.sanitizeContent(note?.author || '');
          this.safeContent = await this.sanitizationService.sanitizeContent(note?.content || '');
          this.safePerforming = await this.sanitizationService.sanitizeContent(note?.performing || '');
          this.safeProps = await this.sanitizationService.sanitizeContent(note?.props || '');
          this.safeSetup = await this.sanitizationService.sanitizeContent(note?.setup || '');
          this.safeNotes = await this.sanitizationService.sanitizeContent(note?.notes || '');
        });
      } else if (this.note) {
        this.safeTitle = await this.sanitizationService.sanitizeContent(this.note?.title || '');
        this.safeAuthor = await this.sanitizationService.sanitizeContent(this.note?.author || '');
        this.safeContent = await this.sanitizationService.sanitizeContent(this.note?.content || '');
        this.safePerforming = await this.sanitizationService.sanitizeContent(this.note?.performing || '');
        this.safeProps = await this.sanitizationService.sanitizeContent(this.note?.props || '');
        this.safeSetup = await this.sanitizationService.sanitizeContent(this.note?.setup || '');
        this.safeNotes = await this.sanitizationService.sanitizeContent(this.note?.notes || '');
      }
    });
  }
}



  /*
  import { Component, Input } from '@angular/core';

  @Component({
    standalone: false,
    selector: 'app-view-note',
    templateUrl: './view-note.component.html',
    styleUrls: ['./view-note.component.css']
  })
  export class ViewNoteComponent {
    @Input() note: any;
  }
  */
