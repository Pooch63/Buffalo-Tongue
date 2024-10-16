import { RowData, TableKey, TableRecord } from "./types";

export type QueryConditionObject = {
  //For every row inserted, if provided, this function is called.
  //If it returns false, the record is not validated against the condition.
  //Note that this function is evaluated BEFORE checking the specifications for the columns.
  //E.g., with { age: { lte: 0 }, $validation: (row) => row.username.length > 40 },
  //first the { lte: 0 } part is evaluated for age. Only if the record passes that test is the $validation valled.
  $validation?: (row: TableRecord) => boolean;
  // The condition in the and object must ALSO be true to validate a row.
  // It is NOT recommended to use this. The feature was onl added to add support for a SQL-like CLI tool.
  and?: QueryConditionObject;
} & {
  //For every column in a row you try to insert
  //If that column name is a value in the QueryConditionObject,
  //it checks that value against the provided condition
  [name in string]:  //You may define more than one of these conditions //E.g., if lte = 3, this only returns records in which the provided column is less than or equal to 3 //If any value is defined in this object, it is tested against the row data. //Not equal, equal, <, >, <=, >=
    | {
        //not_eq and neq do the same thing
        not_eq?: RowData;
        neq?: RowData;
        eq?: RowData;
        lt?: number;
        gt?: number;
        lte?: number;
        gte?: number;
      }
    //Or, if this value is simply row data, it checks whether or not the column is equal to this value.
    // It is equivalent to specifying the "eq" value in the object.
    | RowData
    //Or, if they specify a validation function, it will get the value and the key, and if it returns false,
    //the record is invalid against the condition.
    | ((value: RowData, key: TableKey) => boolean);
};

export class QueryCondition {
  public conditions: QueryConditionObject[] = [];
  public row_limit: number = Number.POSITIVE_INFINITY;
  or(condition: QueryCondition | QueryConditionObject): this {
    if (condition instanceof QueryCondition) {
      for (let subcondition of condition.conditions) {
        this.conditions.push(subcondition);
      }
    } else this.conditions.push(condition);
    return this;
  }
  limit(limit: number): this {
    this.row_limit = limit;
    return this;
  }

  private validate_against_condition(
    row: TableRecord,
    condition: QueryConditionObject
  ): boolean {
    //If they provided a custom validation function and it returned false, also return false
    if (condition.$validation && !condition.$validation(row)) return false;

    for (let name in condition) {
      let value = row[name];
      let data = condition[name];

      //Make sure it's not a seperate value that doesn't describe the column, like $validation
      if (value == undefined) continue;

      //Is it a custom validation function?
      if (typeof data == "function") return data(value, name);

      //Is it just plain data?
      if (typeof data != "object") return value == data;

      if (data.neq && !(value !== data.neq)) return false;
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

    if (condition.and) {
      return this.validate_against_condition(row, condition.and);
    }

    return true;
  }
  validate(row: TableRecord): boolean {
    if (this.conditions.length == 0)
      return this.validate_against_condition(row, this.conditions[0]);
    for (let condition of this.conditions) {
      if (!this.validate_against_condition(row, condition)) return false;
    }
    return true;
  }

  constructor(condition: QueryConditionObject) {
    this.conditions.push(condition);
  }
}
