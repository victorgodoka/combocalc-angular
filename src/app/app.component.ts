import { Component } from '@angular/core';

import { FormBuilder, FormArray, FormGroup } from '@angular/forms';

import { Subject, combineLatest } from 'rxjs';
import { map, startWith, withLatestFrom, shareReplay } from 'rxjs/operators';

import { CardCount, comboCalc, SearchGroup } from './utils';
import { Card } from './card.interface';

interface Form {
  searchers: SearchGroup[];
  cards: CardCount[];
  handSize: number;
  deckSize: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private readonly fb: FormBuilder) {}

  public get cards(): FormArray {
    return this.dynamicForm.controls.cards as FormArray;
  }

  public get searchers(): FormArray {
    return this.dynamicForm.controls.searchers as FormArray;
  }

  public get cardGroups(): FormGroup[] {
    return this.cards.controls.filter(
      (control): control is FormGroup => control instanceof FormGroup
    );
  }

  public get searcherGroups(): FormGroup[] {
    return this.searchers.controls.filter(
      (control): control is FormGroup => control instanceof FormGroup
    );
  }

  public file: any;
  public deckData = new Subject<Card[]>();
  public omega: string;

  public dynamicForm = this.fb.group({
    searchers: this.fb.array([]),
    cards: this.fb.array([]),
    deckSize: [0],
    handSize: [5],
  });

  public probability = this.dynamicForm.valueChanges.pipe(
    startWith(0),
    map(({ searchers, cards, handSize, deckSize }: Form) => {
      try {
        return comboCalc(searchers, cards, handSize, deckSize);
      } catch {
        return 0;
      }
    })
  );

  public cardsWithFormInfo = combineLatest([
    this.deckData,
    this.dynamicForm.valueChanges,
  ]).pipe(
    map(([cards, form]) =>
      cards.map((card, i) => ({
        ...card,
        groupID: form.cards.find(({ names }) =>
          names.some?.((name) => name === `${card.name}${i}`)
        )?.id as string | undefined,
        searchGroupID: form.searchers.find(({ names }) =>
          names.some?.((name) => name === `${card.name}${i}`)
        )?.id as string | undefined,
      }))
    ),
    shareReplay(1)
  );

  public test = this.cardsWithFormInfo.subscribe(console.log);

  public addCard(): void {
    this.cards.push(
      this.fb.group({
        id: `${Date.now()}`,
        names: [''],
        minDesired: [0],
        maxDesired: [0],
      })
    );
  }

  public removeCard(): void {
    this.cards.removeAt(this.cards.length - 1);
  }

  public addSearcher(): void {
    this.searchers.push(
      this.fb.group({
        id: `${Date.now()}`,
        names: [''],
        associations: [[]],
      })
    );
  }

  public removeSearcher(): void {
    this.searchers.removeAt(this.cards.length - 1);
  }

  public uploadDeck(e): void {
    this.file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const idDeck = (fileReader.result as string)
        .split('#extra')[0]
        .split('\n')
        .filter(
          (c) => c.length > 0 && !c.startsWith('#') && !c.startsWith('!')
        );
      this.readDeck(idDeck);
    };
    fileReader.readAsText(this.file);
  }

  public readDeck(deck): void {
    this.dynamicForm.controls.deckSize.setValue(deck.length);
    const uniqueIds = [...new Set(deck)];
    fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${uniqueIds.join(',')}`
    )
      .then((res) => res.json())
      .then(({ data }) => {
        this.deckData.next(deck.map((id) => data.find((c) => +c.id === +id)));
      });
  }

  public openDialog(): void {
    this.omega = prompt('Insert Omega Code here.');
    if (this.omega) {
      fetch(
        `https://cors-anywhere.herokuapp.com/http://51.222.12.115:7000/convert?to=json&list=${encodeURIComponent(
          this.omega
        )}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.readDeck(JSON.parse(data.formats.json).main);
        });
    }
  }
}
