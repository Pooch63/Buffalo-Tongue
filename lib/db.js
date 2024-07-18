"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOLEAN = exports.STRING = exports.DOUBLE = exports.INT = exports.Database = void 0;
var safe_1 = __importDefault(require("colors/safe"));
function value_to_string(value) {
    if (typeof value == "boolean")
        return safe_1.default.yellow(value ? "true" : "false");
    if (typeof value == "number")
        return safe_1.default.green(value.toString());
    if (typeof value == "string") {
        return safe_1.default.blue("\"".concat(value.replaceAll('"', '\\"'), "\""));
    }
}
function value_type_as_string(value) {
    if (Validation.is_int(value))
        return safe_1.default.green("integer");
    if (Validation.is_double(value))
        return safe_1.default.green("double");
    return {
        string: safe_1.default.blue("string"),
        boolean: safe_1.default.yellow("boolean"),
    }[typeof value];
}
var Validation;
(function (Validation) {
    function is_int(value) {
        if (typeof value != "number")
            return false;
        return value == Math.floor(value);
    }
    Validation.is_int = is_int;
    function is_double(value) {
        return typeof value == "number";
    }
    Validation.is_double = is_double;
})(Validation || (Validation = {}));
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
                if (!Validation.is_int(value))
                    return false;
                break;
            case Schema.Datatype.DOUBLE:
                if (!Validation.is_double(value))
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
    var Row = /** @class */ (function () {
        function Row(info) {
            this.default = null;
            this.unique = false;
            this.name = info.name;
            this.type = info.type;
            if (info.unique != null)
                this.unique = info.unique;
            if (info.default != null)
                this.default = info.default;
            this.validation = info.validation;
        }
        return Row;
    }());
    Schema.Row = Row;
    var Table = /** @class */ (function () {
        function Table(_a) {
            var rows = _a.rows;
            this.unique_key = null;
            var parsed_rows = [];
            for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                var row = rows_1[_i];
                parsed_rows.push(new Schema.Row(row));
            }
            //Check if there's a duplicate row name
            var row_names = {};
            for (var _b = 0, parsed_rows_1 = parsed_rows; _b < parsed_rows_1.length; _b++) {
                var row = parsed_rows_1[_b];
                if (row_names[row.name] != null) {
                    throw new Error("Duplicate row \"".concat(row.name, "\""));
                }
                if (row.unique) {
                    //Has there ALREADY BEEN a unique key?
                    if (this.unique_key != null) {
                        throw new Error("Table may not have two unique keys. Rows \"".concat(this.unique_key, "\" and \"").concat(row.name, "\" were both declared as unique."));
                    }
                    this.unique_key = row.name;
                }
            }
            this.rows = parsed_rows;
        }
        //Is the record valid for the table?
        Table.prototype.validate = function (record) {
            var _a;
            for (var _i = 0, _b = this.rows; _i < _b.length; _i++) {
                var row = _b[_i];
                var value = (_a = record[row.name]) !== null && _a !== void 0 ? _a : row.default;
                if (value == null) {
                    throw new Error("Unable to insert record -- row \"".concat(row.name, "\" was not included, and no default exists."));
                }
                if (!Schema.validate_type({ value: value, type: row.type })) {
                    throw new Error("Column \"".concat(row.name, "\" is not of valid type (valid type is of ").concat(row.type, ", instead got value ").concat(value_to_string(value), " as ").concat(value_type_as_string(value), ")"));
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
})(Schema || (Schema = {}));
var QueryCondition = /** @class */ (function () {
    function QueryCondition(condition) {
        this.conditions = [];
        this.row_limit = Number.POSITIVE_INFINITY;
        this.conditions.push(condition);
    }
    QueryCondition.prototype.or = function (condition) {
        this.conditions.push(condition);
        return this;
    };
    QueryCondition.prototype.limit = function (limit) {
        this.row_limit = limit;
        return this;
    };
    QueryCondition.prototype.validate_against_condition = function (_a) {
        var row = _a.row, condition = _a.condition;
        for (var name_1 in condition) {
            var value = row[name_1];
            var data = condition[name_1];
            //Is it just plain data?
            if (typeof data != "object")
                return value == data;
            if (data.not_eq && !(value !== data.not_eq))
                return false;
            if (data.eq && !(value === data.eq))
                return false;
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
    };
    QueryCondition.prototype.validate = function (row) {
        for (var _i = 0, _a = this.conditions; _i < _a.length; _i++) {
            var condition = _a[_i];
            if (condition instanceof QueryCondition) {
                if (!condition.validate(row))
                    return false;
            }
            else if (!this.validate_against_condition({ row: row, condition: condition }))
                return false;
        }
        return true;
    };
    return QueryCondition;
}());
function update_row(update, row) {
    for (var col in row) {
        var value = update[col];
        if (value != null)
            row[col] = value;
    }
}
var Table = /** @class */ (function () {
    function Table(_a) {
        var name = _a.name, schema = _a.schema;
        this.data = {};
        this.data_count = 0;
        this.name = name;
        this.schema = schema;
    }
    Table.prototype.insert = function (record) {
        if (!this.schema.validate(record)) {
            throw new Error("Record inserted into table \"".concat(this.name, "\" did not match schema."));
        }
        //Add any defaults necessary
        for (var _i = 0, _a = this.schema.rows; _i < _a.length; _i++) {
            var row = _a[_i];
            if (record[row.name] == null)
                record[row.name] = row.default;
        }
        var unique = Schema.get_unique_key(record, this.schema);
        if (unique != null) {
            //Record already exists with that key
            if (this.data[String(unique)] != null) {
                throw new Error("Unique key \"".concat(unique, "\" has already been inserted."));
            }
        }
        for (var _b = 0, _c = this.schema.rows; _b < _c.length; _b++) {
            var row = _c[_b];
            if (typeof row.validation == "function") {
                if (!row.validation(record[row.name])) {
                    throw new Error("Custom validation function declared that column \"".concat(row.name, "\" was invalid (value was ").concat(value_to_string(record[row.name]), ")"));
                }
            }
        }
        this.data[unique == null ? this.data_count : String(unique)] = record;
        this.data_count += 1;
    };
    //Iterate through each row with a function
    //If the function returns false, we stop iterating through the list
    Table.prototype.each = function (func) {
        for (var key in this.data) {
            if (this.data[key] != null) {
                var should_continue = func(this.data[key], key);
                if (should_continue == false)
                    break;
            }
        }
    };
    //Iterate through each row with a function
    //If the function returns true, we delete it from the data
    Table.prototype.filter = function (func) {
        var unique = this.schema.unique_key != null;
        //If this table has a unique key, provide the key as a string, otherwise a number
        //If we don't have a unique key, we need to actually create a new object, because indices are based on their entry number.
        if (unique) {
            for (var key in this.data) {
                if (this.data[key] != null) {
                    if (!func(this.data[key], key))
                        this.data[key] = null;
                }
            }
        }
        else {
            var new_data = {};
            var num_entries = 0;
            for (var row = 0; row < this.data_count; row += 1) {
                if (func(this.data[row], row))
                    continue;
                new_data[num_entries] = this.data[row];
                num_entries += 1;
            }
            this.data = new_data;
            this.data_count = num_entries;
        }
    };
    return Table;
}());
var Database = /** @class */ (function () {
    function Database() {
        this.tables = {};
        this.create = this.create_table;
    }
    Database.prototype.get_table = function (table) {
        if (this.tables[table] == null) {
            throw new Error("Table \"".concat(table, "\" does not exist."));
        }
        return this.tables[table];
    };
    Database.prototype.create_table = function (name, schema) {
        var parsed_schema = schema instanceof Schema.Table
            ? schema
            : new Schema.Table({ rows: schema.rows });
        this.tables[name] = new Table({ name: name, schema: parsed_schema });
    };
    Database.prototype.insert_into_table = function (table, record) {
        table.insert(record);
    };
    Database.prototype.insert = function (table, record) {
        this.insert_into_table(this.get_table(table), record);
    };
    Database.prototype.select_from_table = function (table, condition) {
        //If no condition was proivded, literally just return every row
        if (condition == null) {
            var rows_2 = [];
            table.each(function (row) {
                rows_2.push(row);
            });
            return rows_2;
        }
        var rows = [];
        table.each(function (row) {
            //Should not continue to add rows
            if (rows.length >= condition.row_limit)
                return false;
            if (condition.validate(row))
                rows.push(row);
        });
        return rows;
    };
    Database.prototype.select = function (table, condition) {
        return this.select_from_table(this.get_table(table), condition == null
            ? null
            : condition instanceof QueryCondition
                ? condition
                : new QueryCondition(condition));
    };
    Database.prototype.select_count_from_table = function (table, condition) {
        //If condition is null, return the count of all the tables
        if (condition == null)
            return table.data_count;
        var count = 0;
        table.each(function (row) {
            if (condition.validate(row))
                count += 1;
        });
        return count;
    };
    Database.prototype.select_count = function (table, condition) {
        return this.select_count_from_table(this.get_table(table), condition == null
            ? null
            : condition instanceof QueryCondition
                ? condition
                : new QueryCondition(condition));
    };
    Database.prototype.delete_from_table = function (table, condition) {
        //If condition equals null, just delete every single record.
        //Otherwise, only delete records for which the condition returns true.
        table.filter(function (row) {
            if (condition == null)
                return true;
            return condition.validate(row);
        });
    };
    Database.prototype.delete = function (table_name, condition) {
        this.delete_from_table(this.get_table(table_name), condition == null
            ? null
            : condition instanceof QueryCondition
                ? condition
                : new QueryCondition(condition));
    };
    Database.prototype.update = function (table_name, update, condition) {
        var table = this.get_table(table_name);
        var parsed_condition = condition == null
            ? null
            : condition instanceof QueryCondition
                ? condition
                : new QueryCondition(condition);
        table.each(function (row) {
            //If condition is met, handle the update
            if (parsed_condition == null || parsed_condition.validate(row)) {
                update_row(update, row);
            }
        });
    };
    return Database;
}());
exports.Database = Database;
exports.INT = Schema.Datatype.INT;
exports.DOUBLE = Schema.Datatype.DOUBLE;
exports.STRING = Schema.Datatype.STRING;
exports.BOOLEAN = Schema.Datatype.BOOLEAN;
var db = new Database();
db.create_table("users", {
    rows: [
        { name: "username", type: exports.STRING, unique: true },
        { name: "age", type: exports.BOOLEAN },
    ],
});
db.insert("users", { age: false, username: "Kiyaan" });
db.insert("users", { age: true, username: "Hi!" });
console.log(db.select("users"));
console.log(db.update("users", { age: 2 }));
console.log(db.select("users"));
//# sourceMappingURL=db.js.map