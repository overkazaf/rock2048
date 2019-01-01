"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = require("./base");
var RandomTrainModel = /** @class */ (function (_super) {
    __extends(RandomTrainModel, _super);
    function RandomTrainModel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.weights = [];
        _this.biases = [];
        return _this;
    }
    RandomTrainModel.prototype.predict = function (inputs) {
        return [
            0.02,
            0.32,
            0.03,
            0.58,
        ];
    };
    return RandomTrainModel;
}(base_1.BaseTrainModel));
exports.RandomTrainModel = RandomTrainModel;
