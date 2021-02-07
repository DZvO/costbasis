export class Quote {
    eventSymbol: string;
    eventTime: number;
    sequence: number;
    timeNanoPart: number;
    bidTime: number;
    bidExchangeCode: string;
    bidPrice: number;
    bidSize: number;
    askTime: number;
    askExchangeCode: string;
    askPrice: number;
    askSize: number;

    midPrice: number;
    lastAskPrice: number; //TODO rename to previous to avoid confusion
    lastBidPrice: number;
    lastMidPrice: number;

    constructor(eventSymbol?: string, eventTime?: number, sequence?: number, timeNanoPart?: number,
        bidTime?: number, bidExchangeCode?: string, bidPrice?: number, bidSize?: number,
        askTime?: number, askExchangeCode?: string, askPrice?: number, askSize?: number
    ) {
        this.update(eventSymbol, eventTime, sequence, timeNanoPart, bidTime, bidExchangeCode,
            bidPrice, bidSize, askTime, askExchangeCode, askPrice, askSize);
    }

    update(eventSymbol: string, eventTime: number, sequence: number, timeNanoPart: number,
        bidTime: number, bidExchangeCode: string, bidPrice: number, bidSize: number,
        askTime: number, askExchangeCode: string, askPrice: number, askSize: number
    ): void {
        this.lastAskPrice = this.askPrice;
        this.lastBidPrice = this.bidPrice;
        this.lastMidPrice = this.midPrice;

        this.eventSymbol = eventSymbol;
        this.eventTime = eventTime;
        this.sequence = sequence;
        this.timeNanoPart = timeNanoPart;
        this.bidTime = bidTime;
        this.bidExchangeCode = bidExchangeCode;
        this.bidPrice = bidPrice;
        this.bidSize = bidSize;
        this.askTime = askTime;
        this.askExchangeCode = askExchangeCode;
        this.askPrice = askPrice;
        this.askSize = askSize;
        this.midPrice = (this.askPrice + this.bidPrice) / 2.0;
    }
}
