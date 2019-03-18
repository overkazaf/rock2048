"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Matrix = (function () {
    function Matrix(data) {
        this.data = data;
        this.r = data.length;
        this.c = data[0].length;
        return this;
    }
    Matrix.prototype.clone = function () {
        var newData = [];
        this.data.forEach(function (r, i) {
            newData[i] = [];
            r.forEach(function (c, j) {
                newData[i][j] = c;
            });
        });
        return new Matrix(newData);
    };
    return Matrix;
}());
exports.Matrix = Matrix;
