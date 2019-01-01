"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var tf = __importStar(require("@tensorflow/tfjs"));
var BaseModel = /** @class */ (function () {
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
