"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = void 0;
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
})(Validation || (exports.Validation = Validation = {}));
//# sourceMappingURL=type_validation.js.map