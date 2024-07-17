"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.STRING = exports.DOUBLE = exports.INT = void 0;
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
    function is_string(value) {
        return typeof value == "string";
    }
    Validation.is_string = is_string;
})(Validation || (Validation = {}));
var Schema;
(function (Schema) {
    var Datatype;
    (function (Datatype) {
        Datatype["INT"] = "integer";
        Datatype["DOUBLE"] = "double";
        Datatype["STRING"] = "string";
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
                if (!Validation.is_string(value))
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
                if (!value) {
                    throw new Error("Unable to insert record -- row \"".concat(row.name, "\" was not included, and no default exists."));
                }
                if (!Schema.validate_type({ value: value, type: row.type })) {
                    throw new Error("Column \"".concat(row.name, "\" is not of valid type (valid type is of ").concat(row.type, ")"));
                }
            }
            return true;
        };
        return Table;
    }());
    Schema.Table = Table;
    function get_unique_key(record, schema) {
        if (schema.unique_key == null)
            return null;
        return record[schema.unique_key];
    }
    Schema.get_unique_key = get_unique_key;
})(Schema || (Schema = {}));
exports.INT = Schema.Datatype.INT;
exports.DOUBLE = Schema.Datatype.DOUBLE;
exports.STRING = Schema.Datatype.STRING;
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
            if (data.not_eq && !(value != data.not_eq))
                return false;
            if (data.eq && !(value == data.eq))
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
            if (this.validate_against_condition({ row: row, condition: condition }))
                return true;
        }
        return false;
    };
    return QueryCondition;
}());
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
        this.data[unique == null ? this.data_count : String(unique)] = record;
        this.data_count += 1;
    };
    //Iterate through each row with a function
    //If the function returns false, we stop iterating through the list
    Table.prototype.each = function (func) {
        for (var key in this.data) {
            var should_continue = func(this.data[key], key);
            if (should_continue == false)
                break;
        }
    };
    return Table;
}());
var Database = /** @class */ (function () {
    /**
     * @param path - The path to the file where we should retrieve the database. If not provided, DB is simply stored in memory
     */
    function Database(path) {
        this.tables = {};
    }
    Database.prototype.create_table = function (_a) {
        var name = _a.name, schema = _a.schema;
        var parsed_schema = schema instanceof Schema.Table
            ? schema
            : new Schema.Table({ rows: schema.rows });
        this.tables[name] = new Table({ name: name, schema: parsed_schema });
    };
    Database.prototype.insert_into_table = function (_a) {
        var table = _a.table, record = _a.record;
        table.insert(record);
    };
    Database.prototype.insert = function (_a) {
        var table = _a.table, record = _a.record;
        if (this.tables[table] == null) {
            throw new Error("Table \"".concat(table, "\" does not exist."));
        }
        this.insert_into_table({ table: this.tables[table], record: record });
    };
    Database.prototype.select_from_table = function (_a) {
        var table = _a.table, condition = _a.condition;
        //If no condition was proivded, literally just return every row
        if (condition == null) {
            var rows_2 = [];
            table.each(function (row) {
                rows_2.push(row);
            });
            return rows_2;
        }
        var rows = [];
        table.each(function (row, key) {
            //Should not continue to add rows
            if (rows.length >= condition.row_limit)
                return false;
            if (condition.validate(row))
                rows.push(row);
        });
        return rows;
    };
    Database.prototype.select = function (_a) {
        var table = _a.table, condition = _a.condition;
        if (this.tables[table] == null) {
            throw new Error("Table \"".concat(table, "\" does not exist."));
        }
        var parsed_condition = condition instanceof QueryCondition
            ? condition
            : new QueryCondition(condition);
        return this.select_from_table({
            table: this.tables[table],
            condition: parsed_condition,
        });
    };
    Database.prototype.select_count_from_table = function (_a) {
        var table = _a.table, condition = _a.condition;
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
    Database.prototype.select_count = function (_a) {
        var table = _a.table, condition = _a.condition;
        if (this.tables[table] == null) {
            throw new Error("Table \"".concat(table, "\" does not exist."));
        }
        var parsed_condition = condition instanceof QueryCondition
            ? condition
            : new QueryCondition(condition);
        return this.select_count_from_table({
            table: this.tables[table],
            condition: parsed_condition,
        });
    };
    Database.prototype.table = function (name) {
        return this.tables[name];
    };
    return Database;
}());
exports.Database = Database;
var db = new Database();
db.create_table({
    name: "products",
    schema: {
        rows: [
            //Note that we aren't specifying unique: false here. Rows default to not being unique
            { name: "name", type: exports.STRING },
            { name: "cost", type: exports.DOUBLE, default: 5.0 },
        ],
    },
});
db.insert({ table: "products", record: { name: "shoes", cost: 100 } });
db.insert({ table: "products", record: { name: "gloves" } });
console.log(db.select({
    table: "products",
}));
