import { QueryConditionObject, QueryCondition } from "./conditions";
import { Schema } from "./schema_validation";
import { RowData, TableData, TableRecord, Datatype } from "./types";
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
    column_names(): string[];
}
type Update = Record<string, RowData>;
export declare class Database {
    private tables;
    get_table(table: string): Table;
    create_table(name: string, schema: {
        columns: Schema.ColumnInfo[];
    }): void;
    create(name: string, schema: {
        columns: Schema.ColumnInfo[];
    }): void;
    private insert_into_table;
    insert(table: string, ...records: TableRecord[]): void;
    private select_from_table;
    select(table: string, condition?: QueryCondition | QueryConditionObject): TableRecord[];
    select(table: string, column: string, condition?: QueryCondition | QueryConditionObject): RowData[];
    private select_count_from_table;
    select_count(table: string, condition?: QueryCondition | QueryConditionObject | null): number;
    count(table: string, condition?: QueryCondition | QueryConditionObject | null): number;
    select_distinct(table_name: string, columns: string | string[], condition?: QueryCondition | QueryConditionObject | null): TableRecord[];
    distinct(table_name: string, columns: string | string[], condition?: QueryCondition | QueryConditionObject | null): TableRecord[];
    private delete_from_table;
    delete(table_name: string, condition?: QueryCondition | QueryConditionObject | null): void;
    update(table_name: string, update: Update, condition?: QueryCondition | QueryConditionObject | null): void;
    drop_table(table: string): void;
    drop(table: string): void;
}
export declare const INT = Datatype.INT;
export declare const DOUBLE = Datatype.DOUBLE;
export declare const STRING = Datatype.STRING;
export declare const BOOLEAN = Datatype.BOOLEAN;
export {};
