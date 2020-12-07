import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Card } from '../card.interface';
import { ActivatedRoute } from '@angular/router';
import { ProbabilityData, SharingService } from '../sharing.service';
import { ComboForm } from './combo/combo.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DecklistDialogComponent } from './decklist-dialog/decklist-dialog.component';

@Component({
  templateUrl: './probability.component.html',
  styleUrls: ['./probability.component.css'],
})
export class ProbabilityComponent implements AfterViewInit {
  constructor(
    private readonly fireStore: AngularFirestore,
    private elem: ElementRef,
    private readonly fb: FormBuilder,
    private readonly share: SharingService,
    private readonly route: ActivatedRoute,
    public readonly decklistTextDialog: MatDialog
  ) { }

  public file: any;
  public readonly deckData$ = new BehaviorSubject<Card[]>([]);
  public omega: string;
  public deckName: string = "";
  public shareLink: string = "";
  public deckTextList: string = "";
  public fullDeckList: any;
  public fullProbability: number;

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
    const fullDeckList = this.fullDeckList
    this.share.saveShare(id, { deckList, form, fullDeckList })
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

  public probabilitySubscriber = this.dynamicForm.valueChanges.subscribe(() => {
    setTimeout(() => {
      let _sum = (Array.from(this.elem.nativeElement.querySelectorAll("[data-probability]")).reduce((a: any, e: any) => parseFloat(e.outerText.replace("%", "")) + a, 0) as number) / 100
      this.fullProbability = Math.min(_sum, 1)
    });
  })

  public ngAfterViewInit(): void {
    this.shareLink = location.origin + "/share/" + this.route.snapshot.params['shareID']
    this.route.data.subscribe(({ data }) => {
      if (data) {
        const { deckList, form, fullDeckList } = data as ProbabilityData;

        setTimeout(() => {
          this.deckData$.next(deckList);
          this.fullDeckList.next(fullDeckList);
          form.forEach((combo) => this.addCombo(combo));
        });
      }
    });
  }

  public uploadDeck(e): void {
    this.file = e.target.files[0];
    this.deckName = this.file.name
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const idDeck = (fileReader.result as string)
        .split('#extra')[0]
        .split('\n')
        .filter(
          (c) => c.length > 0 && !c.startsWith('#') && !c.startsWith('!')
        );

      fetch(
        `https://api.duelistsunite.org/decks/convert?pretty&to=json&list=${encodeURIComponent(fileReader.result as string)}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.fullDeckList = JSON.parse(data.formats.json)
        });
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

  public importOmega(): void {
    this.omega = prompt('Insert Omega Code here.');
    if (this.omega) {
      fetch(
        `https://api.duelistsunite.org/decks/convert?pretty&to=json&list=${encodeURIComponent(this.omega)}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.fullDeckList = JSON.parse(data.formats.json);
          this.readDeck(JSON.parse(data.formats.json).main);
        });
    }
  }

  public importText(): void {
    const decklistDialog = this.decklistTextDialog.open(DecklistDialogComponent, {
      width: '100%',
      data: {
        deckName: this.deckName,
        decklist: this.deckTextList
      }
    })

    decklistDialog.afterClosed().subscribe(({ deckName, decklist }) => {
      this.deckName = deckName || ""
      if(decklist) {
        fetch(
          `https://api.duelistsunite.org/decks/convert?pretty&to=json&list=${encodeURIComponent(decklist)}`
        )
          .then((res) => res.json())
          .then(({ data }) => {
            this.fullDeckList = JSON.parse(data.formats.json);
            this.readDeck(JSON.parse(data.formats.json).main);
          });
      }
    });
  }
}
