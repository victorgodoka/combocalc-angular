import { Component, AfterViewInit } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Card } from '../card.interface';
import { ActivatedRoute } from '@angular/router';
import { ProbabilityData, SharingService } from '../sharing.service';
import { ComboForm } from './combo/combo.component';
import { first, switchMap } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';

@Component({
  templateUrl: './probability.component.html',
  styleUrls: ['./probability.component.css'],
})
export class ProbabilityComponent implements AfterViewInit {
  constructor(
    private readonly fireStore: AngularFirestore,
    private readonly fb: FormBuilder,
    private readonly share: SharingService,
    private readonly route: ActivatedRoute
  ) { }

  public file: any;
  public readonly deckData$ = new BehaviorSubject<Card[]>([]);
  public omega: string;
  public deckname: string = "";
  public shareLink: string = "";

  public readonly dynamicForm = this.fb.array([]);

  public async copyShareLink() {
    let id = this.fireStore.createId();
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    this.shareLink = location.origin + "/share/" + id
    selBox.value = this.shareLink;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    const deckList = this.deckData$.value
    const form = this.dynamicForm.value
    this.share.saveShare(id, { deckList, form })
    alert("Link copied to clipboard!")
  }

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
    this.shareLink = location.origin + "/share/" + this.route.snapshot.params['shareID']
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
    this.deckname = this.file.name
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
        `http://51.222.12.115:7000/convert?pretty&to=json&list=${encodeURIComponent(this.omega)}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.readDeck(JSON.parse(data.formats.json).main);
        });
    }
  }
}
