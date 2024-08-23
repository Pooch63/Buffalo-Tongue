"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCondition = void 0;
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
        //If they provided a custom validation function and it returned false, also return false
        if (condition.$validation && !condition.$validation(row))
            return false;
        for (var name_1 in condition) {
            //Make sure it's not a seperate value that doesn't describe the column, like $validation
            if (row[name_1] == undefined)
                continue;
            var value = row[name_1];
            var data = condition[name_1];
            //Is it a custom validation function?
            if (typeof data == "function")
                return data(value, name_1);
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
exports.QueryCondition = QueryCondition;
//# sourceMappingURL=conditions.js.map