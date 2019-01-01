"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaseModel = /** @class */ (function () {
    function BaseModel() {
    }
    BaseModel.prototype.predict = function (inputs) {
        throw new Error('Implement this predict function in sub class');
    };
    BaseModel.prototype.train = function () {
        throw new Error('Implement this train function in sub class');
    };
    return BaseModel;
}());
exports.BaseModel = BaseModel;
