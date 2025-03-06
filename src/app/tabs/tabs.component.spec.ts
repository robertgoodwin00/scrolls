import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test default active tab
  it('should have default active tab index as 1', () => {
    expect(component.activeTabIndex).toBe(1);
  });

  // Test tab selection
  it('should select tab and emit event', () => {
    spyOn(component.tabSelected, 'emit');
    component.selectTab(2);
    expect(component.activeTabIndex).toBe(2);
    expect(component.tabSelected.emit).toHaveBeenCalledWith(2);
  });

  // Test tab list initialization
  it('should initialize tabs', () => {
    expect(component.tabs).toEqual(['Sleights', 'Tricks', 'Routines', 'Acts']);
  });
});
