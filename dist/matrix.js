"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Matrix = /** @class */ (function () {
    function Matrix(data) {
        this.data = data;
        this.r = data.length;
        this.c = data[0].length;
        return this;
    }
    Matrix.prototype.clone = function () {
        return new Matrix(this.data.slice());
    };
    return Matrix;
}());
exports.Matrix = Matrix;
