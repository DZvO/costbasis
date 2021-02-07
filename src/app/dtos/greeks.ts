export class Greeks {
    eventSymbol: number;
    eventTime: number;
    eventFlags: number;
    index: number;
    time: number;
    sequence: number;
    price: number;
    volatility: number;
    delta: number;
    gamma: number;
    theta: number;
    rho: number;
    vega: number;

    constructor(eventSymbol?: number, eventTime?: number, eventFlags?: number,
        index?: number, time?: number, sequence?: number, price?: number, volatility?: number,
        delta?: number, gamma?: number, theta?: number, rho?: number, vega?: number
    ) {
        this.update(eventSymbol, eventTime, eventFlags,
            index, time, sequence, price, volatility,
            delta, gamma, theta, rho, vega
        );
    }

    update(eventSymbol: number, eventTime: number, eventFlags: number,
        index: number, time: number, sequence: number, price: number, volatility: number,
        delta: number, gamma: number, theta: number, rho: number, vega: number
    ): void {
        this.eventSymbol = eventSymbol;
        this.eventTime = eventTime;
        this.eventFlags = eventFlags;
        this.index = index;
        this.time = time;
        this.sequence = sequence;
        this.price = price;
        this.volatility = volatility;
        this.delta = delta;
        this.gamma = gamma;
        this.theta = theta;
        this.rho = rho;
        this.vega = vega;
    }
}