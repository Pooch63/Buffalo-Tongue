import { RowData } from "./types";

export namespace Validation {
  export function is_int(value: RowData): boolean {
    if (typeof value != "number") return false;
    return value == Math.floor(value);
  }
  export function is_double(value: RowData): boolean {
    return typeof value == "number";
  }
}
