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
        if (condition instanceof QueryCondition) {
            for (var _i = 0, _a = condition.conditions; _i < _a.length; _i++) {
                var subcondition = _a[_i];
                this.conditions.push(subcondition);
            }
        }
        else
            this.conditions.push(condition);
        return this;
    };
    QueryCondition.prototype.limit = function (limit) {
        this.row_limit = limit;
        return this;
    };
    QueryCondition.prototype.validate_against_condition = function (row, condition) {
        //If they provided a custom validation function and it returned false, also return false
        if (condition.$validation && !condition.$validation(row))
            return false;
        for (var name_1 in condition) {
            var value = row[name_1];
            var data = condition[name_1];
            //Make sure it's not a seperate value that doesn't describe the column, like $validation
            if (value == undefined)
                continue;
            //Is it a custom validation function?
            if (typeof data == "function")
                return data(value, name_1);
            //Is it just plain data?
            if (typeof data != "object")
                return value == data;
            if (data.neq && !(value !== data.neq))
                return false;
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
        if (condition.and) {
            return this.validate_against_condition(row, condition.and);
        }
        return true;
    };
    QueryCondition.prototype.validate = function (row) {
        if (this.conditions.length == 0)
            return this.validate_against_condition(row, this.conditions[0]);
        for (var _i = 0, _a = this.conditions; _i < _a.length; _i++) {
            var condition = _a[_i];
            if (!this.validate_against_condition(row, condition))
                return false;
        }
        return true;
    };
    return QueryCondition;
}());
exports.QueryCondition = QueryCondition;
//# sourceMappingURL=conditions.js.map