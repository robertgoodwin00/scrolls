import { Injectable, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NoteService } from './note.service';
import { firstValueFrom } from 'rxjs';
import { Note } from '../models/note';
import DOMPurify from 'dompurify';

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

    let processedContent = content;

    // Preserve leading spaces by converting them to &nbsp;
    const leadingSpaceRegex = /^(\s+)/;
    const leadingMatch = processedContent.match(leadingSpaceRegex);
    if (leadingMatch) {
      const leadingSpaces = leadingMatch[0];
      const nbspCount = leadingSpaces.length;
      const nbspReplacement = '&nbsp;'.repeat(nbspCount);
      processedContent = processedContent.replace(leadingSpaceRegex, nbspReplacement);
    }

    // Handle note ID tags
    const noteIdRegex = /<([grats]\d+)>/g;
    let match;
    while ((match = noteIdRegex.exec(content)) !== null) {
      const fullTag = match[0];
      const noteId = match[1];
      if (this.noteService.isValidNoteId(noteId)) {
        try {
          const title = await firstValueFrom(this.noteService.getNoteTitle(noteId));
          const link = `<span class="note-link" data-note-id="${noteId}" style="color: blue; text-decoration: underline; cursor: pointer;">${title}</span>`;
          processedContent = processedContent.replace(fullTag, link);
        } catch (error) {
          processedContent = processedContent.replace(fullTag, noteId);
        }
      }
    }

    // Apply symbol replacements
    for (const [tag, replacement] of Object.entries(this.replacements)) {
      processedContent = processedContent.split(tag).join(replacement);
    }

    // Sanitize with DOMPurify BEFORE bypassing Angular security
    const cleanHtml = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'span', 'br', 'p'],
      ALLOWED_ATTR: ['style', 'class', 'data-note-id'],
      ALLOW_DATA_ATTR: false
    });

    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }


    // sanitization.service.ts
  async sanitizeNote(note: Note): Promise<{ [key: string]: SafeHtml }> {
    return {
      safeTitle: await this.sanitizeContent(note.title || ''),
      safeAuthor: await this.sanitizeContent(note.author || ''),
      safeContent: await this.sanitizeContent(note.content || ''),
      safePerforming: await this.sanitizeContent(note.performing || ''),
      safeProps: await this.sanitizeContent(note.props || ''),
      safeSetup: await this.sanitizeContent(note.setup || ''),
      safeNotes: await this.sanitizeContent(note.notes || '')
    };
  }


}