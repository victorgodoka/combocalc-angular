import { NgModule } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AngularFireModule } from '@angular/fire';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AngularFirestoreModule } from '@angular/fire/firestore';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ProbabilityComponent } from './probability/probability.component';
import { ComboComponent } from './probability/combo/combo.component';
import { DecklistDialogComponent } from './probability/decklist-dialog/decklist-dialog.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp({
      apiKey: 'AIzaSyDKPUzQgUU6iTsPQ3N7HpWBEQuo7dImy6k',
      authDomain: 'ydkdecklist.firebaseapp.com',
      databaseURL: 'https://ydkdecklist.firebaseio.com',
      projectId: 'ydkdecklist',
      storageBucket: 'ydkdecklist.appspot.com',
      messagingSenderId: '702627875927',
      appId: '1:702627875927:web:b2997a2b1e814020d8e712',
    }),
    AngularFirestoreModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatTableModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    AppRoutingModule,
  ],
  declarations: [AppComponent, ProbabilityComponent, ComboComponent, DecklistDialogComponent],
  bootstrap: [AppComponent],
})
export class AppModule { }
