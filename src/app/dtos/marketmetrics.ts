// To parse this data:
//
//   import { Convert, MarketMetrics } from "./file";
//
//   const marketMetrics = Convert.toMarketMetrics(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface MarketMetrics {
    symbol: string;
    impliedVolatilityIndex: string;
    impliedVolatilityIndex5DayChange: string;
    impliedVolatilityIndexRank: string;
    tosImpliedVolatilityIndexRank: string;
    twImpliedVolatilityIndexRank: string;
    tosImpliedVolatilityIndexRankUpdatedAt: Date;
    impliedVolatilityIndexRankSource: string;
    impliedVolatilityPercentile: string;
    impliedVolatilityUpdatedAt: Date;
    liquidityValue: string;
    liquidityRank: string;
    liquidityRating: number;
    updatedAt: Date;
    optionExpirationImpliedVolatilities: OptionExpirationImpliedVolatility[];
    liquidityRunningState: LiquidityRunningState;
    beta: string;
    betaUpdatedAt: Date;
    corrSpy3Month: string;
    dividendYield: string;
    earnings: Earnings;
    listedMarket: string;
    lendability: string;
    borrowRate: string;
}

export interface Earnings {
    visible: boolean;
    expectedReportDate: Date;
    estimated: boolean;
    timeOfDay: string;
    lateFlag: number;
    quarterEndDate: Date;
    consensusEstimate: string;
    updatedAt: Date;
}

export interface LiquidityRunningState {
    sum: string;
    count: number;
    startedAt: Date;
}

export interface OptionExpirationImpliedVolatility {
    expirationDate: Date;
    optionChainType: OptionChainType;
    settlementType: SettlementType;
    impliedVolatility: string;
}

export enum OptionChainType {
    Standard = "Standard",
}

export enum SettlementType {
    Pm = "PM",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toMarketMetrics(json: string): MarketMetrics {
        return cast(JSON.parse(json), r("MarketMetrics"));
    }

    public static marketMetricsToJson(value: MarketMetrics): string {
        return JSON.stringify(uncast(value, r("MarketMetrics")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "MarketMetrics": o([
        { json: "symbol", js: "symbol", typ: "" },
        { json: "implied-volatility-index", js: "impliedVolatilityIndex", typ: "" },
        { json: "implied-volatility-index-5-day-change", js: "impliedVolatilityIndex5DayChange", typ: "" },
        { json: "implied-volatility-index-rank", js: "impliedVolatilityIndexRank", typ: "" },
        { json: "tos-implied-volatility-index-rank", js: "tosImpliedVolatilityIndexRank", typ: "" },
        { json: "tw-implied-volatility-index-rank", js: "twImpliedVolatilityIndexRank", typ: "" },
        { json: "tos-implied-volatility-index-rank-updated-at", js: "tosImpliedVolatilityIndexRankUpdatedAt", typ: Date },
        { json: "implied-volatility-index-rank-source", js: "impliedVolatilityIndexRankSource", typ: "" },
        { json: "implied-volatility-percentile", js: "impliedVolatilityPercentile", typ: "" },
        { json: "implied-volatility-updated-at", js: "impliedVolatilityUpdatedAt", typ: Date },
        { json: "liquidity-value", js: "liquidityValue", typ: "" },
        { json: "liquidity-rank", js: "liquidityRank", typ: "" },
        { json: "liquidity-rating", js: "liquidityRating", typ: 0 },
        { json: "updated-at", js: "updatedAt", typ: Date },
        { json: "option-expiration-implied-volatilities", js: "optionExpirationImpliedVolatilities", typ: a(r("OptionExpirationImpliedVolatility")) },
        { json: "liquidity-running-state", js: "liquidityRunningState", typ: r("LiquidityRunningState") },
        { json: "beta", js: "beta", typ: "" },
        { json: "beta-updated-at", js: "betaUpdatedAt", typ: Date },
        { json: "corr-spy-3month", js: "corrSpy3Month", typ: "" },
        { json: "dividend-yield", js: "dividendYield", typ: "" },
        { json: "earnings", js: "earnings", typ: r("Earnings") },
        { json: "listed-market", js: "listedMarket", typ: "" },
        { json: "lendability", js: "lendability", typ: "" },
        { json: "borrow-rate", js: "borrowRate", typ: "" },
    ], false),
    "Earnings": o([
        { json: "visible", js: "visible", typ: true },
        { json: "expected-report-date", js: "expectedReportDate", typ: Date },
        { json: "estimated", js: "estimated", typ: true },
        { json: "time-of-day", js: "timeOfDay", typ: "" },
        { json: "late-flag", js: "lateFlag", typ: 0 },
        { json: "quarter-end-date", js: "quarterEndDate", typ: Date },
        { json: "consensus-estimate", js: "consensusEstimate", typ: "" },
        { json: "updated-at", js: "updatedAt", typ: Date },
    ], false),
    "LiquidityRunningState": o([
        { json: "sum", js: "sum", typ: "" },
        { json: "count", js: "count", typ: 0 },
        { json: "started-at", js: "startedAt", typ: Date },
    ], false),
    "OptionExpirationImpliedVolatility": o([
        { json: "expiration-date", js: "expirationDate", typ: Date },
        { json: "option-chain-type", js: "optionChainType", typ: r("OptionChainType") },
        { json: "settlement-type", js: "settlementType", typ: r("SettlementType") },
        { json: "implied-volatility", js: "impliedVolatility", typ: "" },
    ], false),
    "OptionChainType": [
        "Standard",
    ],
    "SettlementType": [
        "PM",
    ],
};
