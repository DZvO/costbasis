export class Profile {
    eventSymbol: string;
    eventTime: number;
    description: string;
    shortSaleRestriction: string;
    tradingStatus: string;
    statusReason: string;
    haltStartTime: number;
    haltEndTime: number;
    highLimitPrice: number;
    lowLimitPrice: number;
    high52WeekPrice: number;
    low52WeekPrice: number;

    haltStart: Date;
    haltEnd: Date;

    constructor(
        eventSymbol?: string, eventTime?: number, description?: string, shortSaleRestriction?: string,
        tradingStatus?: string, statusReason?: string, haltStartTime?: number, haltEndTime?: number,
        highLimitPrice?: number, lowLimitPrice?: number, high52WeekPrice?: number, low52WeekPrice?: number
    ) {
        this.update(eventSymbol, eventTime, description, shortSaleRestriction, tradingStatus, statusReason,
            haltStartTime, haltEndTime, highLimitPrice, lowLimitPrice, high52WeekPrice, low52WeekPrice);
    }

    update(
        eventSymbol: string, eventTime: number, description: string, shortSaleRestriction: string,
        tradingStatus: string, statusReason: string, haltStartTime: number, haltEndTime: number,
        highLimitPrice: number, lowLimitPrice: number, high52WeekPrice: number, low52WeekPrice: number
    ): void {
        this.eventSymbol = eventSymbol;
        this.eventTime = eventTime;
        this.description = description;
        this.shortSaleRestriction = shortSaleRestriction;
        this.tradingStatus = tradingStatus;
        this.statusReason = statusReason;
        this.haltStartTime = haltStartTime;
        this.haltEndTime = haltEndTime;
        this.highLimitPrice = highLimitPrice;
        this.lowLimitPrice = lowLimitPrice;
        this.high52WeekPrice = high52WeekPrice;
        this.low52WeekPrice = low52WeekPrice;

        this.haltStart = new Date(this.haltStartTime);
        this.haltEnd = new Date(this.haltEndTime);
    }
}
