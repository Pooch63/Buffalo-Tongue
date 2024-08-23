import colors from "colors/safe";
import { RowData } from "./types";
import { Validation } from "./type_validation";

export function value_to_string(value: RowData) {
  if (typeof value == "boolean") return colors.yellow(value ? "true" : "false");
  if (typeof value == "number") return colors.green(value.toString());
  if (typeof value == "string") {
    return colors.blue(`"${value.replaceAll('"', '\\"')}"`);
  }
}
export function value_type_as_string(value: RowData) {
  if (Validation.is_int(value)) return colors.green("integer");
  if (Validation.is_double(value)) return colors.green("double");

  return {
    string: colors.blue("string"),
    boolean: colors.yellow("boolean"),
  }[typeof value];
}
