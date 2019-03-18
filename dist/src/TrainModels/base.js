"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tf = require("@tensorflow/tfjs");
var BaseModel = (function () {
    function BaseModel() {
    }
    BaseModel.prototype.predict = function (inputs) {
        throw new Error('Implement this predict function in sub class');
    };
    BaseModel.prototype.train = function (inputs, labels) {
        throw new Error('Implement this train function in sub class');
    };
    BaseModel.prototype.loss = function (predictedYs, labels) {
        var meanSquareError = predictedYs
            .sub(tf.tensor(labels))
            .square()
            .mean();
        return meanSquareError;
    };
    return BaseModel;
}());
exports.BaseModel = BaseModel;
