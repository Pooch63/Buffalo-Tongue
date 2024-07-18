import * as colors from "colors/safe";

export type RowData = number | string | boolean;
export type TableRecord = Record<string, RowData>;
//If a table has a unique
export type TableData = Record<string | number, TableRecord | null>;

type QueryConditionObject = {
  //For every column in a row you try to insert
  //If that column name is a value in the QueryConditionObject,
  //it checks that value against the provided condition
  [name in string]:  //You may define more than one of these conditions //E.g., if lte = 3, this only returns records in which the provided column is less than or equal to 3 //If any value is defined in this object, it is tested against the row data. //Not equal, equal, <, >, <=, >=
    | {
        not_eq?: RowData;
        eq?: RowData;
        lt?: number;
        gt?: number;
        lte?: number;
        gte?: number;
      }
    //Or, if this value is simply row data, it checks whether or not the column is equal to this value.
    // It is equivalent to specifying the "eq" value in the object.
    | RowData;
};

function value_to_string(value: RowData) {
  if (typeof value == "boolean") return colors.yellow(value ? "true" : "false");
  if (typeof value == "number") return colors.green(value.toString());
  if (typeof value == "string") {
    return colors.blue(`"${value.replaceAll('"', '\\"')}"`);
  }
}

namespace Validation {
  export function is_int(value: RowData): boolean {
    if (typeof value != "number") return false;
    return value == Math.floor(value);
  }
  export function is_double(value: RowData): boolean {
    return typeof value == "number";
  }
}

namespace Schema {
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
        if (typeof value == "string") return false;
        break;
      case Schema.Datatype.BOOLEAN:
        if (typeof value == "boolean") return false;
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

    //If provided, run the function on every row entered. If it returns false, an error is returned.
    validation?: (value: any) => boolean;

    default?: RowData | null;
  }
  export class Row {
    public name: string;
    public type: Schema.Datatype;
    public default?: RowData | null = null;
    public unique?: boolean = false;
    public validation?: (value: RowData) => boolean;

    constructor(info: ColumnInfo) {
      this.name = info.name;
      this.type = info.type;
      if (info.unique != null) this.unique = info.unique;
      if (info.default != null) this.default = info.default;
      this.validation = info.validation;
    }
  }

  export class Table {
    public rows: Schema.Row[];
    public unique_key: string | null = null;
    constructor({ rows }: { rows: Schema.ColumnInfo[] }) {
      let parsed_rows: Schema.Row[] = [];
      for (let row of rows) parsed_rows.push(new Schema.Row(row));

      //Check if there's a duplicate row name
      let row_names: Record<string, any> = {};
      for (let row of parsed_rows) {
        if (row_names[row.name] != null) {
          throw new Error(`Duplicate row "${row.name}"`);
        }
        if (row.unique) {
          //Has there ALREADY BEEN a unique key?
          if (this.unique_key != null) {
            throw new Error(
              `Table may not have two unique keys. Rows "${this.unique_key}" and "${row.name}" were both declared as unique.`
            );
          }
          this.unique_key = row.name;
        }
      }

      this.rows = parsed_rows;
    }

    //Is the record valid for the table?
    validate(record: TableRecord): boolean {
      for (let row of this.rows) {
        let value = record[row.name] ?? row.default;
        if (!value) {
          throw new Error(
            `Unable to insert record -- row "${row.name}" was not included, and no default exists.`
          );
        }
        if (!Schema.validate_type({ value, type: row.type })) {
          throw new Error(
            `Column "${row.name}" is not of valid type (valid type is of ${row.type})`
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

class QueryCondition {
  public conditions: (QueryCondition | QueryConditionObject)[] = [];
  public row_limit: number = Number.POSITIVE_INFINITY;
  or(condition: QueryCondition | QueryConditionObject): this {
    this.conditions.push(condition);
    return this;
  }
  limit(limit: number): this {
    this.row_limit = limit;
    return this;
  }

  private validate_against_condition({
    row,
    condition,
  }: {
    row: TableRecord;
    condition: QueryConditionObject;
  }): boolean {
    for (let name in condition) {
      let value = row[name];
      let data = condition[name];

      //Is it just plain data?
      if (typeof data != "object") return value == data;

      if (data.not_eq && !(value !== data.not_eq)) return false;

      if (data.eq && !(value === data.eq)) return false;

      if (data.lt && !(typeof value == "number" && value < data.lt)) {
        return false;
      }

      if (data.gt && !(typeof value == "number" && value > data.gt)) {
        return false;
      }

      if (data.lte && !(typeof value == "number" && value <= data.lte)) {
        return false;
      }

      if (data.gte && !(typeof value == "number" && value >= data.gte)) {
        return false;
      }
    }

    return true;
  }
  validate(row: TableRecord): boolean {
    for (let condition of this.conditions) {
      if (condition instanceof QueryCondition) {
        if (!condition.validate(row)) return false;
      } else if (!this.validate_against_condition({ row, condition }))
        return false;
    }
    return true;
  }

  constructor(condition: QueryConditionObject) {
    this.conditions.push(condition);
  }
}

class Table {
  public name: string;
  public schema: Schema.Table;

  public data: TableData = {};
  public data_count: number = 0;
  constructor({ name, schema }: { name: string; schema: Schema.Table }) {
    this.name = name;
    this.schema = schema;
  }

  insert(record: TableRecord) {
    if (!this.schema.validate(record)) {
      throw new Error(
        `Record inserted into table "${this.name}" did not match schema.`
      );
    }

    //Add any defaults necessary
    for (let row of this.schema.rows) {
      if (record[row.name] == null) record[row.name] = row.default;
    }

    let unique = Schema.get_unique_key(record, this.schema);
    if (unique != null) {
      //Record already exists with that key
      if (this.data[String(unique)] != null) {
        throw new Error(`Unique key "${unique}" has already been inserted.`);
      }
    }

    for (let row of this.schema.rows) {
      if (typeof row.validation == "function") {
        if (!row.validation(record[row.name])) {
          throw new Error(
            `Custom validation function declared that column "${
              row.name
            }" was invalid (value was ${value_to_string(record[row.name])})`
          );
        }
      }
    }

    this.data[unique == null ? this.data_count : String(unique)] = record;

    this.data_count += 1;
  }

  //Iterate through each row with a function
  //If the function returns false, we stop iterating through the list
  each(func: (row: TableRecord, key: string | number) => boolean | void) {
    for (let key in this.data) {
      if (this.data[key] != null) {
        let should_continue = func(this.data[key], key);
        if (should_continue == false) break;
      }
    }
  }
  //Iterate through each row with a function
  //If the function returns true, we delete it from the data
  filter(func: (row: TableRecord, key: string | number) => boolean) {
    let unique = this.schema.unique_key != null;
    //If this table has a unique key, provide the key as a string, otherwise a number
    //If we don't have a unique key, we need to actually create a new object, because indices are based on their entry number.

    if (unique) {
      for (let key in this.data) {
        if (this.data[key] != null) {
          if (!func(this.data[key], key)) this.data[key] = null;
        }
      }
    } else {
      let new_data: TableData = {};
      let num_entries = 0;
      for (let row = 0; row < this.data_count; row += 1) {
        if (func(this.data[row], row)) continue;

        new_data[num_entries] = this.data[row];
        num_entries += 1;
      }
      this.data = new_data;
      this.data_count = num_entries;
    }
  }
}

export class Database {
  private tables: Record<string, Table> = {};
  private get_table(table: string): Table {
    if (this.tables[table] == null) {
      throw new Error(`Table "${table}" does not exist.`);
    }
    return this.tables[table];
  }

  create_table(
    name: string,
    schema: Schema.Table | { rows: Schema.ColumnInfo[] }
  ) {
    let parsed_schema =
      schema instanceof Schema.Table
        ? schema
        : new Schema.Table({ rows: schema.rows });
    this.tables[name] = new Table({ name, schema: parsed_schema });
  }
  public create = this.create_table;

  private insert_into_table(table: Table, record: TableRecord) {
    table.insert(record);
  }
  insert(table: string, record: TableRecord) {
    this.insert_into_table(this.get_table(table), record);
  }

  private select_from_table(
    table: Table,
    condition?: QueryCondition | null
  ): TableRecord[] {
    //If no condition was proivded, literally just return every row
    if (condition == null) {
      let rows: TableRecord[] = [];
      table.each((row: TableRecord) => {
        rows.push(row);
      });
      return rows;
    }

    let rows: TableRecord[] = [];
    table.each((row: TableRecord) => {
      //Should not continue to add rows
      if (rows.length >= condition.row_limit) return false;
      if (condition.validate(row)) rows.push(row);
    });
    return rows;
  }
  select(
    table: string,
    condition?: QueryCondition | QueryConditionObject | null
  ): TableRecord[] {
    if (this.tables[table] == null) {
      throw new Error(`Table "${table}" does not exist.`);
    }

    return this.select_from_table(
      this.tables[table],
      condition == null
        ? null
        : condition instanceof QueryCondition
        ? condition
        : new QueryCondition(condition)
    );
  }

  private select_count_from_table(
    table: Table,
    condition?: QueryCondition | null
  ) {
    //If condition is null, return the count of all the tables
    if (condition == null) return table.data_count;

    let count = 0;
    table.each((row: TableRecord) => {
      if (condition.validate(row)) count += 1;
    });

    return count;
  }
  select_count(
    table: string,
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    if (this.tables[table] == null) {
      throw new Error(`Table "${table}" does not exist.`);
    }

    return this.select_count_from_table(
      this.tables[table],
      condition == null
        ? null
        : condition instanceof QueryCondition
        ? condition
        : new QueryCondition(condition)
    );
  }

  private delete_from_table(table: Table, condition?: QueryCondition | null) {
    //If condition equals null, just delete every single record.
    //Otherwise, only delete records for which the condition returns true.
    table.filter((row: TableRecord) => {
      if (condition == null) return true;
      return condition.validate(row);
    });
  }
  delete(
    table: string,
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    this.delete_from_table(
      this.get_table(table),
      condition == null
        ? null
        : condition instanceof QueryCondition
        ? condition
        : new QueryCondition(condition)
    );
  }

  select_distinct() {}
  distint = this.select_distinct;
}

export const INT = Schema.Datatype.INT;
export const DOUBLE = Schema.Datatype.DOUBLE;
export const STRING = Schema.Datatype.STRING;
export const BOOLEAN = Schema.Datatype.BOOLEAN;

// let db = new Database();
// db.create_table("users", {
//   rows: [
//     { name: "username", type: STRING, unique: true },
//     { name: "age", type: INT, unique: false },
//   ],
// });
// db.insert("users", { age: 1.75, username: "Kiyaan" });
