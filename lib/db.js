"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOLEAN = exports.STRING = exports.DOUBLE = exports.INT = exports.Database = void 0;
var conditions_1 = require("./conditions");
var logs_1 = require("./logs");
var schema_validation_1 = require("./schema_validation");
var Errors;
(function (Errors) {
    var Nonexistent_Value = /** @class */ (function (_super) {
        __extends(Nonexistent_Value, _super);
        function Nonexistent_Value() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Nonexistent_Value;
    }(Error));
    Errors.Nonexistent_Value = Nonexistent_Value;
    var Bad_Type = /** @class */ (function (_super) {
        __extends(Bad_Type, _super);
        function Bad_Type() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Bad_Type;
    }(Error));
    Errors.Bad_Type = Bad_Type;
    var Nonexistent_Column = /** @class */ (function (_super) {
        __extends(Nonexistent_Column, _super);
        function Nonexistent_Column() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Nonexistent_Column;
    }(Error));
    Errors.Nonexistent_Column = Nonexistent_Column;
    var Name_Already_Exists = /** @class */ (function (_super) {
        __extends(Name_Already_Exists, _super);
        function Name_Already_Exists() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Name_Already_Exists;
    }(Error));
    Errors.Name_Already_Exists = Name_Already_Exists;
    var Not_Enough_Info = /** @class */ (function (_super) {
        __extends(Not_Enough_Info, _super);
        function Not_Enough_Info() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Not_Enough_Info;
    }(Error));
    Errors.Not_Enough_Info = Not_Enough_Info;
})(Errors || (Errors = {}));
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
        var unique = schema_validation_1.Schema.get_unique_key(record, this.schema);
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
                    throw new Error("Custom validation function declared that column \"".concat(row.name, "\" was invalid (value was ").concat((0, logs_1.value_to_string)(record[row.name]), ")"));
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
function update_row(update, row) {
    for (var col in row) {
        var value = update[col];
        if (value != null)
            row[col] = value;
    }
}
var Database = /** @class */ (function () {
    function Database() {
        this.tables = {};
    }
    Database.prototype.get_table = function (table) {
        if (this.tables[table] == null) {
            throw new Errors.Nonexistent_Value("Table \"".concat(table, "\" does not exist."));
        }
        return this.tables[table];
    };
    Database.prototype.create_table = function (name, schema) {
        //Does the table already exist?
        if (this.tables[name] != null) {
            throw new Errors.Name_Already_Exists("Table name \"".concat(name, "\" already exists."));
        }
        var parsed_schema = new schema_validation_1.Schema.Table({ rows: schema.rows });
        this.tables[name] = new Table({ name: name, schema: parsed_schema });
    };
    //Create table alias
    Database.prototype.create = function (name, schema) {
        return this.create_table(name, schema);
    };
    Database.prototype.insert_into_table = function (table, record) {
        table.insert(record);
    };
    Database.prototype.insert = function (table) {
        var records = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            records[_i - 1] = arguments[_i];
        }
        var obj = this.get_table(table);
        for (var _a = 0, records_1 = records; _a < records_1.length; _a++) {
            var record = records_1[_a];
            this.insert_into_table(obj, record);
        }
    };
    Database.prototype.select_from_table = function (table, condition) {
        //If no condition was proivded, literally just return every row
        if (condition == null) {
            var rows_1 = [];
            table.each(function (row) {
                rows_1.push(row);
            });
            return rows_1;
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
            : condition instanceof conditions_1.QueryCondition
                ? condition
                : new conditions_1.QueryCondition(condition));
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
            : condition instanceof conditions_1.QueryCondition
                ? condition
                : new conditions_1.QueryCondition(condition));
    };
    //Select count alias
    Database.prototype.count = function (table, condition) {
        return this.select_count(table, condition);
    };
    Database.prototype.select_distinct = function (table_name, columns, condition) {
        var col_arr = typeof columns == "string" ? [columns] : columns;
        var table = this.get_table(table_name);
        //Make sure every column actually exists
        for (var _i = 0, col_arr_1 = col_arr; _i < col_arr_1.length; _i++) {
            var col = col_arr_1[_i];
            if (!table.schema.col_exists(col)) {
                throw new Errors.Nonexistent_Column("Select distinct requested distinct, nonexistent column \"".concat(col, "\""));
            }
        }
        var parsed_condition = condition == null
            ? null
            : condition instanceof conditions_1.QueryCondition
                ? condition
                : new conditions_1.QueryCondition(condition);
        var distinct = {};
        for (var _a = 0, _b = table.schema.rows; _a < _b.length; _a++) {
            var col = _b[_a];
            distinct[col.name] = {};
        }
        var rows = [];
        table.each(function (row, key) {
            if (condition && !parsed_condition.validate(row))
                return;
            //Have we already found a row with a distinct column with the same value as this one?
            for (var _i = 0, col_arr_2 = col_arr; _i < col_arr_2.length; _i++) {
                var col = col_arr_2[_i];
                if (distinct[col][row[col].toString()] != null)
                    return;
                distinct[col][row[col].toString()] = row;
            }
            rows.push(row);
        });
        return rows;
    };
    //Select distinct alias
    Database.prototype.distinct = function (table_name, columns, condition) {
        return this.select_distinct(table_name, columns, condition);
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
            : condition instanceof conditions_1.QueryCondition
                ? condition
                : new conditions_1.QueryCondition(condition));
    };
    Database.prototype.update = function (table_name, update, condition) {
        var table = this.get_table(table_name);
        var parsed_condition = condition == null
            ? null
            : condition instanceof conditions_1.QueryCondition
                ? condition
                : new conditions_1.QueryCondition(condition);
        //Validate that every type in the update object matches the column type
        for (var _i = 0, _a = table.schema.rows; _i < _a.length; _i++) {
            var col = _a[_i];
            if (update[col.name] != null &&
                !schema_validation_1.Schema.validate_type({ value: update[col.name], type: col.type })) {
                throw new Errors.Bad_Type("Invalid value provided for column in update statement -- \"".concat(col.name, "\" is not of valid type (valid type is of ").concat((0, logs_1.value_type_as_string)(col.type), ", instead got value ").concat((0, logs_1.value_to_string)(update[col.name]), " as ").concat((0, logs_1.value_type_as_string)(update[col.name]), ")"));
            }
        }
        table.each(function (row) {
            //If condition is met, handle the update
            if (parsed_condition == null || parsed_condition.validate(row)) {
                update_row(update, row);
            }
        });
    };
    Database.prototype.drop_table = function (table) {
        //Just make sure that it's a valid table
        this.get_table(table);
        delete this.tables[table];
    };
    //Drop table alias
    Database.prototype.drop = function (table) {
        return this.drop_table(table);
    };
    return Database;
}());
exports.Database = Database;
exports.INT = schema_validation_1.Schema.Datatype.INT;
exports.DOUBLE = schema_validation_1.Schema.Datatype.DOUBLE;
exports.STRING = schema_validation_1.Schema.Datatype.STRING;
exports.BOOLEAN = schema_validation_1.Schema.Datatype.BOOLEAN;
var db = new Database();
db.create_table("users", {
    rows: [
        { name: "username", type: exports.STRING },
        { name: "age", type: exports.INT },
    ],
});
db.insert("users", { age: 1, username: "Kiyaan" }, { age: 2, username: "Hi!" });
// db.insert("users", { age: 2, username: "Hi!" });
db.insert("users", { age: 3, username: "Kiyaan" });
console.log(db.count("users", {
    // age: (data: RowData) => data != 3,
    $validation: function (row) { return row.username == "Hi!"; },
}));
// console.log(db.update("users", { age: 2 }, { username: "yo" }));
console.log(db.select_distinct("users", ["username"]));
console.log(db.select("users"));
//# sourceMappingURL=db.js.map