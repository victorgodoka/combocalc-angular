import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormArray, FormGroup } from '@angular/forms';

import { Subscription, BehaviorSubject } from 'rxjs';
import { map, startWith, shareReplay, switchMap, first } from 'rxjs/operators';


import { Card } from '../../card.interface';
import { CardCount, comboCalc, SearchGroup } from '../../utils';

export interface ComboForm {
  cards: CardCount[];
  searchers: SearchGroup[];
  handSize: number;
}

@Component({
  selector: 'app-combo',
  templateUrl: './combo.component.html',
  styleUrls: ['./combo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboComponent implements OnChanges {
  constructor(private readonly fb: FormBuilder) { }

  private readonly subscriptions = new Subscription();

  @Input()
  public readonly indexForm: any;

  @Input()
  public readonly handSize: any;

  @Input()
  public readonly form = this.fb.group({});

  @Input()
  public readonly deckData: Card[] = [];

  @Output() onProbability: EventEmitter<any> = new EventEmitter<any>();

  public get cards(): FormArray {
    return this.form.controls.cards as FormArray;
  }

  public get searchers(): FormArray {
    return this.form.controls.searchers as FormArray;
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

  public form$ = new BehaviorSubject(this.form);
  public formValue$ = this.form$.pipe(
    switchMap((form) => form?.valueChanges.pipe(startWith(form.value))),
    shareReplay(1)
  );
  public readonly probability = this.formValue$.pipe(
    startWith(0),
    map(({ searchers, cards }: ComboForm) => {
      try {
        let _calc = comboCalc(searchers, cards, this.handSize, this.deckData.length);
        let ev = { value: _calc, index: this.indexForm }
        this.onProbability.emit(ev)
        return _calc
      } catch {
        return 0;
      }
    })
  );

  public readonly cardsWithFormInfo = this.formValue$.pipe(
    map((form) => {
      return this.deckData.map((card, i) => ({
        ...card,
        groupID: form.cards.find(({ names }) =>
          names.some?.((name) => name === `${card.name}${i}`)
        )?.id as string | undefined,
        searchGroupID: form.searchers.find(({ names }) =>
          names.some?.((name) => name === `${card.name}${i}`)
        )?.id as string | undefined,
      }));
    })
  );

  public changeMax(e, group) {
    group.controls.maxDesired.value = group.controls.names.value.length
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes?.form) {
      this.form$.next(changes.form.currentValue);
    } else {
      this.form$.next(this.form);
    }
  }

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
}
