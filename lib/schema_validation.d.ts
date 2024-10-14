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
        nullable?: boolean;
        default?: RowData | null;
        validation?: (value: any) => boolean;
    }
    class Column {
        name: string;
        type: Schema.Datatype;
        default?: RowData | null;
        unique?: boolean;
        nullable?: boolean;
        validation?: (value: RowData) => boolean;
        constructor(info: ColumnInfo);
    }
    class Table {
        columns: Schema.Column[];
        unique_key: string | null;
        constructor({ columns }: {
            columns: Schema.ColumnInfo[];
        });
        col_exists(col_name: string): boolean;
        validate(record: TableRecord): boolean;
    }
    function get_unique_key(record: TableRecord, schema: Schema.Table): null | RowData;
}
