import { RowData, TableRecord } from "./types";
import { Datatype } from "./types";
export declare namespace Schema {
    function validate_type({ value, type, }: {
        value: RowData;
        type: Datatype;
    }): boolean;
    interface ColumnInfo {
        name: string;
        type: Datatype;
        unique?: boolean;
        nullable?: boolean;
        default?: RowData | null;
        validation?: (value: any) => boolean;
    }
    class Column {
        name: string;
        type: Datatype;
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
