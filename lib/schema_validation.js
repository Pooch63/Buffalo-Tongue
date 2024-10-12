"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = void 0;
var logs_1 = require("./logs");
var type_validation_1 = require("./type_validation");
var KEYWORDS = {
    $validation: "true",
};
var Schema;
(function (Schema) {
    var Datatype;
    (function (Datatype) {
        Datatype["INT"] = "integer";
        Datatype["DOUBLE"] = "double";
        Datatype["STRING"] = "string";
        Datatype["BOOLEAN"] = "boolean";
    })(Datatype = Schema.Datatype || (Schema.Datatype = {}));
    function validate_type(_a) {
        var value = _a.value, type = _a.type;
        switch (type) {
            case Schema.Datatype.INT:
                if (!type_validation_1.Validation.is_int(value))
                    return false;
                break;
            case Schema.Datatype.DOUBLE:
                if (!type_validation_1.Validation.is_double(value))
                    return false;
                break;
            case Schema.Datatype.STRING:
                if (typeof value != "string")
                    return false;
                break;
            case Schema.Datatype.BOOLEAN:
                if (typeof value != "boolean")
                    return false;
                break;
            default:
                return false;
        }
        return true;
    }
    Schema.validate_type = validate_type;
    var Column = /** @class */ (function () {
        function Column(info) {
            this.default = null;
            this.unique = false;
            this.name = info.name;
            this.type = info.type;
            if (info.unique != null)
                this.unique = info.unique;
            if (info.default != null)
                this.default = info.default;
            this.validation = info.validation;
            if (info.default != null &&
                !Schema.validate_type({ value: info.default, type: info.type })) {
                throw new Error("Default value for column \"".concat(this.name, "\" does not match type ").concat(this.type, " (value was ").concat((0, logs_1.value_to_string)(info.default), "})"));
            }
            if (KEYWORDS[this.name] != null) {
                throw new Error("Column name \"".concat(this.name, "\" is invalid -- this word is reserved."));
            }
        }
        return Column;
    }());
    Schema.Column = Column;
    var Table = /** @class */ (function () {
        function Table(_a) {
            var columns = _a.columns;
            this.unique_key = null;
            var parsed_cols = [];
            for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
                var col = columns_1[_i];
                parsed_cols.push(new Schema.Column(col));
            }
            //Check if there's a duplicate row name
            var col_names = {};
            for (var _b = 0, parsed_cols_1 = parsed_cols; _b < parsed_cols_1.length; _b++) {
                var col = parsed_cols_1[_b];
                if (col_names[col.name] != null) {
                    throw new Error("Duplicate row \"".concat(col.name, "\""));
                }
                if (col.unique) {
                    //Has there ALREADY BEEN a unique key?
                    if (this.unique_key != null) {
                        throw new Error("Table may not have two unique keys. Columns \"".concat(this.unique_key, "\" and \"").concat(col.name, "\" were both declared as unique."));
                    }
                    this.unique_key = col.name;
                }
            }
            this.columns = parsed_cols;
        }
        //Does a column exist with the given name?
        //Warning: not very performant. Room for improvement, but it should only be called
        //once per database function
        Table.prototype.col_exists = function (col_name) {
            for (var _i = 0, _a = this.columns; _i < _a.length; _i++) {
                var col = _a[_i];
                if (col.name == col_name)
                    return true;
            }
            return false;
        };
        //Is the record valid for the table?
        Table.prototype.validate = function (record) {
            var _a;
            for (var _i = 0, _b = this.columns; _i < _b.length; _i++) {
                var row = _b[_i];
                var value = (_a = record[row.name]) !== null && _a !== void 0 ? _a : row.default;
                if (value == null) {
                    throw new Error("Unable to insert record -- row \"".concat(row.name, "\" was not included, and no default exists."));
                }
                if (!Schema.validate_type({ value: value, type: row.type })) {
                    throw new Error("Column \"".concat(row.name, "\" is not of valid type (valid type is of ").concat(row.type, ", instead got value ").concat((0, logs_1.value_to_string)(value), " as ").concat((0, logs_1.value_type_as_string)(value), ")"));
                }
            }
            return true;
        };
        return Table;
    }());
    Schema.Table = Table;
    //Get the unique value of a row if it exists, otherwise return null.
    function get_unique_key(record, schema) {
        if (schema.unique_key == null)
            return null;
        return record[schema.unique_key];
    }
    Schema.get_unique_key = get_unique_key;
})(Schema || (exports.Schema = Schema = {}));
//# sourceMappingURL=schema_validation.js.map