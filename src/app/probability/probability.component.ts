import { Component, AfterViewInit } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Card } from '../card.interface';
import { ActivatedRoute } from '@angular/router';
import { ProbabilityData, SharingService } from '../sharing.service';
import { ComboForm } from './combo/combo.component';
import { switchMap } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';

@Component({
  templateUrl: './probability.component.html',
  styleUrls: ['./probability.component.css'],
})
export class ProbabilityComponent implements AfterViewInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly share: SharingService,
    private readonly route: ActivatedRoute
  ) {}

  public file: any;
  public readonly deckData$ = new BehaviorSubject<Card[]>([]);
  public omega: string;

  public readonly dynamicForm = this.fb.array([]);

  public readonly shareLink = combineLatest([this.deckData$, this.dynamicForm.valueChanges]).pipe(
    switchMap(([deckList, form]) => this.share.share({ deckList, form }))
  );

  public addCombo = (combo?: ComboForm) => {
    const cards = combo?.cards?.map((card) =>
      this.fb.group(
        Object.fromEntries(
          Object.entries(card).map(([key, value]) => [key, [value]])
        )
      )
    );
    const searchers = combo?.searchers?.map((searcher) =>
      this.fb.group(
        Object.fromEntries(
          Object.entries(searcher).map(([key, value]) => [key, [value]])
        )
      )
    );

    this.dynamicForm.push(
      this.fb.group({
        cards: this.fb.array(cards ?? []),
        searchers: this.fb.array(searchers ?? []),
        handSize: [combo?.handSize ?? 5],
      })
    );
  }

  public ngAfterViewInit(): void {
    this.route.data.subscribe(({ data }) => {
      if (data) {
        const { deckList, form } = data as ProbabilityData;

        setTimeout(() => {
          this.deckData$.next(deckList);
          form.forEach((combo) => this.addCombo(combo));
        });
      }
    });
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
    const uniqueIds = [...new Set(deck)];
    fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${uniqueIds.join(',')}`
    )
      .then((res) => res.json())
      .then(({ data }) => {
        this.deckData$.next(deck.map((id) => data.find((c) => +c.id === +id)));
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
