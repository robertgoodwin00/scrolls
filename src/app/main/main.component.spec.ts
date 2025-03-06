import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoteListComponent } from '../note-list/note-list.component';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { of } from 'rxjs';
import { NoteService } from '../note.service';
import { MainComponent } from './main.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainComponent, NoteListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: NoteService, useValue: { getAllNotes: () => of([]), noteAdded$: of() } },
        { provide: NgxIndexedDBService, useValue: { getAll: () => of([]), count: () => of(0) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



