import { RowData, TableKey, TableRecord } from "./types";
export type QueryConditionObject = {
    $validation?: (row: TableRecord) => boolean;
    and?: QueryConditionObject;
} & {
    [name in string]: {
        not_eq?: RowData;
        neq?: RowData;
        eq?: RowData;
        lt?: number;
        gt?: number;
        lte?: number;
        gte?: number;
    } | RowData | ((value: RowData, key: TableKey) => boolean);
};
export declare class QueryCondition {
    conditions: QueryConditionObject[];
    row_limit: number;
    or(condition: QueryCondition | QueryConditionObject): this;
    limit(limit: number): this;
    private validate_against_condition;
    validate(row: TableRecord): boolean;
    constructor(condition: QueryConditionObject);
}
