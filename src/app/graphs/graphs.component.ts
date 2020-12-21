import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import * as CanvasJS from '../../assets/canvasjs.min.js';
import { stringify } from 'querystring';

import * as d3 from 'd3';

declare var require: any
const TastyWorks = require('tasty-works-api/lib/index');


@Component({
  selector: 'app-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.scss'],
})
export class GraphsComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.chart = new CanvasJS.Chart("chartContainer", {
      animationEnabled: false,
      exportEnabled: false,
      title: {
        text: "PLTR"
      },
      data: [{
        type: "line",
        dataPoints: [
          { y: 71, label: "Apple" },
          { y: 55, label: "Mango" },
          { y: 50, label: "Orange" },
          { y: 65, label: "Banana" },
          { y: 95, label: "Pineapple" },
          { y: 68, label: "Pears" },
          { y: 28, label: "Grapes" },
          { y: 34, label: "Lychee" },
          { y: 14, label: "Jackfruit" }
        ]
      }]
    });
    this.chart.render();

    if (localStorage.getItem("token") != null
      && localStorage.getItem("accounts") != null
      && localStorage.getItem("accid") != null) {
      TastyWorks.setAuthorizationToken(JSON.parse(localStorage.getItem("token")));
      TastyWorks.setUser(JSON.parse(localStorage.getItem("accounts")));
      this.tw_accid = JSON.parse(localStorage.getItem("accid"));
      this.loggedIn = true;
    }

    var margin = {top: 50, right: 30, bottom: 30, left: 100}, width = 600 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;
    var svg = d3.select("#plot")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  }

  title = 'costbasis';
  fileToUpload: File = null;
  dataArray: Map<string, string>[] = [];
  tickers = [];
  selectedTicker = "PLTR";
  header = [];
  chart = null;
  username = "";
  password = "";
  loggedIn = false;
  tw_accid = null;

  displayData: Map<string, string>[] = [];

  private data = [
    { "Framework": "Vue", "Stars": "166443", "Released": "2014" },
    { "Framework": "React", "Stars": "150793", "Released": "2013" },
    { "Framework": "Angular", "Stars": "62342", "Released": "2016" },
    { "Framework": "Backbone", "Stars": "27647", "Released": "2010" },
    { "Framework": "Ember", "Stars": "21471", "Released": "2011" },
  ];
  private svg;
  private margin = 50;
  private width = 750 - (this.margin * 2);
  private height = 400 - (this.margin * 2);

  getKeyForEntry(entr): string {
    return entr.get("Symbol") + entr.get("Expiration Date") + entr.get("Strike") + entr.get("Call/Put");
  }

  selectedTickerChanged() {
    if (this.selectedTicker == "") this.displayData = this.dataArray;
    else {
      console.log("selecting data for " + this.selectedTicker);
      this.displayData = this.dataArray.filter(f => f["symbol"] == this.selectedTicker || f["underlying-symbol"] == this.selectedTicker).sort(function (a, b) { return a["id"] - b["id"] });

      var totalCount = new Map();
      var prevCB = new Map();
      var cb = new Map();
      var balance = new Map();
      var entries = [];

      var tradeStack = new Map();

      for (const l of this.displayData) {
        console.log(l);
        const bto = l["action"] === "Buy to Open";
        const btc = l["action"] === "Buy to Close";
        const sto = l["action"] === "Sell to Open";
        const stc = l["action"] === "Sell to Close";
        const stockTrade = l["instrument-type"] == "Equity";
        const count = parseInt(l["quantity"]);
        const priceper = parseFloat(l["price"]);
        const time = l["executed-at"];
        const symbol = l["symbol"];
        const underlying = l["underlying-symbol"];

        if (!cb.has(symbol)) cb.set(symbol, 0.0);
        if (!prevCB.has(symbol)) prevCB.set(symbol, 0.0);
        if (!totalCount.has(symbol)) totalCount.set(symbol, 0.0);
        if (!balance.has(underlying)) balance.set(symbol, 0.0);

        if (l["transaction-sub-type"] == "Expiration") {
          //balance.set(underlying, balance.get(underlying) + (priceper - cb.get(symbol)) * count);
          //entries.push({ y: balance.get(underlying), label: time })
          //cb.set(symbol, cb.get(symbol) + ((priceper - cb.get(symbol)) * count) / totalCount.get(symbol));
          totalCount.set(symbol, totalCount.get(symbol) - count);
          continue;
        }

        if (bto || sto) {
          prevCB.set(symbol, cb.get(symbol));
          cb.set(
            symbol,
            (totalCount.get(symbol) * prevCB.get(symbol) + count * priceper) / (totalCount.get(symbol) + count)
          );
          totalCount.set(symbol, totalCount.get(symbol) + count);
        } else if (stc || btc) {
          balance.set(underlying, balance.get(underlying) + (priceper - cb.get(symbol)) * count);
          entries.push({ y: balance.get(underlying), label: time })
          cb.set(symbol, cb.get(symbol) + ((priceper - cb.get(symbol)) * count) / totalCount.get(symbol));
          totalCount.set(symbol, totalCount.get(symbol) - count);
        }
      }


      this.chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: false,
        exportEnabled: false,
        title: {
          text: this.selectedTicker
        },
        data: [{
          type: "line",
          dataPoints: entries
        }]
      });

      this.chart.render();
    }
  }


  login() {
    const credentials = {
      username: this.username,
      password: this.password
    };

    let TASTY_ACCOUNT_ID;
    TastyWorks.setUser(credentials);

    TastyWorks.authorization()
      .then(token => {
        // Set the authorization in the headers
        TastyWorks.setAuthorizationToken(token);
        console.log('Session is active, continue with other calls.');
        localStorage.setItem("token", JSON.stringify(token));
        return true;
      })
      .then(() => TastyWorks.accounts())
      .catch(err => console.log(err.status))
      .then(accounts => {
        TASTY_ACCOUNT_ID = accounts[0]['account-number'];
        TastyWorks.setUser({ accounts });

        this.loggedIn = true;
        localStorage.setItem("accounts", JSON.stringify(accounts));
        localStorage.setItem("accid", JSON.stringify(TASTY_ACCOUNT_ID));
        this.tw_accid = TASTY_ACCOUNT_ID;
      })
  }

  history() {
    TastyWorks.history(this.tw_accid, '01/01/2019', '01/05/2021')
      .catch(err => console.log(err.status))
      .then(history => {
        console.log(history)
        this.dataArray = [];
        for (const k of history) {
          if (!("symbol" in k)) continue;
          if (k["transaction-sub-type"] === "Dividend") continue;

          const stockTrade = k["instrument-type"] == "Equity";
          const symbol = k["symbol"];
          if (stockTrade && !this.tickers.includes(symbol)) this.tickers.push(symbol);

          console.log("adding:" + JSON.stringify(k));
          this.dataArray.push(k);
        }
        console.log("done parsing data.");

        this.selectedTickerChanged();
      })
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