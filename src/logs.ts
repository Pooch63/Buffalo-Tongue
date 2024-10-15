import { Datatype } from "./types";
import colors from "colors/safe";
import { RowData } from "./types";
import { Validation } from "./type_validation";

const type_reps = {
  [Datatype.INT]: colors.green,
  [Datatype.DOUBLE]: colors.green,
  [Datatype.BOOLEAN]: colors.yellow,
  [Datatype.STRING]: colors.blue,
};

export function value_to_string(value: RowData) {
  if (typeof value == "boolean") return colors.yellow(value ? "true" : "false");
  if (typeof value == "number") return colors.green(value.toString());
  if (typeof value == "string") {
    return colors.blue(`"${value.replaceAll('"', '\\"')}"`);
  }
}
export function type_to_string(type: Datatype) {
  switch (type) {
    case Datatype.INT:
      return type_reps[Datatype.INT]("integer");
    case Datatype.DOUBLE:
      return type_reps[Datatype.DOUBLE]("double");
    case Datatype.STRING:
      return type_reps[Datatype.STRING]("string");
    case Datatype.BOOLEAN:
      return type_reps[Datatype.BOOLEAN]("boolean");
  }
}
export function value_type_as_string(value: RowData) {
  if (Validation.is_int(value)) return type_reps[Datatype.INT]("integer");
  if (Validation.is_double(value)) return type_reps[Datatype.DOUBLE]("double");

  return {
    string: type_reps[Datatype.STRING]("string"),
    boolean: type_reps[Datatype.BOOLEAN]("boolean"),
  }[typeof value];
}
