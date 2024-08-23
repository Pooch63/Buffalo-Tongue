"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.value_type_as_string = exports.value_to_string = void 0;
var safe_1 = __importDefault(require("colors/safe"));
var type_validation_1 = require("./type_validation");
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
function value_type_as_string(value) {
    if (type_validation_1.Validation.is_int(value))
        return safe_1.default.green("integer");
    if (type_validation_1.Validation.is_double(value))
        return safe_1.default.green("double");
    return {
        string: safe_1.default.blue("string"),
        boolean: safe_1.default.yellow("boolean"),
    }[typeof value];
}
exports.value_type_as_string = value_type_as_string;
//# sourceMappingURL=logs.js.map