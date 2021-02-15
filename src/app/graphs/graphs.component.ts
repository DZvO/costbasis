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

@Component({
  selector: 'app-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class GraphsComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }
}
