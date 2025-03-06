import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ViewNoteComponent } from "./view-note.component";
import { NoteService } from "../note.service";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";

describe('ViewNoteComponent', () => {
  let component: ViewNoteComponent;
  let fixture: ComponentFixture<ViewNoteComponent>;
  let noteService: NoteService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterModule.forRoot([])],
      declarations: [ViewNoteComponent],
      providers: [{ provide: NoteService, useValue: { getNote: () => of({}) } }]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewNoteComponent);
    component = fixture.componentInstance;
    noteService = TestBed.inject(NoteService);
    component.note = { id: '1', title: 'Test', author: 'Author', content: 'Content', hashtags: ['tag'], category: 1, performing: '', props: '', setup: '', notes: '' };
    fixture.detectChanges();
  });

  // Test component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test note content sanitization
  it('should sanitize note content', () => {
    component.ngOnInit();
    expect(component.safeTitle).toBeDefined();
    expect(component.safeContent).toBeDefined();
  });

  // Test note display with hashtags
  it('should display note with hashtags', () => {
    fixture.detectChanges();
    const hashtagElements = fixture.debugElement.queryAll(By.css('span'));
    expect(hashtagElements.length).toBeGreaterThan(0);
  });
});

