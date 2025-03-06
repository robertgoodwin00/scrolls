import { Injectable, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NoteService } from './note.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SanitizationService {
  private replacements: { [key: string]: string } = {
    '<spade>': '<span style="color: black">♠</span>',
    '<club>': '<span style="color: black">♣</span>',
    '<heart>': '<span style="color: red">♥</span>',
    '<diamond>': '<span style="color: red">♦</span>',
    '<face-down-card>': '┬',
    '<face-up-card>': '┴',
    '<face-down-packet>': '╤',
    '<face-up-packet>': '╧',
    '<double-face-card>': '┼',
    '<double-back-card>': 'Ɪ',
    '<magician>': 'ɱ',
    '<spectator>': 'ʂ',
    '<card-selected>': '↑',
    '<card-returned>': '↓',
    '<selection>': 'ε',
    '<card-dealt-from-top>': '→',
    '<card-placed-on-top>': '←',
    '<card-switch>': '↔',
    '<shuffle>': '╬',
    '<cut>': '╗',
    '<joker>': '🃏',
    '<impromptu>': '✽',
    '<table>': 'Ͳ',
    '<standing>': 'λ',
    '<wearing-pockets>': 'Ϸ',
    '<packet-effect>': '▱',
    '<any-surface>': '︿',
    '<angle-sensitive>': '✥',
    '<pen>': '✐',
    '<coins>': '¢',
    '<bills>': '$',
    '<wallet>': 'Ⱳ',
    '<hankerchief>': 'ꜧ',
    '<envelope>': '✉',
    '<dice>': '⚂',
    '\n': '<br>'
  };

  // Event emitter to notify when a note link is clicked
  public noteLinkClicked = new EventEmitter<string>();

  constructor(
    private sanitizer: DomSanitizer,
    private noteService: NoteService
  ) {}

  async sanitizeContent(content: string | undefined): Promise<SafeHtml> {
    if (!content) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    let sanitizedContent = content;

    // Regular expression to find note ID tags like <a32>, <r10>, etc.
    const noteIdRegex = /<([rats]\d+)>/g;
    let match;

    while ((match = noteIdRegex.exec(content)) !== null) {
      const fullTag = match[0]; // e.g., "<a32>"
      const noteId = match[1];  // e.g., "a32"

      if (this.noteService.isValidNoteId(noteId)) {
        try {
          const title = await firstValueFrom(this.noteService.getNoteTitle(noteId));
          // Use a span with an onclick event to emit the note ID
          const link = `<span style="color: blue; text-decoration: underline; cursor: pointer;" onclick="document.dispatchEvent(new CustomEvent('noteLinkClick', { detail: '${noteId}' }))">${title}</span>`;
          sanitizedContent = sanitizedContent.replace(fullTag, link);
        } catch (error) {
          sanitizedContent = sanitizedContent.replace(fullTag, noteId);
        }
      }
    }

    for (const [tag, replacement] of Object.entries(this.replacements)) {
      sanitizedContent = sanitizedContent.split(tag).join(replacement);
    }

    return this.sanitizer.bypassSecurityTrustHtml(sanitizedContent);
  }
}