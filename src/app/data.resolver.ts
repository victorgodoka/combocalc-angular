import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
} from '@angular/router';

import { ProbabilityData, SharingService } from './sharing.service';


@Injectable({
  providedIn: 'root',
})
export class DataResolver implements Resolve<ProbabilityData> {
  constructor(private readonly sharing: SharingService) {}

  public resolve(route: ActivatedRouteSnapshot): Promise<ProbabilityData> | null {
    if (typeof route.params.shareID === 'string') {
      return this.sharing.findByShareID(route.params.shareID);
    } else {
      return null;
    }
  }
}
