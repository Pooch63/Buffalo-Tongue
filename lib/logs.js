"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.value_type_as_string = exports.type_to_string = exports.value_to_string = void 0;
var types_1 = require("./types");
var safe_1 = __importDefault(require("colors/safe"));
var type_validation_1 = require("./type_validation");
var type_reps = (_a = {},
    _a[types_1.Datatype.INT] = safe_1.default.green,
    _a[types_1.Datatype.DOUBLE] = safe_1.default.green,
    _a[types_1.Datatype.BOOLEAN] = safe_1.default.yellow,
    _a[types_1.Datatype.STRING] = safe_1.default.blue,
    _a);
function value_to_string(value) {
    if (typeof value == "boolean")
        return safe_1.default.yellow(value ? "true" : "false");
    if (typeof value == "number")
        return safe_1.default.green(value.toString());
    if (typeof value == "string") {
        return safe_1.default.blue("\"".concat(value.replaceAll('"', '\\"'), "\""));
    }
}
exports.value_to_string = value_to_string;
function type_to_string(type) {
    switch (type) {
        case types_1.Datatype.INT:
            return type_reps[types_1.Datatype.INT]("integer");
        case types_1.Datatype.DOUBLE:
            return type_reps[types_1.Datatype.DOUBLE]("double");
        case types_1.Datatype.STRING:
            return type_reps[types_1.Datatype.STRING]("string");
        case types_1.Datatype.BOOLEAN:
            return type_reps[types_1.Datatype.BOOLEAN]("boolean");
    }
}
exports.type_to_string = type_to_string;
function value_type_as_string(value) {
    if (type_validation_1.Validation.is_int(value))
        return type_reps[types_1.Datatype.INT]("integer");
    if (type_validation_1.Validation.is_double(value))
        return type_reps[types_1.Datatype.DOUBLE]("double");
    return {
        string: type_reps[types_1.Datatype.STRING]("string"),
        boolean: type_reps[types_1.Datatype.BOOLEAN]("boolean"),
    }[typeof value];
}
exports.value_type_as_string = value_type_as_string;
//# sourceMappingURL=logs.js.map