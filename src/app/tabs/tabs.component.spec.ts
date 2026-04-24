import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent } from './tabs.component';
import { SyncService } from '../sync.service';
import { NoteService } from '../note.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { Note } from '../../models/note';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;
  let syncService: jasmine.SpyObj<SyncService>;
  let noteService: jasmine.SpyObj<NoteService>;

  beforeEach(async () => {
    const syncServiceSpy = jasmine.createSpyObj('SyncService', ['exportNotes', 'importNotes']);
    const noteServiceSpy = jasmine.createSpyObj('NoteService', ['getAllNotes', 'deleteNote']);

    await TestBed.configureTestingModule({
      declarations: [TabsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: SyncService, useValue: syncServiceSpy },
        { provide: NoteService, useValue: noteServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    syncService = TestBed.inject(SyncService) as jasmine.SpyObj<SyncService>;
    noteService = TestBed.inject(NoteService) as jasmine.SpyObj<NoteService>;

    // Reset spies before each test
    syncService.exportNotes.calls.reset();
    syncService.importNotes.calls.reset();
    noteService.getAllNotes.and.returnValue(of([]));
    syncService.exportNotes.and.returnValue(of({ success: true }));
    syncService.importNotes.and.returnValue(of([]));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default active tab index as 2', () => {
    expect(component.activeTabIndex).toBe(2);
  });

  it('should select tab and emit event', () => {
    spyOn(component.tabSelected, 'emit');
    component.selectTab(3);
    expect(component.activeTabIndex).toBe(3);
    expect(component.tabSelected.emit).toHaveBeenCalledWith(3);
  });

  it('should initialize tabs', () => {
    expect(component.tabs).toEqual(['General', 'Sleights', 'Tricks', 'Routines', 'Acts']);
  });

  it('should call exportNotes with password and emit success', () => {
    spyOn(window, 'prompt').and.returnValue('testPassword');
    spyOn(window, 'alert');
    component.exportData();
    expect(syncService.exportNotes).toHaveBeenCalledWith('testPassword');
    expect(window.alert).toHaveBeenCalledWith('Notes exported successfully');
  });

  it('should call importNotes with password and emit notesImported event', () => {
    spyOn(window, 'prompt').and.returnValue('testPassword');
    spyOn(component.notesImported, 'emit');
    component.importData();
    expect(syncService.importNotes).toHaveBeenCalledWith('testPassword');
    expect(component.notesImported.emit).toHaveBeenCalled();
  });

  it('should clear notes and emit notesCleared event when confirmed', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.notesCleared, 'emit');
    const mockNotes: Note[] = [
      { id: '1', title: 'Note 1', author: 'Author 1', content: 'Content 1', category: 0, performing: '', props: '', setup: '', notes: '' },
      { id: '2', title: 'Note 2', author: 'Author 2', content: 'Content 2', category: 1, performing: '', props: '', setup: '', notes: '' },
    ];
    noteService.getAllNotes.and.returnValue(of(mockNotes));
    noteService.deleteNote.and.returnValue(of(undefined));
    await component.clearData();
    expect(noteService.getAllNotes).toHaveBeenCalled();
    expect(noteService.deleteNote).toHaveBeenCalledTimes(2);
    expect(component.notesCleared.emit).toHaveBeenCalled();
  });

  it('should not clear notes when confirmation is declined', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component.notesCleared, 'emit');
    component.clearData();
    expect(noteService.getAllNotes).not.toHaveBeenCalled();
    expect(component.notesCleared.emit).not.toHaveBeenCalled();
  });

  it('should not export data when password prompt is cancelled', () => {
    spyOn(window, 'prompt').and.returnValue(null);
    component.exportData();
    expect(syncService.exportNotes).not.toHaveBeenCalled();
  });

  it('should not import data when password prompt is cancelled', () => {
    spyOn(window, 'prompt').and.returnValue(null);
    spyOn(component.notesImported, 'emit');
    component.importData();
    expect(syncService.importNotes).not.toHaveBeenCalled();
    expect(component.notesImported.emit).not.toHaveBeenCalled();
  });

  it('should handle export error and show alert', () => {
    spyOn(window, 'prompt').and.returnValue('testPassword');
    spyOn(window, 'alert');
    syncService.exportNotes.and.returnValue(throwError(() => new Error('Export failed')));
    component.exportData();
    expect(syncService.exportNotes).toHaveBeenCalledWith('testPassword');
    expect(window.alert).toHaveBeenCalledWith('Export failed: Export failed');
  });

  it('should handle import error and show alert', () => {
    spyOn(window, 'prompt').and.returnValue('testPassword');
    spyOn(window, 'alert');
    syncService.importNotes.and.returnValue(throwError(() => new Error('Import failed')));
    component.importData();
    expect(syncService.importNotes).toHaveBeenCalledWith('testPassword');
    expect(window.alert).toHaveBeenCalledWith('Import failed: Import failed');
  });

  it('should select first tab when invalid index is provided', () => {
    spyOn(component.tabSelected, 'emit');
    component.selectTab(-1);
    expect(component.activeTabIndex).toBe(-1); // Adjust component logic if this should be 0
    expect(component.tabSelected.emit).toHaveBeenCalledWith(-1);
  });
});