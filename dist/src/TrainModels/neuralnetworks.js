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
    function NNModel(inputSize, hiddenLayerSize, outputSize, learningRate) {
        if (inputSize === void 0) { inputSize = 4; }
        if (hiddenLayerSize === void 0) { hiddenLayerSize = inputSize * 2; }
        if (outputSize === void 0) { outputSize = 2; }
        if (learningRate === void 0) { learningRate = 0.1; }
        var _this = _super.call(this) || this;
        _this.weights = [];
        _this.biases = [];
        _this.hiddenLayerSize = hiddenLayerSize;
        _this.inputSize = inputSize;
        _this.outputSize = outputSize;
        // Using ADAM optimizer
        _this.optimizer = tf.train.adam(learningRate);
        _this.weights = [];
        _this.biases = [];
        return _this;
    }
    NNModel.prototype.init = function () {
        // Hidden layer
        this.weights[0] = tf.variable(tf.randomNormal([this.inputSize, this.hiddenLayerSize]));
        this.biases[0] = tf.variable(tf.scalar(Math.random()));
        // Output layer
        this.weights[1] = tf.variable(tf.randomNormal([this.hiddenLayerSize, this.outputSize]));
        this.biases[1] = tf.variable(tf.scalar(Math.random()));
    };
    // 返回一个promise对象
    NNModel.prototype.predict = function (inputs) {
        var _this = this;
        var x = tf.tensor(inputs);
        var prediction = tf.tidy(function () {
            // 2*4 * 4*8 = 2*8
            // 2*8 * 8*2 = 2*2
            var hiddenLayer = tf.sigmoid(x.matMul(_this.weights[0]).add(_this.biases[0]));
            var outputLayer = tf.sigmoid(hiddenLayer.matMul(_this.weights[1]).add(_this.biases[1]));
            return outputLayer;
        });
        return prediction;
    };
    NNModel.prototype.fit = function (inputs, labels, trainningCount) {
        if (trainningCount === void 0) { trainningCount = 100; }
        for (var i = 0; i < trainningCount; i++) {
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
