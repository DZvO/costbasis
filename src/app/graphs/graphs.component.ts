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

  IRRELEVANT_FIELDS =
    [
      'account-number', 'exchange', 'exec-id', 'ext-exchange-order-number', 'ext-exec-id', 'ext-global-order-number', 'ext-group-fill-id', 'ext-group-id',
      'proprietary-index-option-fees', 'proprietary-index-option-fees-effect', 'regulatory-fees-effect', 'id', 'order-id', 'is-estimated-fee',
      'clearing-fees', 'clearing-fees-effect', 'commission', 'commission-effect', 'action', 'regulatory-fees', 'net-value', 'net-value-effect',
    ];

  title = 'costbasis';
  fileToUpload: File = null;
  dataArray: {}[] = [];
  tickers = [];
  selectedTicker = 'PLTR';
  header = [];
  chart = null;
  username = '';
  password = '';
  loggedIn = false;
  tw_accid = null;
  cometd = null;
  limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1500
  });

  displayData: {}[] = [];

  debugEntries = [];
  headerkeys = [];
  watchlist = [];
  wl_active = "";

  greeksInfo: Map<string, Greeks> = new Map<string, Greeks>();
  quoteInfo: Map<string, Quote> = new Map<string, Quote>();
  profileInfo: Map<string, Profile> = new Map<string, Profile>();
  optionChains: any = null;
  balanceInfo: BalanceInfo = null;

  tw_sub_req: any = { add: { Quote: [], Profile: [], Greeks: [] } };

  ngOnInit(): void {
    this.checkIfLoggedIn();
  }

  checkIfLoggedIn(): void {
    if (localStorage.getItem('token') != null
      && localStorage.getItem('accounts') != null
      && localStorage.getItem('accid') != null) {
      TastyWorks.setAuthorizationToken(JSON.parse(localStorage.getItem('token')));
      TastyWorks.setUser(JSON.parse(localStorage.getItem('accounts')));
      this.tw_accid = JSON.parse(localStorage.getItem('accid'));
    }
    this.setupAfterLogin();
  }

  login(): void {
    const credentials = {
      username: this.username,
      password: this.password
    };

    TastyWorks.setUser(credentials);

    TastyWorks.authorization()
      .then(token => {
        TastyWorks.setAuthorizationToken(token);
        localStorage.setItem('token', JSON.stringify(token));
        TastyWorks.accounts()
          .then(accounts => {
            this.twSaveAccountInfo(accounts);
            this.loggedIn = true;
            this.setupAfterLogin();
          }, err => {
            console.log('unable to retrieve account information');
            console.log(err.status);
          });
      }, err => {
        console.log('login failed, please try again');
        console.log(err);
        this.loggedIn = false;
      });
  }

  setupAfterLogin(): void {
    TastyWorks.balances(this.tw_accid)
      .then(balances => {
        console.log('session active, let\'s go!');
        console.log(balances);
        this.loggedIn = true;
        this.setBalanceInfo(balances);
        this.twActivateStreamer();
      }, err => {
        console.log(`session not active anymore (${err}), please login.`);
        this.loggedIn = false;
      });
  }

  setBalanceInfo(balanceObject: any): void {
    this.balanceInfo = new BalanceInfo(
      balanceObject['cash-balance'], balanceObject['derivative-buying-power'],
      balanceObject['equity-buying-power'], balanceObject['snapshot-date']
    );
  }

  // TODO this method is huge, reduce it
  selectedTickerChanged(): void {
    if (this.selectedTicker === '') {
      this.displayData = this.dataArray;
    }
    else {
      this.twAddQuoteSub(this.selectedTicker);
      this.twPublishSubRequest();
      console.log('selecting data for ' + this.selectedTicker);
      // filter all data to only contain selected ticker
      this.displayData = this.dataArray
        .filter(f => f['symbol'] === this.selectedTicker || f['underlying-symbol'] === this.selectedTicker)
        .sort((a, b) => new Date(b['executed-at']).getTime() / 1000 | 0 - new Date(a['executed-at']).getTime() / 1000 | 0).reverse();

      this.headerkeys = [];
      this.headerkeys.push('costbasis');
      this.displayData.forEach(k => {
        // filter out unnecessary columns
        this.IRRELEVANT_FIELDS.forEach(e => delete k[e]);
        // add all possible columns to headerkeys
        Object.keys(k).forEach(p => {
          if (!(this.headerkeys.includes(p))) {
            this.headerkeys.push(p);
          }
        });
        // fill up missing keys on all entries
        Array.from(this.headerkeys).forEach(p => {
          if (!(p in k)) {
            k[p] = '';
          }
        });
      });


      var totalCount = new Map();
      var cb = new Map();
      var balance = new Map();
      var entries = [];

      this.debugEntries = [];
      var prevCB = 0;
      for (const l of this.displayData) {
        //console.log(l);
        const bto = l['action'] === 'Buy to Open';
        const btc = l['action'] === 'Buy to Close';
        const sto = l['action'] === 'Sell to Open';
        const stc = l['action'] === 'Sell to Close';
        const count = parseInt(l['quantity']);
        const priceper = parseFloat(l['price']);
        const time = l['executed-at'];
        const symbol = l['symbol'];
        const underlying = l['underlying-symbol'];

        if (!cb.has(symbol)) cb.set(symbol, 0.0);
        if (!totalCount.has(symbol)) totalCount.set(symbol, 0.0);
        if (!balance.has(underlying)) balance.set(symbol, 0.0);

        if (true)//l['instrument-type'] === 'Equity Option')
        {
          l['costbasis'] = prevCB + l['value'] * (l['value-effect'] === 'Credit' ? 1 : -1);
          prevCB = l['costbasis'];
          l['costbasis'] = l['costbasis'].toFixed(2);
        }
      }
    }
  }

  twSaveAccountInfo(accounts): void {
    const TASTY_ACCOUNT_ID = accounts[0]['account-number'];
    TastyWorks.setUser({ accounts });

    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('accid', JSON.stringify(TASTY_ACCOUNT_ID));
    this.tw_accid = TASTY_ACCOUNT_ID;
  }

  twActivateStreamer(): void {
    TastyWorks.streamer()
      .then(resp => {
        const streamerUrl = resp['websocket-url'] + '/cometd';
        this.cometd = new cometdLib.CometD();
        this.cometd.configure({
          url: streamerUrl,
          requestHeaders: { ext: { 'com.devexperts.auth.AuthToken': resp.token } }
        });
        this.cometd.addListener('/meta/handshake', (message) => {
          console.log('handshake message:');
          console.log(message);
        });
        this.cometd.handshake({
          ext: { 'com.devexperts.auth.AuthToken': resp.token }
        }, (handshakeReply) => {
          if (handshakeReply.successful) {
            this.cometd.subscribe('/service/data',
              message => {
                console.debug('msg: ' + JSON.stringify(message));
                if (Array.isArray(message.data[0])) { // got message with header, remove header
                  const type = message.data[0][0];
                  message.data.shift(1);
                  message.data.unshift(type);
                }
                if (message.data[0] === 'Quote') {
                  message.data.shift(1);
                  while (message.data[0].length > 0) {
                    const v = message.data[0];
                    const ticker = v[0];
                    const q = this.quoteInfo.has(ticker) ? this.quoteInfo.get(ticker) : new Quote();
                    q.update(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11]);
                    this.quoteInfo.set(ticker, q);
                    message.data[0].splice(0, 12);
                  }
                } else if (message.data[0] === 'Profile') {
                  message.data.shift(1);
                  while (message.data[0].length > 0) {
                    const v = message.data[0];
                    const ticker = v[0];
                    const p = this.profileInfo.has(ticker) ? this.profileInfo.get(ticker) : new Profile();
                    p.update(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11]);
                    this.profileInfo.set(ticker, p);
                    message.data[0].splice(0, 12);
                  }
                } else if (message.data[0] === 'Greeks') {
                  message.data.shift(1);
                  while (message.data[0].length > 0) {
                    const v = message.data[0];
                    const ticker = v[0];
                    const p = this.greeksInfo.has(ticker) ? this.greeksInfo.get(ticker) : new Greeks();
                    p.update(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11], v[12]);
                    this.greeksInfo.set(ticker, p);
                    message.data[0].splice(0, 13);
                  }
                }
              },
              subscribeReply => {
                if (subscribeReply.successful) {
                  console.log('subscribe to \'/service/data\' successful');
                }
              });
          }
        });
      }, err => {
        console.log(`unable to activate streamer connection (${err}, ${err.status}`);
      });
  }

  twAddGreeksSub(ticker): void {
    if (this.greeksInfo.has(ticker)) { return; }
    this.tw_sub_req.add.Greeks.push(ticker);
  }

  twAddQuoteSub(ticker): void {
    if (this.quoteInfo.has(ticker)) { return; }
    this.tw_sub_req.add.Quote.push(ticker);
  }

  twAddProfileSub(ticker): void {
    if (this.profileInfo.has(ticker)) { return; }
    this.tw_sub_req.add.Profile.push(ticker);
  }

  twAddCandleSub(ticker): void { // TODO
    this.cometd.publish('/service/sub', {});
  }

  twPublishSubRequest(): void {
    if (this.tw_sub_req.add.Quote.length === 0 &&
      this.tw_sub_req.add.Profile.length === 0 &&
      this.tw_sub_req.add.Greeks.length === 0
    ) { return; }

    const submitRequest = () =>
      new Promise((resolve, reject) => {
        const MAX_ELEMENTS_PER_QUERY = 75;
        const quote = this.tw_sub_req.add.Quote.slice(0, MAX_ELEMENTS_PER_QUERY);
        const profile = this.tw_sub_req.add.Profile.slice(0, MAX_ELEMENTS_PER_QUERY);
        const greeks = this.tw_sub_req.add.Greeks.slice(0, MAX_ELEMENTS_PER_QUERY);

        if (quote.length === 0 && profile.length === 0 && greeks.length === 0) {
          return resolve('nothing to do');
        } else {
          this.limiter.schedule(() => submitRequest())
            .then((result) => {
              console.info(result);
            });
        }

        this.tw_sub_req.add.Quote = this.tw_sub_req.add.Quote.slice(MAX_ELEMENTS_PER_QUERY);
        this.tw_sub_req.add.Profile = this.tw_sub_req.add.Profile.slice(MAX_ELEMENTS_PER_QUERY);
        this.tw_sub_req.add.Greeks = this.tw_sub_req.add.Greeks.slice(MAX_ELEMENTS_PER_QUERY);

        console.info('publishing: Quote/Profile/Greeks => ' +
          quote.length + '/' + profile.length + '/' + greeks.length + ' '
          + JSON.stringify({ add: { Quote: quote, Profile: profile, Greeks: greeks } }));

        this.cometd.publish(
          '/service/sub',
          { add: { Quote: quote, Profile: profile, Greeks: greeks } },
          publishAck => {
            if (publishAck.successful) {
              return resolve('sub acknowledged');
            } else {
              return reject('error');
            }
          });
      });

    this.limiter.schedule(() => submitRequest())
      .then((result) => { console.info(result); });
  }

  getInfoForTicker(ticker): void {
    this.twAddQuoteSub(ticker);
    this.twAddProfileSub(ticker);
    this.twPublishSubRequest();
    TastyWorks.marketMetrics([ticker])
      .then(a => console.log(a))
      .catch(err => console.log(err.status));
  }

  convertToQuoteString(ticker: string, strike: string, date: string, type: string): string {
    if (strike.endsWith('.0')) { strike = strike.substr(0, 2); }
    date = date.substr(2);
    date = date.replace(/-/g, '');
    const r = '.' + ticker + date + type + strike;
    return r;
    //.GOEV210219P17.5
  }

  history(): void {
    TastyWorks.marketMetrics(['AMZN', 'SPX'])
      .then(marketData => {
        console.log('======= Market Data =======');
        console.log(marketData);
      })
      .then(() => TastyWorks.optionChain('PLTR'))
      .then(chain => {
        console.log('======= Option chain =======');
        console.log(chain);
        console.table(chain.items[0].expirations);
        this.optionChains = chain.items[0];

        for (const exp of this.optionChains.expirations) {
          for (const strike of exp.strikes) {
            this.twAddQuoteSub(this.convertToQuoteString(this.optionChains['root-symbol'], strike['strike-price'], exp['expiration-date'], 'C'));
            this.twAddQuoteSub(this.convertToQuoteString(this.optionChains['root-symbol'], strike['strike-price'], exp['expiration-date'], 'P'));
            this.twAddGreeksSub(this.convertToQuoteString(this.optionChains['root-symbol'], strike['strike-price'], exp['expiration-date'], 'C'));
            this.twAddGreeksSub(this.convertToQuoteString(this.optionChains['root-symbol'], strike['strike-price'], exp['expiration-date'], 'P'));
          }
        }
        this.twPublishSubRequest();
      });

    TastyWorks.history(this.tw_accid, '01/01/2019', '01/05/2021')
      .catch(err => console.log(err.status))
      .then(history => {
        console.log(history)
        this.dataArray = [];
        for (const k of history) {
          if (!('symbol' in k)) { continue; }
          if (k['transaction-sub-type'] === 'Dividend') { continue; }

          const symbol = k['underlying-symbol'];
          if (!this.tickers.includes(symbol)) { this.tickers.push(symbol); }

          //console.log('adding:' + JSON.stringify(k));
          this.dataArray.push(k);
        }
        console.log('done parsing data.');

        this.selectedTickerChanged();
        this.getInfoForTicker(this.selectedTicker);
      });
  }
}
