"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = require("./base");
var direction_1 = require("../enums/direction");
var tf = require("@tensorflow/tfjs");
var RandomModel = (function (_super) {
    __extends(RandomModel, _super);
    function RandomModel() {
        var _this = _super.call(this) || this;
        _this.weights = [];
        _this.biases = [];
        _this.trainLossList = [];
        _this.optimizer = tf.train.adam(0.01);
        return _this;
    }
    RandomModel.prototype.init = function () {
        this.randomize();
    };
    RandomModel.prototype.predict = function (inputs) {
        var _this = this;
        var directions = [
            direction_1.DIRECTION.UP,
            direction_1.DIRECTION.DOWN,
            direction_1.DIRECTION.LEFT,
            direction_1.DIRECTION.RIGHT,
        ];
        // 计算出各个方向加权后的值
        var ys = directions.map(function (dir) {
            return (_this.weights[0] * inputs[0][dir] +
                _this.weights[1] * inputs[1][dir] +
                _this.weights[2] * inputs[2][dir] +
                _this.biases[0]);
        });
        var sum = ys.reduce(function (prev, curr) {
            return prev + curr;
        }, 0.0);
        // 可当作是规范化后的概率，类似于softmax，但softmax求的是指数加权平均数
        var found = false;
        var yss = ys.map(function (y) { return y / sum; });
        var maxYss = Math.max.apply(null, yss);
        var normalizedYs = yss.map(function (y) {
            return y === maxYss && !found ? (found = true, 1) : 0;
        });
        return normalizedYs;
    };
    RandomModel.prototype.train = function (inputs, labels) {
        var _this = this;
        // 根据inputs和labels进行weights和biases的参数调整，在随机算法中，我们直接把参数给随机好了。。
        this.optimizer.minimize(function () {
            var predictedYs = _this.predict(inputs);
            // 评价训练结果，以损失函数的值作为依据，损失函数默认用均方差，值越小说明拟合效果越好
            var loss = _this.loss(predictedYs, labels);
            _this.trainLossList.push(loss);
            return loss;
        });
    };
    // 计算损失，默认采用均方误差
    RandomModel.prototype.loss = function (a, b) {
        var error = 0;
        if (a.length !== b.length) {
            throw new Error('Invaild inputs while calling loss function');
        }
        for (var i = 0; i < a.length; i++) {
            error += 0.5 * Math.pow((a[i] - b[i]), 2);
        }
        return error;
    };
    RandomModel.prototype.randomize = function () {
        // 随机生成所有模型参数
        // 在预测下一次移动过程中，哪个方向的可能性最大，我们假设因素为几个：
        // 1. 下一个状态中剩余的空余格子数
        // 2. 当前移动所增加的分值
        // 3. 下一个状态中，"2"存在的个数（原因是2越多，下一次合并的可能性越大，也可以优化为连续数值相同的个数）
        // 直觉上来说
        // 2的权重要更多些，因为我们目的就是获得更高的分数(如果玩的是分数不限上限的版本)；
        // 1次之，因为空余格子数越多，我们可以合并的可能性越大，“救场”的可能性也越大；
        // 3的话其实应该参考价值不大，但若是“连续数值多的”状态，应该给予的评估分值应该更高，且当连续数值个相同时，数值大的分值也应更高
        this.weights[0] = Math.random();
        this.weights[1] = Math.random();
        this.weights[2] = Math.random();
        this.biases[0] = Math.random();
        //   [ 0.27232146199689433, 0.36707472624776893, 0.4951921221362434 ],
        // [ 0.20254456615531224 ]
        // this.weights[0] = 0.27232146199689433; 
        // this.weights[1] = 0.36707472624776893;
        // this.weights[2] = 0.4951921221362434;
        // this.biases[0] = 0.20254456615531224;
    };
    // 训练模型，以获得更好的参数。 
    RandomModel.prototype.fit = function (inputs, labels, trainningCount) {
        if (trainningCount === void 0) { trainningCount = 100; }
        for (var i = 0; i < trainningCount; i++) {
            this.train(inputs, labels);
        }
    };
    return RandomModel;
}(base_1.BaseModel));
exports.RandomModel = RandomModel;
