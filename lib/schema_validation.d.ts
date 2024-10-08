import { RowData, TableRecord } from "./types";
export declare namespace Schema {
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
    class Column {
        name: string;
        type: Schema.Datatype;
        default?: RowData | null;
        unique?: boolean;
        validation?: (value: RowData) => boolean;
        constructor(info: ColumnInfo);
    }
    class Table {
        rows: Schema.Column[];
        unique_key: string | null;
        constructor({ rows }: {
            rows: Schema.ColumnInfo[];
        });
        col_exists(col: string): boolean;
        validate(record: TableRecord): boolean;
    }
    function get_unique_key(record: TableRecord, schema: Schema.Table): null | RowData;
}
