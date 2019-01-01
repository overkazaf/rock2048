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
var RandomModel = /** @class */ (function (_super) {
    __extends(RandomModel, _super);
    function RandomModel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.weights = [];
        _this.biases = [];
        return _this;
    }
    RandomModel.prototype.predict = function (inputs) {
        return [
            0.02,
            0.32,
            0.03,
            0.58,
        ];
    };
    return RandomModel;
}(base_1.BaseModel));
exports.RandomModel = RandomModel;
