import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable, pipe, Subscription } from 'rxjs';
import { Card } from '../card.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { ProbabilityData, SharingService } from '../sharing.service';
import { ComboForm } from './combo/combo.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DecklistDialogComponent } from './decklist-dialog/decklist-dialog.component';
import { shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  templateUrl: './probability.component.html',
  styleUrls: ['./probability.component.css'],
})
export class ProbabilityComponent implements AfterViewInit {
  constructor(
    private readonly fireStore: AngularFirestore,
    private readonly fb: FormBuilder,
    private readonly share: SharingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public readonly decklistTextDialog: MatDialog
  ) {
    this.Math = Math;
  }

  public file: any;
  Math: any;
  public readonly deckData$ = new BehaviorSubject<Card[]>([]);
  public readonly autoCompleteCards$ = new BehaviorSubject<Card[]>([]);
  public selectedCard: string;
  public omega: string;
  public deckName: string = "";
  public shareLink: string = "";
  public deckTextList: string = "";
  public fullDeckList: any = "";
  public formatExports: any;
  public handSize: number = 5;
  public allProb: number[] = [];
  public fullProbability: any = 0;
  public fullPrice: any = 0;
  public _currentShuffled: any = 0;
  public _hand: any = 0;
  public isLoading: boolean = false;

  public readonly dynamicForm = this.fb.array([]);

  public async copyShareLink() {
    let id = this.fireStore.createId();
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    this.shareLink = location.origin + "/combo/#/share/" + id
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
    const handSize = this.handSize
    this.share.saveShare(id, { deckList, form, fullDeckList, formatExports, handSize })
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
        searchers: this.fb.array(searchers ?? [])
      })
    );
  }

  public sumAll($event: any): void {
    this.allProb[$event.index] = $event.value
    this.fullProbability = Math.min(this.allProb.reduce((b, a) => a + b, 0), 1)
    if ($event.delete) {
      this.allProb.splice($event.index, 1)
      this.fullProbability = Math.min(this.allProb.reduce((b, a) => a + b, 0), 1)
      this.dynamicForm.removeAt($event.index)
    }
  }

  public ngAfterViewInit(): void {
    this.shareLink = location.origin + "/combo/#/share/" + this.route.snapshot.params['shareID']
    if (this.route.snapshot.params['omegacode']) {
      let omega = decodeURIComponent(this.route.snapshot.params['omegacode'])
      this.importOmega(omega)
    }
    this.route.data.subscribe(({ data }) => {
      this.isLoading = true;
      if (data) {
        const { deckList, form, fullDeckList, formatExports, handSize } = data as ProbabilityData;

        setTimeout(() => {
          this.deckData$.next(deckList);
          this.formatExports = formatExports;
          this.changeDecklist(fullDeckList)
          this.handSize = Math.min(handSize, deckList.length);
          this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
          form.forEach((combo) => this.addCombo(combo));
        });
      }
      this.isLoading = false;
    });
  }

  public reset(): void {
    if (this.route.toString().includes('share') || this.route.toString().includes('omega')) {
      this.router.navigate(['/']);
    } else {
      location.reload();
    }
  }

  public disableNaN(evt) {
    if (evt.which < 48 || evt.which > 57) {
      evt.preventDefault();
    }
  }

  public checkMax($event) {
    if (+$event.target.value >= this.deckData$.value.length) {
      $event.target.value = this.deckData$.value.length
    } else if (+$event.target.value <= 0) {
      $event.target.value = 0;
    }
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
          this.formatExports = data.formats;
          this.changeDecklist(JSON.parse(data.formats.json))
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

  public importOmega(omegaCode): void {
    this.isLoading = true;
    this.omega = omegaCode || prompt('Insert Omega or YDKe Code here.');
    if (this.omega) {
      fetch(
        `https://api.duelistsunite.org/decks/convert?pretty&list=${encodeURIComponent(this.omega)}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.changeDecklist(JSON.parse(data.formats.json))
          this.formatExports = data.formats;
          this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
          this.readDeck(JSON.parse(data.formats.json).main);
        })
        .finally(() => this.isLoading = false);
    }
  }

  public importText(): void {
    this.isLoading = true;
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
            this.changeDecklist(JSON.parse(data.formats.json))
            this.formatExports = data.formats;
            this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
            this.readDeck(JSON.parse(data.formats.json).main);
          })
          .finally(() => this.isLoading = false);
      }
    });
  }

  public dyanmicDownloadByHtmlTag(input: string, format: string) {
    const text = this.formatExports[input]
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
      let _data = this.fullDeckList;
      _data[deck].splice(_fullDeckListIdx, 1);
      this.changeDecklist(_data)
    }
    if (_deckDataIdx > -1) {
      let _temp = this.deckData$.value
      _temp.splice(_deckDataIdx, 1)
      this.deckData$.next(_temp)
    }
  }

  public getLimitations(cardData: Card, deck: string): boolean {
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
          if (this.getLimitations(cardData, deck)) {
            let _data = this.fullDeckList
            _data[deck].push(cardData.id)
            this.changeDecklist(_data)
            let _temp = this.deckData$.value
            _temp.push(cardData)
            this.deckData$.next(_temp)
          }
        })
        .finally(() => this.selectedCard = '')
    }
  }

  public searchForCards() {
    if (this.selectedCard.length > 3) {
      fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${this.selectedCard}`)
        .then(res => res.json())
        .then(({ data }) => {
          let cardData: Card[] = data
          this.autoCompleteCards$.next(cardData)
        })
    }
  }

  public async changeDecklist(deck) {
    this.isLoading = true
    this.fullDeckList = deck;
    let ids = deck?.main.concat(deck?.extra).concat(deck?.side)

    let names = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids.join(",")}`)
      .then(res => res.json())
      .then(({ data }) => data)

    let allCards = ids.map(id => names.find(card => card.id === id))
    let allPrices = allCards.map(card => card?.card_prices[0] || {
      cardmarket_price: 0,
      tcgplayer_price: 0,
      ebay_price: 0,
      amazon_price: 0,
      coolstuffinc_price: 0
    })

    this.fullPrice = allPrices.reduce((a: any, b: any) => {
      return {
        cardmarket_price: parseFloat(b.cardmarket_price) + parseFloat(a.cardmarket_price),
        tcgplayer_price: parseFloat(b.tcgplayer_price) + parseFloat(a.tcgplayer_price),
        ebay_price: parseFloat(b.ebay_price) + parseFloat(a.ebay_price),
        amazon_price: parseFloat(b.amazon_price) + parseFloat(a.amazon_price),
        coolstuffinc_price: parseFloat(b.coolstuffinc_price) + parseFloat(a.coolstuffinc_price),
      }
    })
  }

  public getHand() {
    const shuffle = (array) => {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }
    this._currentShuffled = shuffle(this.fullDeckList.main)
    this._hand = this._currentShuffled.slice(0, this.handSize)
  }

  public drawOne() {
    this._hand = [...this._hand, this._currentShuffled[this._hand.length]]
  }
}
