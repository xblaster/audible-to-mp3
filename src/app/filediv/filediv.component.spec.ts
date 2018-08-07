import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FiledivComponent } from './filediv.component';

describe('FiledivComponent', () => {
  let component: FiledivComponent;
  let fixture: ComponentFixture<FiledivComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FiledivComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FiledivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
