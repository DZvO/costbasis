import { Component, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';

import * as d3 from 'd3';
import { BoundDirectivePropertyAst } from '@angular/compiler';

declare var require: any;
import * as TastyWorks from 'src/assets/TastyWorks';
import * as cometdLib from 'cometd';
import Bottleneck from 'bottleneck';

import { Candle } from 'src/app/dtos/candle';
import { Greeks } from 'src/app/dtos/greeks';
import { Profile } from 'src/app/dtos/profile';
import { Quote } from 'src/app/dtos/quote';
import { Summary } from 'src/app/dtos/summary';
import { TheoPrice } from 'src/app/dtos/theo-price';
import { Trade } from 'src/app/dtos/trade';
import { BalanceInfo } from '../dtos/balanceinfo';
import { TwService } from '../tw.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TradeComponent implements OnInit {
  tickerField = '';
  ticker = '';

  constructor(public twService: TwService) {
    console.log("-----------constructor------------");
  }

  ngOnInit(): void {
    console.log("-----------ONINIT------------");
  }

  tickerchanged(ticker: string): void {
    this.ticker = ticker;
    //TODO unsubscribe previous ticker
    console.log(ticker.toUpperCase());
    this.twService.getInfoForTicker(ticker).then(_ => this.twService.populateOptionChain(ticker));
  }

  getQuoteForStrike(strike, exp, type, element): any {
    return this.twService.quoteInfo.has(this.twService.convertToQuoteString(this.twService.optionChains['root-symbol'],
      strike['strike-price'], exp['expiration-date'], type)) ?
      this.twService.quoteInfo.get(this.twService.convertToQuoteString(this.twService.optionChains['root-symbol'],
        strike['strike-price'], exp['expiration-date'], type))[element] : '';
  }

  getGreekForStrike(strike, exp, type, element): any {
    return this.twService.greeksInfo.has(this.twService.convertToQuoteString(this.twService.optionChains['root-symbol'],
      strike['strike-price'], exp['expiration-date'], type)) ?
      this.twService.greeksInfo.get(this.twService.convertToQuoteString(this.twService.optionChains['root-symbol'],
        strike['strike-price'], exp['expiration-date'], type))[element] : '';
  }

}
