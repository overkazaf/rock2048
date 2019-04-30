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
var tf = require("@tensorflow/tfjs");
var NNModel = (function (_super) {
    __extends(NNModel, _super);
    function NNModel(inputSize, hiddenSize, outputSize, // 标识最终输入的预测方向向量
        learningRate) {
        if (inputSize === void 0) { inputSize = 12; }
        if (hiddenSize === void 0) { hiddenSize = inputSize * 2; }
        if (outputSize === void 0) { outputSize = 4; }
        if (learningRate === void 0) { learningRate = 0.01; }
        var _this = _super.call(this) || this;
        _this.weights = [];
        _this.biases = [];
        _this.hiddenSize = hiddenSize;
        _this.inputSize = inputSize;
        _this.outputSize = outputSize;
        // Using ADAM optimizer, we can compare it with SDG, AdaGrad and also Momentum optimizer
        _this.optimizer = tf.train.adam(learningRate);
        _this.weights = [];
        _this.biases = [];
        return _this;
    }
    NNModel.prototype.init = function () {
        // for hidden layer
        console.log('this', this.inputSize, this.hiddenSize, this.outputSize);
        this.weights[0] = tf.variable(tf.randomNormal([this.inputSize, this.hiddenSize]));
        this.biases[0] = tf.variable(tf.scalar(Math.random()));
        // for output layer
        this.weights[1] = tf.variable(tf.randomNormal([this.hiddenSize, this.outputSize]));
        this.biases[1] = tf.variable(tf.scalar(Math.random()));
    };
    NNModel.prototype.calWeightedScore = function (inputs) {
        var empty = inputs[0], s = inputs[1], e2 = inputs[2];
        return empty.concat(s, e2);
        // return empty.map((e: number, index: number) => {
        //   if (e == -1) return 0;
        //   else {
        //     return e + s[index] * e2[index];
        //   }
        // });
    };
    // 返回一个promise对象
    NNModel.prototype.predict = function (inputs) {
        var _this = this;
        var x = tf.tensor([
            this.calWeightedScore(inputs)
        ]);
        var prediction = tf.tidy(function () {
            var hiddenLayer = tf.sigmoid(x.matMul(_this.weights[0]).add(_this.biases[0]));
            var outputLayer = tf.sigmoid(hiddenLayer.matMul(_this.weights[1]).add(_this.biases[1]));
            return outputLayer;
        });
        return prediction;
    };
    NNModel.prototype.fit = function (inputs, labels, trainingCount) {
        if (trainingCount === void 0) { trainingCount = 100; }
        for (var i = 0; i < trainingCount; i++) {
            this.train(inputs, labels);
        }
    };
    NNModel.prototype.train = function (inputs, labels) {
        var _this = this;
        this.optimizer.minimize(function () {
            var predictedYs = _this.predict(inputs);
            // 计算评价值，默认用均方差，值越小说明拟合效果越好
            return _this.loss(predictedYs, labels);
        });
    };
    return NNModel;
}(base_1.BaseModel));
exports.NNModel = NNModel;
