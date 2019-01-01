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
var direction_1 = require("../enums/direction");
var RandomTrainModel = /** @class */ (function (_super) {
    __extends(RandomTrainModel, _super);
    function RandomTrainModel() {
        var _this = _super.call(this) || this;
        _this.weights = [];
        _this.biases = [];
        _this.randomize();
        return _this;
    }
    RandomTrainModel.prototype.predict = function (inputs) {
        var _this = this;
        var directions = [
            direction_1.DIRATION.UP,
            direction_1.DIRATION.DOWN,
            direction_1.DIRATION.LEFT,
            direction_1.DIRATION.RIGHT,
        ];
        var ys = directions.map(function (dir) {
            return _this.weights[0] * inputs[0][dir] +
                _this.weights[1] * inputs[1][dir] +
                _this.weights[2] * inputs[2][dir] +
                _this.biases[0];
        });
        var sum = ys.reduce(function (prev, curr) {
            return prev + curr;
        }, 0.0);
        var normalizedYs = ys.map(function (y) { return y / sum; });
        return normalizedYs;
    };
    RandomTrainModel.prototype.train = function (inputs, labels) {
        // 根据inputs和labels进行weights和biases的参数调整，在随机算法中，我们直接把参数给随机好了。。
        this.randomize();
    };
    RandomTrainModel.prototype.randomize = function () {
        // 随机生成所有模型参数
        // 在预测下一次移动过程中，哪个方向的可能性最大，我们假设因素为几个：
        // 1. 下一个状态中剩余的空余格子数
        // 2. 当前移动所增加的分值
        // 3. 下一个状态中，"2"存在的个数（原因是2越多，下一次合并的可能性越大，也可以优化为连续数值相同的个数）
        // 直觉上来说
        // 2的权重要更多些，因为我们目的就是获得更高的分数；
        // 1次之，因为空余格子数越多，我们可以合并的可能越高，“救场”的可能性也越大；
        // 3的话其实应该参考价值不大，但若是“连续数值多的”状态，应该给于的评估分值应该更高，这个倒是可以作为参考依据
        this.weights[0] = 5;
        this.weights[1] = 10;
        this.weights[2] = 1;
        // this.weights[3] = 10;
        this.biases[0] = Math.random();
    };
    return RandomTrainModel;
}(base_1.BaseTrainModel));
exports.RandomTrainModel = RandomTrainModel;
