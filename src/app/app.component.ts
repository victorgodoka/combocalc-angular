import { Component, Inject } from "@angular/core";

import {
  FormControl,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup
} from "@angular/forms";

import { comboCalc } from "./utils";
import { map, catchError, retry, startWith } from "rxjs/operators";
import { of, EMPTY } from "rxjs";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  constructor(private readonly fb: FormBuilder) { }

  public file: any;
  public cardNames: string[];
  public omega: string;

  public dynamicForm = this.fb.group({
    searchers: this.fb.array([]),
    cards: this.fb.array([]),
    deckSize: [0],
    handSize: [0]
  });

  public probablity = this.dynamicForm.valueChanges.pipe(
    startWith(0),
    map(({ searchers, cards, handSize, deckSize }) => {
      console.log(searchers);
      try {
        return comboCalc(searchers, cards, handSize, deckSize)
      } catch {
        return 0
      }
    })
  );

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

  public ngOnInit(): void {
    this.probablity.subscribe({
      next: console.log,
      error: console.error,
      complete: console.warn
    })
  }

  public addCard(): void {
    this.cards.push(
      this.fb.group({
        names: [""],
        copies: [0],
        minDesired: [0],
        maxDesired: [0]
      })
    );
  }

  public removeCard(): void {
    this.cards.removeAt(this.cards.length - 1);
  }

  public addSearcher(): void {
    this.searchers.push(
      this.fb.group({
        names: [""],
        copies: [0],
        associations: [[]]
      })
    );
  }

  public removeSearcher(): void {
    this.searchers.removeAt(this.cards.length - 1);
  }

  public uploadDeck(e) {
    console.log(e.target.files)
    this.file = e.target.files[0];
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      var idDeck = (fileReader.result as string).split("#extra")[0].split("\n").filter(c => c.length > 0 && !c.startsWith("#") && !c.startsWith("!"));
      this.readDeck(idDeck);
    }
    fileReader.readAsText(this.file);
  }

  public readDeck(deck) {
    this.dynamicForm.controls['deckSize'].setValue(deck.length)
    var uniqueIds = [...new Set(deck)]
    fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${uniqueIds.join(",")}`)
      .then((res) => res.json())
      .then(({ data }) => {
        this.cardNames = data.map(c => c.name)
      })
  }

  public openDialog() {
    this.omega = prompt("Insert Omega Code here.")
    if (this.omega) {
      fetch(`https://cors-anywhere.herokuapp.com/http://51.222.12.115:7000/convert?to=json&list=${encodeURIComponent(this.omega)}`)
        .then((res) => res.json())
        .then(({ data }) => {
          this.readDeck(JSON.parse(data.formats.json).main)
        })
    }
  }
}

