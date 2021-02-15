import { Component, OnInit } from '@angular/core';
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
import { BalanceInfo } from 'src/app/dtos/balanceinfo';

import {TwService} from 'src/app/tw.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  username: string = null;
  password: string = null;

  constructor(public twService: TwService) {
    twService.checkIfLoggedIn();
  }
}
