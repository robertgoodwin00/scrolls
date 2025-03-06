import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})
export class TabsComponent implements OnInit {
  tabs = ['Sleights', 'Tricks', 'Routines', 'Acts'];
  activeTabIndex = 1; // Tricks as the default tab

  @Output() tabSelected = new EventEmitter<number>(); // Changed name to 'tabSelected'

  selectTab(index: number) {
    this.activeTabIndex = index;
    this.tabSelected.emit(index);
  }

  ngOnInit() {}
}