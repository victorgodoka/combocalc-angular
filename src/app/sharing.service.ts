import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Card } from './card.interface';
import { ComboForm } from './probability/combo/combo.component';

export interface ProbabilityData {
  form: ComboForm[];
  deckList: Card[];
}

export interface ShareDoc {
  encoded: string;
}

@Injectable({
  providedIn: 'root',
})
export class SharingService {
  constructor(private readonly fireStore: AngularFirestore) {}

  public decode(base64String: string): ProbabilityData {
    return JSON.parse(atob(base64String));
  }

  public encode(data: ProbabilityData): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  public async findByShareID(id: string): Promise<ProbabilityData | null> {
    const doc = await this.fireStore.doc<ShareDoc>(`shares/${id}`).ref.get();
    const data = doc.data();
    return data ? this.decode(data.encoded) : null;
  }

  public saveShare (docID: string, data: ProbabilityData): void {
    const encoded = this.encode(data);
    console.log("aaa", docID, data)
    this.fireStore.doc<ShareDoc>(`shares/${docID}`).set({ encoded });
  }
}
