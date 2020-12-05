import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProbabilityComponent } from './probability/probability.component';
import { DataResolver } from './data.resolver';

@NgModule({
  imports: [
    RouterModule.forRoot([
      { component: ProbabilityComponent, path: '' },
      {
        component: ProbabilityComponent,
        resolve: { data: DataResolver },
        path: 'share/:shareID',
      },
    ]),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
