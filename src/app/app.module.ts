import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ViewNoteComponent } from './view-note/view-note.component';
import { NoteListComponent } from './note-list/note-list.component';
import { CreateNoteComponent } from './create-note/create-note.component';
import { MainComponent } from './main/main.component';
import { TabsComponent } from './tabs/tabs.component';
import { EditorComponent } from './editor/editor.component';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog/delete-confirmation-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

const dbConfig: DBConfig = {
  name: 'NotesDB',
  version: 1,
  objectStoresMeta: [{
    store: 'notes',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'title', keypath: 'title', options: { unique: false } },
      { name: 'author', keypath: 'author', options: { unique: false } },
      { name: 'content', keypath: 'content', options: { unique: false } },
      { name: 'hashtags', keypath: 'hashtags', options: { unique: false } },
      { name: 'category', keypath: 'category', options: { unique: false } }, 
      { name: 'performing', keypath: 'performing', options: { unique: false } }, 
      { name: 'props', keypath: 'props', options: { unique: false } }, 
      { name: 'setup', keypath: 'setup', options: { unique: false } }, 
      { name: 'notes', keypath: 'notes', options: { unique: false } }, 
    ]
  }]
};

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'note/:id', component: ViewNoteComponent },
  { path: 'edit/:id', component: EditorComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    NoteListComponent,
    ViewNoteComponent,
    CreateNoteComponent,
    MainComponent,
    TabsComponent,
    EditorComponent,
    DeleteConfirmationDialogComponent // Add this
  ],
  imports: [
    BrowserModule,
    NgxIndexedDBModule.forRoot(dbConfig),
    FormsModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule
  ],
  exports: [RouterModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }