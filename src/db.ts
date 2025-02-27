import { QueryConditionObject, QueryCondition } from "./conditions";
import { value_to_string, value_type_as_string } from "./logs";
import { Schema } from "./schema_validation";
import { RowData, TableData, TableRecord, Datatype } from "./types";

namespace Errors {
  export class Nonexistent_Value extends Error {}
  export class Bad_Type extends Error {}
  export class Nonexistent_Column extends Error {}
  export class Name_Already_Exists extends Error {}
  export class Not_Enough_Info extends Error {}
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
    for (let row of this.schema.columns) {
      if (record[row.name] == null) record[row.name] = row.default;
    }

    let unique = Schema.get_unique_key(record, this.schema);
    if (unique != null) {
      //Record already exists with that key
      if (this.data[String(unique)] != null) {
        throw new Error(`Unique key "${unique}" has already been inserted.`);
      }
    }

    for (let row of this.schema.columns) {
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

  column_names(): string[] {
    return this.schema.columns.map((c) => c.name);
  }
}

type Update = Record<string, RowData>;
function update_row(update: Update, row: TableRecord) {
  for (let col in row) {
    let value = update[col];
    if (value != null) row[col] = value;
  }
}

type Condition = QueryCondition | QueryConditionObject | null;
const condition_to_obj = (condition: Condition): QueryCondition | null => {
  return condition == null
    ? null
    : condition instanceof QueryCondition
    ? condition
    : new QueryCondition(condition);
};
export class Database {
  private tables: Record<string, Table> = {};
  get_table(table: string): Table {
    if (this.tables[table] == null) {
      throw new Errors.Nonexistent_Value(`Table "${table}" does not exist.`);
    }
    return this.tables[table];
  }

  create_table(name: string, schema: { columns: Schema.ColumnInfo[] }) {
    //Does the table already exist?
    if (this.tables[name] != null) {
      throw new Errors.Name_Already_Exists(
        `Table name "${name}" already exists.`
      );
    }

    let parsed_schema = new Schema.Table({ columns: schema.columns });
    this.tables[name] = new Table({ name, schema: parsed_schema });
  }
  //Create table alias
  create(name: string, schema: { columns: Schema.ColumnInfo[] }) {
    return this.create_table(name, schema);
  }

  private insert_into_table(table: Table, record: TableRecord) {
    table.insert(record);
  }
  insert(table: string, ...records: TableRecord[]) {
    let obj = this.get_table(table);
    for (let record of records) this.insert_into_table(obj, record);
  }

  private select_from_table(
    table: Table,
    b?: string | Condition,
    constraint?: QueryCondition | null
  ): RowData[] | TableRecord[] {
    // If the second argument was a string, it is the column name. Otherwise, it is the third argument
    let condition = typeof b == "string" ? constraint : condition_to_obj(b);
    // If the second argument was a string, then it was the column that they wanted compiled into a list
    let col: string | null = typeof b == "string" ? b : null;

    if (col != null && !table.column_names().includes(col)) {
      throw new Errors.Nonexistent_Column(
        `Cannot compile nonexistent column "${col}" into array.`
      );
    }

    let rows: TableRecord[] = [];
    let col_arr: RowData[] = [];
    //If no condition was proivded, literally just return every row
    if (condition == null) {
      table.each((row: TableRecord) => {
        if (col != null) col_arr.push(row[col]);
        else rows.push(row);
      });
    } else {
      table.each((row: TableRecord) => {
        //Should not continue to add rows
        if (rows.length >= condition.row_limit) return false;
        if (condition.validate(row)) {
          if (col != null) col_arr.push(row[col]);
          else rows.push(row);
        }
      });
    }

    if (col != null) return col_arr;
    return rows;
  }
  select(
    table: string,
    condition?: QueryCondition | QueryConditionObject
  ): TableRecord[];
  select(
    table: string,
    column: string,
    condition?: QueryCondition | QueryConditionObject
  ): RowData[];
  select(
    table: string,
    cols_or_condition?: string | Condition,
    condition?: Condition
  ): RowData[] | TableRecord[] {
    return this.select_from_table(
      this.get_table(table),
      cols_or_condition,
      condition_to_obj(condition)
    );
  }

  private select_count_from_table(
    table: Table,
    condition?: QueryCondition | null
  ): number {
    //If condition is null, return the count of all the tables
    if (condition == null) return table.data_count;

    return this.select_from_table(table, condition).length;
  }
  select_count(
    table: string,
    condition?: QueryCondition | QueryConditionObject | null
  ): number {
    return this.select_count_from_table(
      this.get_table(table),
      condition_to_obj(condition)
    );
  }
  //Select count alias
  count(
    table: string,
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    return this.select_count(table, condition);
  }

  select_distinct(
    table_name: string,
    columns: string | string[],
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    let col_arr = typeof columns == "string" ? [columns] : columns;
    let table = this.get_table(table_name);

    //Make sure every column actually exists
    for (let col of col_arr) {
      if (!table.schema.col_exists(col)) {
        throw new Errors.Nonexistent_Column(
          `Select distinct requested distinct, nonexistent column "${col}"`
        );
      }
    }

    let parsed_condition = condition_to_obj(condition);

    let distinct: Record<string, Record<string | number, TableRecord>> = {};
    for (let col of table.schema.columns) distinct[col.name] = {};

    let rows: TableRecord[] = [];
    table.each((row: TableRecord, key: string | number) => {
      if (condition && !parsed_condition.validate(row)) return;

      //Have we already found a row with a distinct column with the same value as this one?
      for (let col of col_arr) {
        if (distinct[col][row[col].toString()] != null) return;
        distinct[col][row[col].toString()] = row;
      }
      rows.push(row);
    });

    return rows;
  }
  //Select distinct alias
  distinct(
    table_name: string,
    columns: string | string[],
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    return this.select_distinct(table_name, columns, condition);
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
    table_name: string,
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    this.delete_from_table(
      this.get_table(table_name),
      condition_to_obj(condition)
    );
  }

  update(
    table_name: string,
    update: Update,
    condition?: QueryCondition | QueryConditionObject | null
  ) {
    let table = this.get_table(table_name);
    let parsed_condition = condition_to_obj(condition);

    //Validate that every type in the update object matches the column type
    for (let col of table.schema.columns) {
      if (
        update[col.name] != null &&
        !Schema.validate_type({ value: update[col.name], type: col.type })
      ) {
        throw new Errors.Bad_Type(
          `Invalid value provided for column in update statement -- "${
            col.name
          }" is not of valid type (valid type is of ${value_type_as_string(
            col.type
          )}, instead got value ${value_to_string(
            update[col.name]
          )} as ${value_type_as_string(update[col.name])})`
        );
      }
    }

    table.each((row: TableRecord) => {
      //If condition is met, handle the update
      if (parsed_condition == null || parsed_condition.validate(row)) {
        update_row(update, row);
      }
    });
  }

  drop_table(table: string) {
    //Just make sure that it's a valid table
    this.get_table(table);
    delete this.tables[table];
  }
  //Drop table alias
  drop(table: string) {
    return this.drop_table(table);
  }
}

export const INT = Datatype.INT;
export const DOUBLE = Datatype.DOUBLE;
export const STRING = Datatype.STRING;
export const BOOLEAN = Datatype.BOOLEAN;

const db = new Database();
db.create_table("users", {
  columns: [
    { name: "username", type: STRING },
    { name: "age", type: INT },
  ],
});
db.insert("users", { age: 1, username: "Kiyaan" }, { age: 2, username: "Hi!" });
db.insert("users", { age: 2, username: "Hi!" });
db.insert("users", { age: 3, username: "Kiyaan" });

console.log(db.select("users", "username"));
// console.log(db.update("users", { age: 2 }, { username: "yo" }));
console.log(db.select_distinct("users", ["username"]));
console.log(db.select("users"));
