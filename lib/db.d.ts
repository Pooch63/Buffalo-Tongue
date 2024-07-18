export type RowData = number | string | boolean;
export type TableRecord = Record<string, RowData>;
export type TableData = Record<string | number, TableRecord | null>;
declare namespace Schema {
    enum Datatype {
        INT = "integer",
        DOUBLE = "double",
        STRING = "string",
        BOOLEAN = "boolean"
    }
    function validate_type({ value, type, }: {
        value: RowData;
        type: Schema.Datatype;
    }): boolean;
    interface ColumnInfo {
        name: string;
        type: Schema.Datatype;
        unique?: boolean;
        validation?: (value: any) => boolean;
        default?: RowData | null;
    }
    class Row {
        name: string;
        type: Schema.Datatype;
        default?: RowData | null;
        unique?: boolean;
        validation?: (value: RowData) => boolean;
        constructor(info: ColumnInfo);
    }
    class Table {
        rows: Schema.Row[];
        unique_key: string | null;
        constructor({ rows }: {
            rows: Schema.ColumnInfo[];
        });
        col_exists(col: string): boolean;
        validate(record: TableRecord): boolean;
    }
    function get_unique_key(record: TableRecord, schema: Schema.Table): null | RowData;
}
type QueryConditionObject = {
    [name in string]: {
        not_eq?: RowData;
        eq?: RowData;
        lt?: number;
        gt?: number;
        lte?: number;
        gte?: number;
    } | RowData;
};
declare class QueryCondition {
    conditions: (QueryCondition | QueryConditionObject)[];
    row_limit: number;
    or(condition: QueryCondition | QueryConditionObject): this;
    limit(limit: number): this;
    private validate_against_condition;
    validate(row: TableRecord): boolean;
    constructor(condition: QueryConditionObject);
}
type Update = Record<string, RowData>;
declare class Table {
    name: string;
    schema: Schema.Table;
    data: TableData;
    data_count: number;
    constructor({ name, schema }: {
        name: string;
        schema: Schema.Table;
    });
    insert(record: TableRecord): void;
    each(func: (row: TableRecord, key: string | number) => boolean | void): void;
    filter(func: (row: TableRecord, key: string | number) => boolean): void;
}
export declare class Database {
    private tables;
    get_table(table: string): Table;
    create_table(name: string, schema: {
        rows: Schema.ColumnInfo[];
    }): void;
    create: (name: string, schema: {
        rows: Schema.ColumnInfo[];
    }) => void;
    private insert_into_table;
    insert(table: string, record: TableRecord): void;
    private select_from_table;
    select(table: string, condition?: QueryCondition | QueryConditionObject | null): TableRecord[];
    private select_count_from_table;
    select_count(table: string, condition?: QueryCondition | QueryConditionObject | null): number;
    count: (table: string, condition?: QueryCondition | QueryConditionObject | null) => number;
    private delete_from_table;
    delete(table_name: string, condition?: QueryCondition | QueryConditionObject | null): void;
    select_distinct(table_name: string, columns: string | string[], condition?: QueryCondition | QueryConditionObject | null): TableRecord[];
    update(table_name: string, update: Update, condition?: QueryCondition | QueryConditionObject | null): void;
}
export declare const INT = Schema.Datatype.INT;
export declare const DOUBLE = Schema.Datatype.DOUBLE;
export declare const STRING = Schema.Datatype.STRING;
export declare const BOOLEAN = Schema.Datatype.BOOLEAN;
export {};
