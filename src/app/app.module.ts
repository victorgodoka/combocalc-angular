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
import { MatTableModule  } from '@angular/material/table';
import { MatSlideToggleModule  } from '@angular/material/slide-toggle';
import {AngularFireModule} from '@angular/fire';
import {AngularFirestoreModule} from '@angular/fire/firestore';

import { AppComponent } from './app.component';
import {AppRoutingModule} from './app-routing.module';
import { ProbabilityComponent } from './probability/probability.component';
import { ComboComponent } from './probability/combo/combo.component';

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
    MatSlideToggleModule,
    AppRoutingModule,
  ],
  declarations: [AppComponent, ProbabilityComponent, ComboComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
