"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaseTrainModel = /** @class */ (function () {
    function BaseTrainModel() {
    }
    BaseTrainModel.prototype.predict = function (inputs) {
        throw new Error('Implement this predict function in sub class');
    };
    BaseTrainModel.prototype.train = function () {
        throw new Error('Implement this train function in sub class');
    };
    return BaseTrainModel;
}());
exports.BaseTrainModel = BaseTrainModel;
