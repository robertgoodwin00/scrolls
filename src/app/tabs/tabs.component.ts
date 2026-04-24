import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SyncService } from '../sync.service';
import { NoteService } from '../note.service';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { environment } from '../environments/environment';

@Component({
  standalone: false,
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent implements OnInit {
  tabs = ['General', 'Sleights', 'Tricks', 'Routines', 'Acts'];
  activeTabIndex = 2;

  private readonly MIN_PASSWORD_LENGTH = 8;

  @Output() tabSelected = new EventEmitter<number>();
  @Output() notesImported = new EventEmitter<void>();
  @Output() notesCleared = new EventEmitter<void>(); 

  constructor(
    private syncService: SyncService, 
    private noteService: NoteService,
    private dialog: MatDialog
  ) {}

  selectTab(index: number) {
    this.activeTabIndex = index;
    this.tabSelected.emit(index);
  }

  private validatePassword(password: string): boolean {
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      alert(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long.`);
      return false;
    }
    return true;
  }

  /* old. didn't check for https
  exportData() {
    const password = prompt('Warning: If data with the same password exists on server it will be replaced.\n\nEnter password to export this data under:');
    if (password) {
      this.syncService.exportNotes(password).subscribe({
        next: (response) => {
          console.log('Export successful:', response);
          alert('Notes exported successfully');
        },
        error: (error) => {
          console.error('Export failed:', error);
          alert('Export failed: ' + (error.error?.error || error.message));
        }
      });
    }
  } */


  exportData() {
    // Check for HTTPS in production
    if (environment.production && location.protocol !== 'https:' && !location.hostname.includes('localhost')) {
      alert('Export is only available over secure connections (HTTPS).');
      return;
    }

    const password = prompt('Warning: If data with the same password exists on server it will be replaced.\n\nEnter password to export this data under (minimum 8 characters):');
    if (password && this.validatePassword(password)) {
      this.syncService.exportNotes(password).subscribe({
        next: (response) => {
          console.log('Export successful:', response);
          alert('Notes exported successfully');
        },
        error: (error) => {
          console.error('Export failed:', error);
          alert('Export failed: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  importData() {
    const password = prompt('Warning: Any existing data will be replaced by imported data.\n\nEnter password to import:');
    if (password) {
      this.syncService.importNotes(password).subscribe({
        next: (notes) => {
          console.log('Import successful, updated notes:', notes);
          alert('Notes imported successfully');
          this.notesImported.emit();
        },
        error: (error) => {
          console.error('Import failed:', error);
          alert('Import failed: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  /* old which uses confirm (inconsistently when it could use matDialog)
  async clearData() {
    const confirmed = confirm('Are you sure you want to clear all data? If your data has not been exported to the server it will be lost forever.');
    if (confirmed) {
      const notes = await lastValueFrom(this.noteService.getAllNotes());
      const deleteOperations = notes.map(note => this.noteService.deleteNote(note.id!));
      await Promise.all(deleteOperations.map(op => lastValueFrom(op)));
      console.log('All notes cleared');
      this.notesCleared.emit();
    }
  }
    */

  
  async clearData() {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '350px',
      data: { 
        title: 'Clear All Data',
        message: 'Are you sure you want to clear all data? If your data has not been exported to the server it will be lost forever.',
        confirmText: 'Clear All',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        const notes = await lastValueFrom(this.noteService.getAllNotes());
        const deleteOperations = notes.map(note => this.noteService.deleteNote(note.id!));
        await Promise.all(deleteOperations.map(op => lastValueFrom(op)));
        console.log('All notes cleared');
        this.notesCleared.emit();
      }
    });
  }

    

  

  ngOnInit() {}
}


//tabs = ['General', 'Sleights', 'Tricks', 'Routines', 'Acts'];