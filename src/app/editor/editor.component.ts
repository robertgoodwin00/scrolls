import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, OnChanges, SimpleChanges, AfterViewInit, HostListener } from '@angular/core';
import { NoteService } from '../note.service';
import { Note } from '../../models/note';
import { SafeHtml } from '@angular/platform-browser';
import { SanitizationService } from '../sanitization.service';

@Component({
  standalone: false,
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() note!: Note;
  @Input() mode: 'create' | 'edit' = 'edit';
  @Input() category!: number;
  @Input() initialTab: 'raw' | 'rendered' = 'raw';
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

  generalNotes: Note[] = [];
  sleightNotes: Note[] = [];
  trickNotes: Note[] = [];
  routineNotes: Note[] = [];
  actNotes: Note[] = [];
  hashtagInput: string = '';

  private lastFocusedElement: HTMLTextAreaElement | HTMLInputElement | null = null;
  private noteService: NoteService;
  private elementFieldMap: Map<HTMLTextAreaElement | HTMLInputElement, { field: keyof Note, defaultValue: string }> = new Map();
  private defaultFields: { element: HTMLTextAreaElement | HTMLInputElement, field: keyof Note, value: string }[] = [];

  private focusListenerCleanups: (() => void)[] = [];

  isCtrlPressed: boolean = false;
  isShiftPressed: boolean = false;
  isAtOn: boolean = false;
  pressedButtonCount: number = 0;

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
      this.activeTab = this.initialTab;
      this.hashtagInput = this.note.hashtags?.join(', ') || '';
    }
    this.updateRenderedView();

    // Load notes for dropdowns
    this.loadNotesForDropdowns();
  }

   ngOnDestroy() {
    // Clean up focus listeners
    this.focusListenerCleanups.forEach(cleanup => cleanup());
    this.focusListenerCleanups = [];
    
    // Clear references
    this.elementFieldMap.clear();
    this.defaultFields = [];
    this.lastFocusedElement = null;
  }

  private loadNotesForDropdowns() {
    this.noteService.getAllNotes().subscribe(notes => {
      this.generalNotes = notes.filter(note => note.category === 0);
      this.sleightNotes = notes.filter(note => note.category === 1);
      this.trickNotes = notes.filter(note => note.category === 2);
      this.routineNotes = notes.filter(note => note.category === 3);
      this.actNotes = notes.filter(note => note.category === 4);
    });
  }

  resetDropdowns() {
    this.generalNotes = [];
    this.sleightNotes = [];
    this.trickNotes = [];
    this.routineNotes = [];
    this.actNotes = [];
  }

  ngAfterViewInit() {
    if (!this.contentTextarea || !this.performingTextarea || !this.propsTextarea || 
        !this.setupTextarea || !this.notesTextarea || !this.titleInput || !this.authorInput) {
      console.error('One or more ViewChild elements are undefined');
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
    this.defaultFields = mappings.map(([element, config]) => ({
      element: element,
      field: config.field,
      value: config.defaultValue
    }));

    mappings.forEach(([element]) => {
      const handler = () => { this.lastFocusedElement = element; };
      element.addEventListener('focus', handler);
      this.focusListenerCleanups.push(() => element.removeEventListener('focus', handler));
    });

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category'] && this.mode === 'create' && this.note) {
      this.note.category = this.category;
    }
    if (changes['note'] && this.note) {
      this.activeTab = this.initialTab;
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

  private getActiveFieldInfo(defaultField?: keyof Note): {
    element: HTMLTextAreaElement | HTMLInputElement,
    field: keyof Note,
    currentValue: string
  } {
    if (this.lastFocusedElement && this.elementFieldMap.has(this.lastFocusedElement)) {
      const config = this.elementFieldMap.get(this.lastFocusedElement)!;
      return {
        element: this.lastFocusedElement,
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
    } else {
      // When switching back to raw tab, refresh element references and set default focus
      setTimeout(() => {
        this.refreshElementReferences();
        this.setDefaultFocus();
      }, 0);
    }
  }


  private refreshElementReferences() {
    if (!this.contentTextarea || !this.performingTextarea || !this.propsTextarea || 
        !this.setupTextarea || !this.notesTextarea || !this.titleInput || !this.authorInput) {
      return;
    }

    // Remove old event listeners before adding new ones
    this.focusListenerCleanups.forEach(cleanup => cleanup());
    this.focusListenerCleanups = [];

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
    this.defaultFields = mappings.map(([element, config]) => ({
      element: element,
      field: config.field,
      value: config.defaultValue
    }));

    // Add event listeners and track them for cleanup
    mappings.forEach(([element]) => {
      const handler = () => { this.lastFocusedElement = element; };
      element.addEventListener('focus', handler);
      this.focusListenerCleanups.push(() => element.removeEventListener('focus', handler));
    });
  }

  // set a default focus element:
  private setDefaultFocus() {
    if (this.contentTextarea && this.contentTextarea.nativeElement) {
      this.lastFocusedElement = this.contentTextarea.nativeElement;
    }
  }

  private async updateRenderedView() {
    if (!this.note) return;
    const sanitized = await this.sanitizationService.sanitizeNote(this.note);
    this.safeTitle = sanitized['safeTitle'];
    this.safeAuthor = sanitized['safeAuthor'];
    this.safeContent = sanitized['safeContent'];
    this.safePerforming = sanitized['safePerforming'];
    this.safeProps = sanitized['safeProps'];
    this.safeSetup = sanitized['safeSetup'];
    this.safeNotes = sanitized['safeNotes'];
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
      closingTag = `</${tag}>`;
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
    this.otherPressed();
    this.insertTag(`<${suit}>`);
  }

  insertSymbol(symbol: string) {
    if (this.activeTab === 'rendered') return;
    this.otherPressed();
    this.insertTag(`<${symbol}>`);
  }

  insertPerformingSymbol(symbol: string) {
    if (this.activeTab === 'rendered') return;
    this.otherPressed();
    this.insertTag(`<${symbol}>`, 'performing');
  }
  
  insertPropsSymbol(symbol: string) {
    if (this.activeTab === 'rendered') return;
    if (symbol == 'pen')
      this.penPressed();
    else if (symbol == 'coins')
      this.coinPressed();
    else
      this.otherPressed();
    this.insertTag(`<${symbol}>`, 'props');
  }

  penPressed() {
    this.pressedButtonCount += 1;
    if (this.pressedButtonCount >= 3)
    {
      this.isAtOn = true;
      this.isCtrlPressed = false;
    }  
  }

  coinPressed() {
    if (this.isAtOn)
    this.isCtrlPressed = !this.isCtrlPressed;
  }

  otherPressed() {
    if (this.pressedButtonCount >= 3 || this.isAtOn)
    {
      this.isAtOn = false;
    }
      
    this.pressedButtonCount = 0;
  }

  
  saveNote() {
    if (!this.note) return;
  
    // Basic validation
    const hasContent = this.note.title?.trim() || this.note.content?.trim();
    if (!hasContent) {
      alert('Please provide at least a title or content before saving.');
      return;
    }

    this.convertHashtagsToArray(this.hashtagInput);

    if (this.mode === 'create') {
        if (this.note.category === undefined || this.note.category === null) {
            this.note.category = this.category;
        }

        this.save.emit(this.note);
        this.resetNote();

    } else {
        const saveOperation = this.noteService.updateNote(this.note);
          saveOperation.subscribe({
              next: () => {
                  this.save.emit({ ...this.note, isDisplayed: true, isEditing: false });
              },
              error: (err) => {
                  console.error('Error updating note:', err);
                  alert('Failed to save note changes. Please try again.');
              }
          });
    }
  }

  /* old. allows non-alphanumeric
  convertHashtagsToArray(value: string) {
    this.hashtagInput = value;
    this.note.hashtags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
      */

  convertHashtagsToArray(value: string) {
    this.hashtagInput = value;
    this.note.hashtags = value
      .split(',')
      .map(tag => tag.trim().toLowerCase()) // normalize to lowercase
      .filter(tag => tag.length > 0 && /^[a-z0-9-_]+$/i.test(tag)); // alphanumeric only
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
      this.hashtagInput = '';
    }
  }

  // Listen for keydown events
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control') this.isCtrlPressed = true;
    if (event.key === 'Shift') this.isShiftPressed = true;
  }

  // Listen for keyup events
  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control') this.isCtrlPressed = false;
    if (event.key === 'Shift') this.isShiftPressed = false;
    if (event.key === 'F8') this.isAtOn = !this.isAtOn;
  }

  onNavigateToNote(noteId: string) {
    // Load and display the referenced note
    this.noteService.getNote(noteId).subscribe(note => {
      this.note = note;
    });
  }


}
