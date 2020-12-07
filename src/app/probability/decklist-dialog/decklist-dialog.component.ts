import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-decklist-dialog',
  templateUrl: './decklist-dialog.component.html',
  styleUrls: ['./decklist-dialog.component.css']
})
export class DecklistDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit(): void {
  }

  placeholder: string = `3 Harpie Lady
3 Harpie Channeler
...`
}
