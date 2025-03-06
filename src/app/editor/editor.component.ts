import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { NoteService } from '../note.service';
import { Note } from '../../models/note';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SanitizationService } from '../sanitization.service';

@Component({
  standalone: false,
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() note!: Note;
  @Input() mode: 'create' | 'edit' = 'edit';
  @Input() category!: number;
  @Input() initialTab: 'raw' | 'rendered' = 'raw'; // New input to control initial tab
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() editNote = new EventEmitter<any>();
  @ViewChild('contentTextarea') contentTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('performingTextarea') performingTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('propsTextarea') propsTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('setupTextarea') setupTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  @ViewChild('authorInput') authorInput!: ElementRef<HTMLInputElement>;
  activeTab: 'raw' | 'rendered' = 'raw';
  safeTitle: SafeHtml | undefined;
  safeAuthor: SafeHtml | undefined;
  safeContent: SafeHtml | undefined;
  safePerforming: SafeHtml | undefined;
  safeProps: SafeHtml | undefined;
  safeSetup: SafeHtml | undefined;
  safeNotes: SafeHtml | undefined;

  colors = ['black', 'red', 'blue', 'green', '#666600', 'purple', 'darkorange', 'gold', '#555', 'gray', '#006666', 'magenta', 'lime', 'navy', 'indigo', 'maroon'];
  fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40];

  sleightNotes: Note[] = [];
  trickNotes: Note[] = [];
  routineNotes: Note[] = [];
  actNotes: Note[] = [];

  private lastFocusedElement: HTMLTextAreaElement | HTMLInputElement | null = null;
  private noteService: NoteService;
  private elementFieldMap: Map<HTMLTextAreaElement | HTMLInputElement, { field: keyof Note, defaultValue: string }> = new Map();
  private defaultFields: { element: HTMLTextAreaElement, field: keyof Note, value: string }[] = [];

  constructor(
    noteService: NoteService,
    private sanitizationService: SanitizationService
  ) {
    this.noteService = noteService;
  }

  ngOnInit() {
    if (!this.note) {
      this.note = {
        title: '', author: '', content: '', hashtags: [], category: this.category,
        performing: '', props: '', setup: '', notes: ''
      };
      this.activeTab = 'raw';
    } else {
      this.activeTab = this.initialTab; // Use initialTab from MainComponent
    }
    this.updateRenderedView();

    this.noteService.getAllNotes().subscribe(notes => {
      this.sleightNotes = notes.filter(note => note.category === 1);
      this.trickNotes = notes.filter(note => note.category === 2);
      this.routineNotes = notes.filter(note => note.category === 3);
      this.actNotes = notes.filter(note => note.category === 4);
    });

    document.addEventListener('noteLinkClick', (event: any) => {
      const noteId = event.detail;
      this.noteService.getNote(noteId).subscribe(note => {
        this.note = note;
        this.activeTab = 'rendered'; // Fallback for direct clicks, though MainComponent should handle this
        this.updateRenderedView();
      });
    });
  }

  ngAfterViewInit() {
    if (!this.contentTextarea || !this.performingTextarea || !this.propsTextarea || !this.setupTextarea || !this.notesTextarea || !this.titleInput || !this.authorInput) {
      return;
    }
  
    const mappings: [HTMLTextAreaElement | HTMLInputElement, { field: keyof Note, defaultValue: string }][] = [
      [this.contentTextarea.nativeElement, { field: 'content', defaultValue: '' }],
      [this.performingTextarea.nativeElement, { field: 'performing', defaultValue: '' }],
      [this.propsTextarea.nativeElement, { field: 'props', defaultValue: '' }],
      [this.setupTextarea.nativeElement, { field: 'setup', defaultValue: '' }],
      [this.notesTextarea.nativeElement, { field: 'notes', defaultValue: '' }],
      [this.titleInput.nativeElement, { field: 'title', defaultValue: '' }],
      [this.authorInput.nativeElement, { field: 'author', defaultValue: '' }]
    ];
  
    this.elementFieldMap = new Map(mappings);
    this.defaultFields = [
      { element: this.contentTextarea.nativeElement, field: 'content', value: '' },
      { element: this.performingTextarea.nativeElement, field: 'performing', value: '' },
      { element: this.propsTextarea.nativeElement, field: 'props', value: '' }
    ];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category'] && this.mode === 'create' && this.note) {
      this.note.category = this.category;
    }
    if (changes['note'] && this.note) {
      this.activeTab = this.initialTab; // Use initialTab when note changes
      this.updateRenderedView();
    }
  }

  insertNoteTag(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const noteId = selectElement.value;
    if (!noteId || this.activeTab === 'rendered') return;

    let element = this.lastFocusedElement;
    let field: keyof Note = 'content';
    let currentValue = this.note.content || '';

    if (this.elementFieldMap.size > 0 && element && this.elementFieldMap.has(element)) {
      const config = this.elementFieldMap.get(element)!;
      field = config.field;
      currentValue = this.note[field] as string;
    } else if (this.defaultFields.length > 0) {
      element = this.contentTextarea?.nativeElement || null;
      field = 'content';
      currentValue = this.note.content || '';
    }

    if (element) {
      this.insertTextAtCursor(element, `<${noteId}>`, field, currentValue);
    } else {
      this.note.content = (this.note.content || '') + `<${noteId}>`;
    }

    selectElement.selectedIndex = 0;
  }

  toggleEdit(note: any) {
    note.isEditing = !note.isEditing;
    if (note.isEditing) {
      this.editNote.emit(note);
      note.isDisplayed = false;
    }
  }

  private getActiveElement(): HTMLTextAreaElement | HTMLInputElement | null {
    return this.lastFocusedElement;
  }

  private getActiveFieldInfo(defaultField?: keyof Note): {
    element: HTMLTextAreaElement | HTMLInputElement,
    field: keyof Note,
    currentValue: string
  } {
    const activeElement = this.getActiveElement();
    if (activeElement && this.elementFieldMap.has(activeElement)) {
      const config = this.elementFieldMap.get(activeElement)!;
      return {
        element: activeElement,
        field: config.field,
        currentValue: this.note[config.field] as string
      };
    }

    const defaultConfig = defaultField 
      ? this.defaultFields.find(d => d.field === defaultField)
      : this.defaultFields[0];

    return {
      element: defaultConfig!.element,
      field: defaultConfig!.field,
      currentValue: this.note[defaultConfig!.field] as string
    };
  }

  onFocus(element: EventTarget | null) {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      this.lastFocusedElement = element;
    }
  }

  selectTab(tab: 'raw' | 'rendered') {
    this.activeTab = tab;
    if (tab === 'rendered') {
      this.updateRenderedView();
    }
  }

  private async updateRenderedView() {
    if (!this.note) return;
    this.safeTitle = await this.sanitizationService.sanitizeContent(this.note.title ?? '');
    this.safeAuthor = await this.sanitizationService.sanitizeContent(this.note.author ?? '');
    this.safeContent = await this.sanitizationService.sanitizeContent(this.note.content ?? '');
    this.safePerforming = await this.sanitizationService.sanitizeContent(this.note.performing ?? '');
    this.safeProps = await this.sanitizationService.sanitizeContent(this.note.props ?? '');
    this.safeSetup = await this.sanitizationService.sanitizeContent(this.note.setup ?? '');
    this.safeNotes = await this.sanitizationService.sanitizeContent(this.note.notes ?? '');
  }

  formatText(format: 'bold' | 'italic' | 'underline' | string) {
    if (this.activeTab === 'rendered') return;

    const { element, field, currentValue } = this.getActiveFieldInfo();
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const selectedText = currentValue.substring(start, end);
    let openingTag: string, closingTag: string;

    if (this.colors.includes(format)) {
      openingTag = `<span style="color: ${format}">`;
      closingTag = `</span>`;
    } else if (this.fontSizes.includes(parseInt(format))) {
      openingTag = `<span style="font-size: ${format}px">`;
      closingTag = `</span>`;
    } else {
      const tag = format === 'bold' ? 'b' : format === 'italic' ? 'i' : 'u';
      openingTag = `<${tag}>`;
      closingTag = `</ ${tag}>`;
    }

    if (start === end) {
      const text = `${openingTag}${closingTag}`;
      this.insertTextAtCursor(element, text, field, currentValue);
    } else {
      const before = currentValue.substring(0, start);
      const after = currentValue.substring(end);
      (this.note[field] as string) = `${before}${openingTag}${selectedText}${closingTag}${after}`;
      setTimeout(() => {
        element.selectionStart = start;
        element.selectionEnd = end + openingTag.length + closingTag.length;
      }, 0);
    }
  }

  onFontSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.formatText(target.value);
    }
  }

  private insertTextAtCursor(
    element: HTMLTextAreaElement | HTMLInputElement,
    text: string,
    field: keyof Note,
    currentValue: string
  ) {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const before = currentValue.substring(0, start);
    const after = currentValue.substring(end);
    (this.note[field] as string) = `${before}${text}${after}`;
    setTimeout(() => {
      element.selectionStart = element.selectionEnd = start + text.length;
    }, 0);
  }

  private insertTag(tag: string, defaultField?: keyof Note) {
    if (this.activeTab === 'rendered') return;
    const { element, field, currentValue } = this.getActiveFieldInfo(defaultField);
    this.insertTextAtCursor(element, tag, field, currentValue);
  }

  insertTrumpSuit(suit: 'spade' | 'club' | 'heart' | 'diamond') {
    if (this.activeTab === 'rendered') return;
    this.insertTag(`<${suit}>`);
  }

  insertSymbol(symbol: string) {
    if (this.activeTab === 'rendered') return;
    this.insertTag(`<${symbol}>`);
  }

  insertPerformingSymbol(symbol: string) {
    if (this.activeTab === 'rendered') return;
    this.insertTag(`<${symbol}>`, 'performing');
  }
  
  insertPropsSymbol(symbol: string) {
    if (this.activeTab === 'rendered') return;
    this.insertTag(`<${symbol}>`, 'props');
  }

  saveNote() {
    if (!this.note) return;
  
    if (this.note.hashtags && typeof this.note.hashtags === 'string') {
      this.note.hashtags = (this.note.hashtags as string)
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    } else if (!Array.isArray(this.note.hashtags)) {
      this.note.hashtags = [];
    }
  
    const saveOperation = this.mode === 'create'
      ? this.noteService.createNote(this.note)
      : this.noteService.updateNote(this.note);
  
    saveOperation.subscribe((savedNote: Note) => {
      this.save.emit({ ...savedNote, isDisplayed: true, isEditing: false });
      if (this.mode === 'create') this.resetNote();
    });
  }

  convertHashtagsToArray(value: string) {
    this.note.hashtags = value.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  cancelEdit() {
    this.cancel.emit();
    this.resetNote();
  }

  private resetNote() {
    if (this.mode === 'create') {
      this.note = {
        title: '', author: '', content: '', hashtags: [], category: this.category,
        performing: '', props: '', setup: '', notes: ''
      };
    }
  }
}
/*
  private sanitizeContent(content: string): string {
    // Simple tag balancing: ensure each opening tag has a matching closing tag
    const tags = ['b', 'i', 'u', 'span'];
    tags.forEach(tag => {
      const opening = tag === 'span' ? `<span style="color:` : `<${tag}>`;
      const closing = tag === 'span' ? `</span>` : `</ ${tag}>`;
      const openingCount = (content.match(new RegExp(opening, 'g')) || []).length;
      const closingCount = (content.match(new RegExp(closing, 'g')) || []).length;
  
      if (openingCount > closingCount) {
        // Add missing closing tags without whitespace
        for (let i = 0; i < openingCount - closingCount; i++) {
          content += closing;
        }
      } else if (closingCount > openingCount) {
        // Remove extra closing tags
        for (let i = 0; i < closingCount - openingCount; i++) {
          content = content.replace(closing, '');
        }
      }
  
      // Remove any whitespace within closing tags
      content = content.replace(/<\/\s*(\w+)\s*>/g, '</ $1>');
    });
    return content;
  }
  */




// TODO

// also need confirmation when deleting notes

// carriage returns

// launching edit/view from note-list broken



// also make cross-referencing of notes 

