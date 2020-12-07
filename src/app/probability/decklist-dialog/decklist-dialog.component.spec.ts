import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DecklistDialogComponent } from './decklist-dialog.component';

describe('DecklistDialogComponent', () => {
  let component: DecklistDialogComponent;
  let fixture: ComponentFixture<DecklistDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DecklistDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DecklistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
