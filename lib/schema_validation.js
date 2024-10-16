"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = void 0;
var logs_1 = require("./logs");
var type_validation_1 = require("./type_validation");
var types_1 = require("./types");
var KEYWORDS = {
    $validation: "true",
};
var Schema;
(function (Schema) {
    function validate_type(_a) {
        var value = _a.value, type = _a.type;
        switch (type) {
            case types_1.Datatype.INT:
                if (!type_validation_1.Validation.is_int(value))
                    return false;
                break;
            case types_1.Datatype.DOUBLE:
                if (!type_validation_1.Validation.is_double(value))
                    return false;
                break;
            case types_1.Datatype.STRING:
                if (typeof value != "string")
                    return false;
                break;
            case types_1.Datatype.BOOLEAN:
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
            this.nullable = false;
            this.name = info.name;
            this.type = info.type;
            if (info.unique != null)
                this.unique = info.unique;
            if (info.default != null)
                this.default = info.default;
            if (info.nullable != null)
                this.nullable = info.nullable;
            // You can't have a default and also say a column can be null
            if (info.default && info.nullable == false) {
                throw new Error("Column \"".concat(info.name, "\" can not be non-nullable AND have a default value."));
            }
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
            var col_names = {};
            for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
                var col = columns_1[_i];
                if (col_names[col.name] != null) {
                    throw new Error("Duplicate row \"".concat(col.name, "\""));
                }
                if (col_names[col.name] != null) {
                    throw new Error("Duplicate row \"".concat(col.name, "\""));
                }
                parsed_cols.push(new Schema.Column(col));
            }
            //Check if there's a duplicate row name
            for (var _b = 0, parsed_cols_1 = parsed_cols; _b < parsed_cols_1.length; _b++) {
                var col = parsed_cols_1[_b];
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
            for (var col_name in record) {
                if (!this.col_exists(col_name)) {
                    throw new Error("Unrecognized column \"".concat(col_name, "\" in record."));
                }
            }
            for (var _i = 0, _b = this.columns; _i < _b.length; _i++) {
                var col = _b[_i];
                var value = (_a = record[col.name]) !== null && _a !== void 0 ? _a : col.default;
                if (value == null && !col.nullable) {
                    throw new Error("Unable to insert record -- row \"".concat(col.name, "\" was not included, it cannot be null, and no default exists."));
                }
                if (value != null && !Schema.validate_type({ value: value, type: col.type })) {
                    throw new Error("Column \"".concat(col.name, "\" is not of valid type (valid type is of ").concat((0, logs_1.type_to_string)(col.type), ", instead got value ").concat((0, logs_1.value_to_string)(value), " as ").concat((0, logs_1.value_type_as_string)(value), ")"));
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