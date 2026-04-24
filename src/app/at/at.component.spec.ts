import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtComponent } from './at.component';

describe('AtComponent', () => {
  let component: AtComponent;
  let fixture: ComponentFixture<AtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
