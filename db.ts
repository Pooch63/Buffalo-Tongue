namespace Validation {
  export function is_int(value: RowData): boolean {
    if (typeof value != "number") return false;
    return value == Math.floor(value);
  }
  export function is_double(value: RowData): boolean {
    return typeof value == "number";
  }
  export function is_string(value: RowData): boolean {
    return typeof value == "string";
  }
}

namespace Schema {
  export enum Datatype {
    INT = "integer",
    DOUBLE = "double",
    STRING = "string",
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
        if (!Validation.is_string(value)) return false;
        break;
      default:
        return false;
    }
    return true;
  }

  export interface RowInfo {
    name: string;
    type: Schema.Datatype;
    unique?: boolean;

    default?: RowData | null;
  }
  export class Row {
    public name: string;
    public type: Schema.Datatype;
    public default?: RowData | null = null;
    public unique?: boolean = false;

    constructor(info: RowInfo) {
      this.name = info.name;
      this.type = info.type;
      if (info.unique != null) this.unique = info.unique;
      if (info.default != null) this.default = info.default;
    }
  }

  export class Table {
    public rows: Schema.Row[];
    public unique_key: string | null = null;
    constructor({ rows }: { rows: Schema.RowInfo[] }) {
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

  export function get_unique_key(
    record: TableRecord,
    schema: Schema.Table
  ): null | RowData {
    if (schema.unique_key == null) return null;
    return record[schema.unique_key];
  }
}

export const INT = Schema.Datatype.INT;
export const DOUBLE = Schema.Datatype.DOUBLE;
export const STRING = Schema.Datatype.STRING;

type QueryConditionObject = {
  [name in string]:
    | {
        not_eq?: RowData;
        eq?: RowData;
        lt?: number;
        gt?: number;
        lte?: number;
        gte?: number;
      }
    | RowData;
};

class QueryCondition {
  public conditions: QueryConditionObject[] = [];
  public row_limit = Number.POSITIVE_INFINITY;
  or(condition: QueryConditionObject): this {
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

      if (data.not_eq && !(value != data.not_eq)) return false;

      if (data.eq && !(value == data.eq)) return false;

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
      if (this.validate_against_condition({ row, condition })) return true;
    }
    return false;
  }

  constructor(condition: QueryConditionObject) {
    this.conditions.push(condition);
  }
}

type RowData = number | string | boolean;
type TableRecord = Record<string, RowData>;
type TableData = Record<string | number, TableRecord>;

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

    this.data[unique == null ? this.data_count : String(unique)] = record;

    this.data_count += 1;
  }

  //Iterate through each row with a function
  //If the function returns false, we stop iterating through the list
  each(func: (row: TableRecord, key: string | number) => boolean | void) {
    for (let key in this.data) {
      let should_continue = func(this.data[key], key);
      if (should_continue == false) break;
    }
  }
}

export class Database {
  private tables: Record<string, Table> = {};

  /**
   * @param path - The path to the file where we should retrieve the database. If not provided, DB is simply stored in memory
   */
  constructor(path?: string) {}

  create_table({
    name,
    schema,
  }: {
    name: string;
    schema: Schema.Table | { rows: Schema.RowInfo[] };
  }) {
    let parsed_schema =
      schema instanceof Schema.Table
        ? schema
        : new Schema.Table({ rows: schema.rows });
    this.tables[name] = new Table({ name, schema: parsed_schema });
  }
  private insert_into_table({
    table,
    record,
  }: {
    table: Table;
    record: TableRecord;
  }) {
    table.insert(record);
  }
  insert({ table, record }: { table: string; record: TableRecord }) {
    if (this.tables[table] == null) {
      throw new Error(`Table "${table}" does not exist.`);
    }
    this.insert_into_table({ table: this.tables[table], record });
  }

  private select_from_table({
    table,
    condition,
  }: {
    table: Table;
    condition?: QueryCondition | null;
  }): TableRecord[] {
    //If no condition was proivded, literally just return every row
    if (condition == null) {
      let rows: TableRecord[] = [];
      table.each((row: TableRecord) => {
        rows.push(row);
      });
      return rows;
    }

    let rows: TableRecord[] = [];
    table.each((row: TableRecord, key: string | number) => {
      //Should not continue to add rows
      if (rows.length >= condition.row_limit) return false;
      if (condition.validate(row)) rows.push(row);
    });
    return rows;
  }
  select({
    table,
    condition,
  }: {
    table: string;
    condition?: QueryCondition | QueryConditionObject | null;
  }) {
    if (this.tables[table] == null) {
      throw new Error(`Table "${table}" does not exist.`);
    }

    let parsed_condition =
      condition instanceof QueryCondition
        ? condition
        : new QueryCondition(condition);

    return this.select_from_table({
      table: this.tables[table],
      condition: parsed_condition,
    });
  }

  private select_count_from_table({
    table,
    condition,
  }: {
    table: Table;
    condition?: QueryCondition | null;
  }) {
    //If condition is null, return the count of all the tables
    if (condition == null) return table.data_count;

    let count = 0;
    table.each((row: TableRecord) => {
      if (condition.validate(row)) count += 1;
    });

    return count;
  }
  select_count({
    table,
    condition,
  }: {
    table: string;
    condition?: QueryCondition | QueryConditionObject | null;
  }) {
    if (this.tables[table] == null) {
      throw new Error(`Table "${table}" does not exist.`);
    }

    let parsed_condition =
      condition instanceof QueryCondition
        ? condition
        : new QueryCondition(condition);

    return this.select_count_from_table({
      table: this.tables[table],
      condition: parsed_condition,
    });
  }

  table(name: string): Table | null {
    return this.tables[name];
  }
}

// const db = new Database();
// db.create_table({
//   name: "products",
//   schema: {
//     rows: [
//       //Note that we aren't specifying unique: false here. Rows default to not being unique
//       { name: "name", type: STRING },
//       { name: "cost", type: DOUBLE, default: 5.0 },
//     ],
//   },
// });

// db.insert({ table: "products", record: { name: "shoes", cost: 100 } });
// db.insert({ table: "products", record: { name: "gloves" } });

// console.log(
//   db.select({
//     table: "products",
//   })
// );
