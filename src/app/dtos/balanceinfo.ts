export class BalanceInfo {
    cashBalance: number;
    derivativeBuyingPower: number;
    equityBuyingPower: number;
    snapshotDate: Date;

    constructor(cashBalance: number, derivativeBuyingPower: number, equityBuyingPower: number, snapshotDate: Date) {
        this.cashBalance = cashBalance;
        this.derivativeBuyingPower = derivativeBuyingPower;
        this.equityBuyingPower = equityBuyingPower;
        this.snapshotDate = snapshotDate;
    }
}


/*
account-number: "5WU61061"
available-trading-funds: "0.0"
cash-available-to-withdraw: "1694.39"
cash-balance: "10645.882"
cryptocurrency-margin-requirement: "0.0"
day-equity-call-value: "0.0"
day-trade-excess: "1694.39"
day-trading-buying-power: "0.0"
day-trading-call-value: "0.0"
debit-margin-balance: "0.0"
derivative-buying-power: "1694.382"
equity-buying-power: "3388.764"
futures-intraday-margin-requirement: "0.0"
futures-margin-requirement: "0.0"
futures-overnight-margin-requirement: "0.0"
long-cryptocurrency-value: "0.0"
long-derivative-value: "0.0"
long-equity-value: "0.0"
long-futures-derivative-value: "0.0"
long-futures-value: "0.0"
long-margineable-value: "0.0"
maintenance-call-value: "0.0"
maintenance-excess: "1694.382"
maintenance-requirement: "8951.5"
margin-equity: "10645.882"
net-liquidating-value: "7729.382"
pending-cash: "0.0"
pending-cash-effect: "None"
pending-margin-interest: "0.0"
reg-t-call-value: "0.0"
reg-t-margin-requirement: "8951.5"
short-cryptocurrency-value: "0.0"
short-derivative-value: "2916.5"
short-equity-value: "0.0"
short-futures-derivative-value: "0.0"
short-futures-value: "0.0"
short-margineable-value: "0.0"
snapshot-date: "2021-02-07"
*/