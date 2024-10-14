import { value_to_string, value_type_as_string } from "./logs";
import { RowData, TableRecord } from "./types";
import { Validation } from "./type_validation";

const KEYWORDS = {
  $validation: "true",
};

export namespace Schema {
  export enum Datatype {
    INT = "integer",
    DOUBLE = "double",
    STRING = "string",
    BOOLEAN = "boolean",
  }

  export function validate_type({
    value,
    type,
  }: {
    value: RowData;
    type: Schema.Datatype;
  }): boolean {
    switch (type) {
      case Schema.Datatype.INT:
        if (!Validation.is_int(value)) return false;
        break;
      case Schema.Datatype.DOUBLE:
        if (!Validation.is_double(value)) return false;
        break;
      case Schema.Datatype.STRING:
        if (typeof value != "string") return false;
        break;
      case Schema.Datatype.BOOLEAN:
        if (typeof value != "boolean") return false;
        break;
      default:
        return false;
    }
    return true;
  }

  export interface ColumnInfo {
    name: string;
    type: Schema.Datatype;
    unique?: boolean;
    nullable?: boolean;
    default?: RowData | null;

    //If provided, run the function on every row entered. If it returns false, an error is returned.
    validation?: (value: any) => boolean;
  }
  export class Column {
    public name: string;
    public type: Schema.Datatype;
    public default?: RowData | null = null;
    public unique?: boolean = false;
    public nullable?: boolean = false;
    public validation?: (value: RowData) => boolean;

    constructor(info: ColumnInfo) {
      this.name = info.name;
      this.type = info.type;
      if (info.unique != null) this.unique = info.unique;
      if (info.default != null) this.default = info.default;
      if (info.nullable != null) this.nullable = info.nullable;
      this.validation = info.validation;

      if (
        info.default != null &&
        !Schema.validate_type({ value: info.default, type: info.type })
      ) {
        throw new Error(
          `Default value for column "${this.name}" does not match type ${
            this.type
          } (value was ${value_to_string(info.default)}})`
        );
      }

      if (KEYWORDS[this.name] != null) {
        throw new Error(
          `Column name "${this.name}" is invalid -- this word is reserved.`
        );
      }
    }
  }

  export class Table {
    public columns: Schema.Column[];
    public unique_key: string | null = null;

    constructor({ columns }: { columns: Schema.ColumnInfo[] }) {
      let parsed_cols: Schema.Column[] = [];
      let col_names: Record<string, any> = {};
      for (let col of columns) {
        if (col_names[col.name] != null) {
          throw new Error(`Duplicate row "${col.name}"`);
        }

        if (col_names[col.name] != null) {
          throw new Error(`Duplicate row "${col.name}"`);
        }
        parsed_cols.push(new Schema.Column(col));
      }

      //Check if there's a duplicate row name
      for (let col of parsed_cols) {
        if (col.unique) {
          //Has there ALREADY BEEN a unique key?
          if (this.unique_key != null) {
            throw new Error(
              `Table may not have two unique keys. Columns "${this.unique_key}" and "${col.name}" were both declared as unique.`
            );
          }
          this.unique_key = col.name;
        }
      }

      this.columns = parsed_cols;
    }

    //Does a column exist with the given name?
    //Warning: not very performant. Room for improvement, but it should only be called
    //once per database function
    col_exists(col_name: string): boolean {
      for (let col of this.columns) if (col.name == col_name) return true;
      return false;
    }

    //Is the record valid for the table?
    validate(record: TableRecord): boolean {
      for (let col_name in record) {
        if (!this.col_exists(col_name)) {
          throw new Error(`Unrecognized column "${col_name}" in record.`);
        }
      }

      for (let col of this.columns) {
        let value = record[col.name] ?? col.default;
        if (value == null && !col.nullable) {
          throw new Error(
            `Unable to insert record -- row "${col.name}" was not included, it cannot be null, and no default exists.`
          );
        }
        if (value != null && !Schema.validate_type({ value, type: col.type })) {
          throw new Error(
            `Column "${col.name}" is not of valid type (valid type is of ${
              col.type
            }, instead got value ${value_to_string(
              value
            )} as ${value_type_as_string(value)})`
          );
        }
      }
      return true;
    }
  }

  //Get the unique value of a row if it exists, otherwise return null.
  export function get_unique_key(
    record: TableRecord,
    schema: Schema.Table
  ): null | RowData {
    if (schema.unique_key == null) return null;
    return record[schema.unique_key];
  }
}
