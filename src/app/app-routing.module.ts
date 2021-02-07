import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChartsComponent } from './charts/charts.component';
import { HistoryComponent } from './history/history.component';

import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { TradeComponent } from './trade/trade.component';

const routes: Routes = [
  { path: 'history', component: HistoryComponent},
  { path: 'charts', component: ChartsComponent},
  { path: 'trade', component: TradeComponent},
  { path: 'portfolio', component: PortfolioComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
