export type RowData = number | string | boolean;
export type TableRecord = Record<string, RowData>;
export type TableKey = string | number;
export type TableData = Record<TableKey, TableRecord | null>;
