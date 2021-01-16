import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as CanvasJS from '../../assets/canvasjs.min.js';

import * as d3 from 'd3';

declare var require: any;
const TastyWorks = require('tasty-works-api/lib/index');

var cometdLib = require('cometd');


@Component({
  selector: 'app-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.scss'],
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

  displayData: {}[] = [];

  debugEntries = [];
  headerkeys = [];

  price = 0.0;

  ngOnInit(): void {
    this.checkIfLoggedIn();
  }

  checkIfLoggedIn() {
    if (localStorage.getItem('token') != null
      && localStorage.getItem('accounts') != null
      && localStorage.getItem('accid') != null) {
      TastyWorks.setAuthorizationToken(JSON.parse(localStorage.getItem('token')));
      TastyWorks.setUser(JSON.parse(localStorage.getItem('accounts')));
      this.tw_accid = JSON.parse(localStorage.getItem('accid'));
    }
    TastyWorks.balances(this.tw_accid)
      .then(balances => {
        console.log('session active, let\'s go!');
        console.log(balances);
        this.loggedIn = true;

        this.twActivateStreamer();
      }, err => {
        console.log(`session not active anymore (${err}), please login.`);
        this.loggedIn = false;
      });
  }

  selectedTickerChanged() {
    if (this.selectedTicker === '') {
      this.displayData = this.dataArray;
    }
    else {
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
        console.log(l);
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

  twSaveAccountInfo(accounts) {
    const TASTY_ACCOUNT_ID = accounts[0]['account-number'];
    TastyWorks.setUser({ accounts });

    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('accid', JSON.stringify(TASTY_ACCOUNT_ID));
    this.tw_accid = TASTY_ACCOUNT_ID;
  }

  twActivateStreamer() {
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
                //TODO add message parser logic here
                console.log('msg: ' + JSON.stringify(message));
                this.price = message.data[1][6];
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

  login() {
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
            this.twActivateStreamer();
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

  twAddQuoteSub(ticker): void {
    this.cometd.publish('/service/sub', { add: { Quote: [ticker] } }, publishAck => {
      if (publishAck.successful) {
        console.log('sub acknowledged');
      }
    });
  }

  getInfoForTicker(ticker): void {
    this.twAddQuoteSub(ticker);
    TastyWorks.marketMetrics([ticker])
      .then(a => console.log(a))
      .catch(err => console.log(err.status));
  }

  history(): void {
    TastyWorks.balances(this.tw_accid).then(balances => console.log(balances))
      .catch(err => console.log(err.status))
      .then(a => console.log(a));

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

          console.log('adding:' + JSON.stringify(k));
          this.dataArray.push(k);
        }
        console.log('done parsing data.');

        this.selectedTickerChanged();
        this.getInfoForTicker(this.selectedTicker);
      });
  }
}


/*const TastyWorks = require('../lib/index');
const credentials = {
    username: process.env.TASTY_USERNAME,
    password: process.env.TASTY_PASSWORD
};

let TASTY_ACCOUNT_ID;

// Set the username and password
TastyWorks.setUser(credentials);

// Before making any calls, get the session-token via the authorization endpoint
TastyWorks.authorization()
    .then(token => {
        // Set the authorization in the headers
        TastyWorks.setAuthorizationToken(token);
        console.log('Session is active, continue with other calls.');
        return true;
    })
    .then(() => TastyWorks.accounts())
    .catch(err => console.log(err.status))
    .then(accounts => {
        TASTY_ACCOUNT_ID = accounts[0]['account-number'];
        TastyWorks.setUser({accounts});
    })
    .then(() => {
        console.log('======= USER OBJECT =======');
        console.log(TastyWorks.getUser());
    })
    .then(() => TastyWorks.balances(TASTY_ACCOUNT_ID))
    .catch(err => console.log(err.status))
    .then(balances => {
        console.log('======= ACCOUNT BALANCES =======');
        console.log(balances)
    })
    .then(() => TastyWorks.positions(TASTY_ACCOUNT_ID))
    .catch(err => console.log(err.status))
    .then(positions => {
        console.log('======= ACCOUNT POSITIONS =======');
        console.log(positions)
    })
    .then(() => TastyWorks.liveOrders(TASTY_ACCOUNT_ID))
    .catch(err => console.log(err.status))
    .then(liveOrders => {
        console.log('======= ACCOUNT LIVEORDERS =======');
        console.log(liveOrders)
    })
    .then(() => TastyWorks.history(TASTY_ACCOUNT_ID, '01/01/2019', '01/05/2019'))
    .catch(err => console.log(err.status))
    .then(history => {
        console.log('======= ACCOUNT HISTORY =======');
        console.log(history)
    })
    .then(() => TastyWorks.marketMetrics(['AMZN', 'SPX']))
    .then(marketData => {
        console.log('======= Market Data =======');
        console.log(marketData)
    })
    .then(() => TastyWorks.optionChain('TSLA'))
    .then(chain => {
        console.log('======= Option chain =======');
        console.log(chain)
        console.table(chain.items[0].expirations)
    })*/