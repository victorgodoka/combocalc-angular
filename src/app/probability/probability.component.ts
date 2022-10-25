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
  public comboLength: number = 0;
  public selectedCard: string;
  public omega: string;
  public deckName: string = 'Deck';
  public shareLink: string = '';
  public deckTextList: string = '';
  public fullDeckList: any = '';
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
        searchers: this.fb.array(searchers ?? []),
      })
    );
  };

  public sumAll($event: any): void {
    this.allProb[$event.index] = $event.value;
    if ($event.delete) {
      this.allProb.splice($event.index, 1);
      this.dynamicForm.removeAt($event.index);
    }
    let calc = 0;
    if (this.allProb.length >= 5) {
      calc =
        this.allProb.reduce((a, b) => b + a, 0) -
        (this.allProb[0] * this.allProb[1] +
          this.allProb[0] * this.allProb[2] +
          this.allProb[0] * this.allProb[3] +
          this.allProb[0] * this.allProb[4] +
          this.allProb[1] * this.allProb[2] +
          this.allProb[1] * this.allProb[3] +
          this.allProb[1] * this.allProb[4] +
          this.allProb[2] * this.allProb[3] +
          this.allProb[2] * this.allProb[4] +
          this.allProb[3] * this.allProb[4]) +
        (this.allProb[0] * this.allProb[1] * this.allProb[2] +
          this.allProb[0] * this.allProb[1] * this.allProb[3] +
          this.allProb[0] * this.allProb[1] * this.allProb[4] +
          this.allProb[0] * this.allProb[2] * this.allProb[3] +
          this.allProb[0] * this.allProb[2] * this.allProb[4] +
          this.allProb[0] * this.allProb[3] * this.allProb[4] +
          this.allProb[1] * this.allProb[2] * this.allProb[3] +
          this.allProb[1] * this.allProb[2] * this.allProb[4] +
          (this.allProb[1] * this.allProb[3] + this.allProb[4]) +
          this.allProb[2] * this.allProb[3] * this.allProb[4]) -
        (this.allProb[0] * this.allProb[1] * this.allProb[2] * this.allProb[3] +
          this.allProb[0] *
            this.allProb[1] *
            this.allProb[2] *
            this.allProb[4] +
          this.allProb[0] *
            this.allProb[1] *
            this.allProb[3] *
            this.allProb[4] +
          this.allProb[0] *
            this.allProb[2] *
            this.allProb[3] *
            this.allProb[4] +
          this.allProb[1] *
            this.allProb[2] *
            this.allProb[3] *
            this.allProb[4]) +
        this.allProb.reduce((a, b) => b * a, 1);
    } else if (this.allProb.length === 4) {
      calc =
        this.allProb.reduce((a, b) => b + a, 0) -
        (this.allProb[0] * this.allProb[1] +
          this.allProb[0] * this.allProb[2] +
          this.allProb[0] * this.allProb[3] +
          this.allProb[1] * this.allProb[2] +
          this.allProb[1] * this.allProb[3] +
          this.allProb[2] * this.allProb[3]) +
        (this.allProb[0] * this.allProb[1] * this.allProb[2] +
          this.allProb[1] * this.allProb[2] * this.allProb[3] +
          this.allProb[0] * this.allProb[2] * this.allProb[3] +
          this.allProb[0] * this.allProb[1] * this.allProb[3]) -
        this.allProb.reduce((a, b) => b * a, 1);
    } else if (this.allProb.length === 3) {
      calc =
        this.allProb.reduce((a, b) => b + a, 0) -
        (this.allProb[0] * this.allProb[1] +
          this.allProb[0] * this.allProb[2] +
          this.allProb[1] * this.allProb[2]) +
        this.allProb.reduce((a, b) => b * a, 1);
    } else if (this.allProb.length === 2) {
      calc =
        this.allProb.reduce((a, b) => b + a, 0) -
        this.allProb.reduce((a, b) => b * a, 1);
    } else {
      calc = this.allProb.reduce((a, b) => b + a, 0);
    }

    this.fullProbability = Math.min(calc, 1);
  }

  public ngAfterViewInit(): void {
    this.shareLink = location.origin + "/combo/#/share/" + this.route.snapshot.params['shareID']
    if (this.route.snapshot.params['omegacode']) {
      let omega = decodeURIComponent(this.route.snapshot.params['omegacode'])
      this.importOmega(omega)
    }
    this.route.data.subscribe(({ data }) => {
      if (data) {
        this.isLoading = true;
        const { deckList, form, fullDeckList, formatExports, handSize } = data as ProbabilityData;

        setTimeout(() => {
          this.deckData$.next(deckList);
          this.formatExports = formatExports;
          this.changeDecklist(fullDeckList)
          this.handSize = Math.min(handSize, deckList.length);
          // this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
          form.forEach((combo) => this.addCombo(combo));
          this.isLoading = false;
        });
      }
    });
  }

  public reset(): void {
    if (
      this.route.toString().includes('share') ||
      this.route.toString().includes('omega')
    ) {
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
      $event.target.value = this.deckData$.value.length;
    } else if (+$event.target.value <= 0) {
      $event.target.value = 0;
    }
  }

  public uploadDeck(e): void {
    this.file = e.target.files[0];
    this.deckName = this.file.name.replace('.ydk', '');
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const idDeck = (fileReader.result as string)
        .split('#extra')[0]
        .split('\r\n')
        .filter((c) => c.length > 0 && !c.startsWith('#') && !c.startsWith('!'))
        .map((n) => parseInt(n));

      fetch(
        `https://web.duelistsunite.org/omega-api-decks/convert?token=fc251ea703476dea9f037898611a14fa3d3e4cde99f6b3b81b4e25&pretty&list=${encodeURIComponent(
          fileReader.result as string
        )}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.formatExports = data.formats;
          this.changeDecklist(JSON.parse(data.formats.json));
          // this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
        });
      this.readDeck(idDeck);
    };
    fileReader.readAsText(this.file);
  }

  public readDeck(deck): void {
    fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${deck.join(',')}`)
      .then((res) => res.json())
      .then(({ data }) => {
        let _deck = deck.map((id) =>
          data.find(
            (c) =>
              +c.id === +id || c.card_images.map(({ id }) => id).includes(id)
          )
        );
        console.log(_deck);
        return _deck;
      })
      .then((_deck) => this.deckData$.next(_deck))
      .finally(() => (this.isLoading = false));
  }

  public importOmega(omegaCode): void {
    this.omega = omegaCode || prompt('Insert Omega or YDKe Code here.');
    if (this.omega) {
      this.isLoading = true;
      fetch(
        `https://web.duelistsunite.org/omega-api-decks/convert?token=fc251ea703476dea9f037898611a14fa3d3e4cde99f6b3b81b4e25&pretty&list=${encodeURIComponent(
          this.omega
        )}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          this.changeDecklist(JSON.parse(data.formats.json));
          this.formatExports = data.formats;
          // this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
          this.readDeck(JSON.parse(data.formats.json).main);
        })
        .finally(() => (this.isLoading = false));
    }
  }

  public importText(): void {
    const decklistDialog = this.decklistTextDialog.open(
      DecklistDialogComponent,
      {
      width: '100%',
      data: {
        deckName: this.deckName,
          decklist: this.deckTextList,
        },
      }
    );

    decklistDialog.afterClosed().subscribe(({ deckName, decklist }) => {
      this.deckName = deckName || '';
      if (decklist) {
        this.isLoading = true;
        fetch(
          `https://web.duelistsunite.org/omega-api-decks/convert?token=fc251ea703476dea9f037898611a14fa3d3e4cde99f6b3b81b4e25&pretty&list=${encodeURIComponent(
            decklist
          )}`
        )
          .then((res) => res.json())
          .then(({ data }) => {
            this.changeDecklist(JSON.parse(data.formats.json));
            this.formatExports = data.formats;
            // this.formatExports['imagefy'] = encodeURIComponent(this.formatExports.omega)
            this.readDeck(JSON.parse(data.formats.json).main);
          })
          .finally(() => (this.isLoading = false));
      }
    });
  }

  public dyanmicDownloadByHtmlTag(input: string, format: string) {
    this.deckName = this.deckName + format;
    const text = this.formatExports[input];
    const element = { dynamicDownload: null as HTMLElement };
    element.dynamicDownload = document.createElement('a');
    element.dynamicDownload.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
    );
    element.dynamicDownload.setAttribute('download', this.deckName);
    var event = new MouseEvent('click');
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
    alert('Code copied to clipboard!');
  }

  public deleteCard(deck: string, index: number, cardID: number) {
    let _fullDeckListIdx = this.fullDeckList[deck].indexOf(cardID);
    let _deckDataIdx = this.deckData$.value.findIndex((c) => c.id === cardID);
    if (_fullDeckListIdx > -1) {
      let _data = this.fullDeckList;
      _data[deck].splice(_fullDeckListIdx, 1);
      this.changeDecklist(_data);
    }
    if (_deckDataIdx > -1) {
      let _temp = this.deckData$.value;
      _temp.splice(_deckDataIdx, 1);
      this.deckData$.next(_temp);
    }
  }

  public getLimitations(cardData: Card, deck: string): boolean {
    let result = true;

    if (deck === 'main' && this.fullDeckList[deck].length >= 60) {
      result = false;
      alert('You already have the max cars in this deck.');
    }

    if (deck === 'extra' && this.fullDeckList[deck].length >= 15) {
      result = false;
      alert('You already have the max cars in the Extra deck.');
    }

    if (
      this.fullDeckList[deck].filter((card) => card.id === cardData.id)
        .length >= 3
    ) {
      result = false;
      alert('You already have the max copies of this card.');
    }

    return result;
  }

  public addCard(cardID: number) {
    if (cardID) {
      fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardID}`)
        .then((res) => res.json())
        .then(({ data }) => {
          let cardData: Card = data[0];
          let deck =
            cardData.type.includes('Link') ||
            cardData.type.includes('Synchro') ||
            cardData.type.includes('Fusion') ||
            cardData.type.includes('XYZ')
              ? 'extra'
              : 'main';
          if (this.getLimitations(cardData, deck)) {
            let _data = this.fullDeckList;
            _data[deck].push(cardData.id);
            this.changeDecklist(_data);
            let _temp = this.deckData$.value;
            _temp.push(cardData);
            this.deckData$.next(_temp);
          }
        })
        .finally(() => (this.selectedCard = ''));
    }
  }

  public searchForCards() {
    if (this.selectedCard.length > 3) {
      fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${this.selectedCard}`
      )
        .then((res) => res.json())
        .then(({ data }) => {
          let cardData: Card[] = data;
          this.autoCompleteCards$.next(cardData);
        });
    }
  }

  public async changeDecklist(deck) {
    this.fullDeckList = deck;
    this.isLoading = true;
    let mainNames = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${deck?.main.join(',')}`
    )
      .then((res) => res.json())
      .then(({ data }) => data);

    let extraNames = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${deck?.extra.join(
        ','
      )}`
    )
      .then((res) => res.json())
      .then(({ data }) => data);

    this.fullDeckList = {
      main: deck?.main.map((id) =>
        mainNames.find(
          (card) =>
            card.id === id || card.card_images.map((img) => img.id).includes(id)
        )
      ),
      extra: deck?.extra.map((id) =>
        extraNames.find(
          (card) =>
            card.id === id || card.card_images.map((img) => img.id).includes(id)
        )
      ),
    };

    setTimeout(() => (this.isLoading = false), 1000);

    console.log(this.fullDeckList);
  }

  public getHand() {
    const shuffle = (array) => {
      var currentIndex = array.length,
        temporaryValue,
        randomIndex;

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
    };
    this._currentShuffled = shuffle(this.fullDeckList.main.slice());
    this._hand = this._currentShuffled.slice(0, this.handSize);
  }

  public drawOne() {
    this._hand = [...this._hand, this._currentShuffled[this._hand.length]];
  }
}
