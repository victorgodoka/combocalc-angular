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
  public readonly autoCompleteCards$ = new BehaviorSubject<Card[]>([]);
  public selectedCard: string;
  public omega: string;
  public deckName: string = "";
  public shareLink: string = "";
  public deckTextList: string = "";
  public fullDeckList: any;
  public formatExports: any;
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
    const formatExports = this.formatExports
    this.share.saveShare(id, { deckList, form, fullDeckList, formatExports })
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
        const { deckList, form, fullDeckList, formatExports } = data as ProbabilityData;

        setTimeout(() => {
          this.deckData$.next(deckList);
          this.fullDeckList = fullDeckList;
          this.formatExports = formatExports;
          this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
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
        `https://api.duelistsunite.org/decks/convert?pretty&list=${encodeURIComponent(fileReader.result as string)}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.fullDeckList = JSON.parse(data.formats.json)
          this.formatExports = data.formats;
          this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
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
        `https://api.duelistsunite.org/decks/convert?pretty&list=${encodeURIComponent(this.omega)}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.fullDeckList = JSON.parse(data.formats.json);
          this.formatExports = data.formats;
          this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
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
      if (decklist) {
        fetch(
          `https://api.duelistsunite.org/decks/convert?pretty&list=${encodeURIComponent(decklist)}`
        )
          .then((res) => res.json())
          .then(({ data }) => {
            this.fullDeckList = JSON.parse(data.formats.json);
            this.formatExports = data.formats;
            this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
            this.readDeck(JSON.parse(data.formats.json).main);
          });
      }
    });
  }

  public dyanmicDownloadByHtmlTag(input: string, format: string) {
    const text = this.formatExports[input]
    console.log(this.formatExports, text)
    const element = { dynamicDownload: null as HTMLElement }
    element.dynamicDownload = document.createElement('a');
    element.dynamicDownload.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.dynamicDownload.setAttribute('download', this.deckName.replace(".ydk", "") + format);
    var event = new MouseEvent("click");
    element.dynamicDownload.dispatchEvent(event);
  }

  public copyCodes(code: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.formatExports[code];
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    alert("Code copied to clipboard!")
  }

  public deleteCard(deck: string, index: number, cardID: number) {
    let _fullDeckListIdx = this.fullDeckList[deck].indexOf(cardID);
    let _deckDataIdx = this.deckData$.value.findIndex(c => c.id === cardID)
    if (_fullDeckListIdx > -1) {
      this.fullDeckList[deck].splice(_fullDeckListIdx, 1);
    }
    if (_deckDataIdx > -1) {
      let _temp = this.deckData$.value
      _temp.splice(_deckDataIdx, 1)
      this.deckData$.next(_temp)
    }
  }

  public getLimitations (cardData: Card, deck: string) : boolean {
    let result = true

    if (deck === 'main' && this.fullDeckList[deck].length >= 60) {
      result = false
      alert('You already have the max cars in this deck.')
    }

    if (deck === 'extra' && this.fullDeckList[deck].length >= 15) {
      result = false
      alert('You already have the max cars in the Extra deck.')
    }

    if (this.fullDeckList[deck].filter(card => card.id === cardData.id).length >= 3) {
      result = false
      alert('You already have the max copies of this card.')
    }

    return result
  }

  public addCard(cardID: number) {
    if (cardID) {
      fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardID}`)
        .then(res => res.json())
        .then(({ data }) => {
          let cardData: Card = data[0]
          let deck = (cardData.type.includes("Link") || cardData.type.includes("Synchro") || cardData.type.includes("Fusion") || cardData.type.includes("XYZ")) ? "extra" : "main"
          if (this.getLimitations (cardData, deck)) {
            this.fullDeckList[deck].push(cardData.id);
            let _temp = this.deckData$.value
            _temp.push(cardData)
            this.deckData$.next(_temp)
          }
        })
        .finally(() => this.selectedCard = '')
    }
  }

  public searchForCards () {
    if (this.selectedCard.length > 3) {
      fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${this.selectedCard}`)
        .then(res => res.json())
        .then(({ data }) => {
          let cardData: Card[] = data
          this.autoCompleteCards$.next(cardData)
        })
    }
  }

} 
