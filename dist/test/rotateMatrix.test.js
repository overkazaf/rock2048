"use strict";
function rotateClockwise(matrix, rotateTimes) {
    if (rotateTimes === void 0) { rotateTimes = 1; }
    var modedRotateTimes = rotateTimes % 4;
    var r = matrix.length;
    var c = matrix[0].length;
    while (modedRotateTimes--) {
        for (var i = 0, len = r; i < ~~(r / 2); i++, len -= 2) {
            for (var j = i; j < c - i - 1; j++) {
                var t = matrix[i][j];
                matrix[i][j] = matrix[i + len - 1 - (j - i)][i];
                matrix[i + len - 1 - (j - i)][i] = matrix[i + len - 1][i + len - 1 - (j - i)];
                matrix[i + len - 1][i + len - 1 - (j - i)] = matrix[j][i + len - 1];
                matrix[j][i + len - 1] = t;
            }
        }
    }
    return matrix;
}
function shiftRight(matrix) {
    var r = matrix.length;
    var c = matrix[0].length;
    for (var i = 0; i < r; i++) {
        var row = [];
        for (var j = 0; j < c; j++) {
            if (matrix[i][j] === 0) {
                row.unshift(0);
            }
            else {
                row.push(matrix[i][j]);
            }
        }
        matrix[i] = row;
    }
    return matrix;
}
function accumulateRight(matrix) {
    var r = matrix.length;
    var c = matrix[0].length;
    for (var i = 0; i < r; i++) {
        for (var j = c - 1; j > 0; j--) {
            if (matrix[i][j] === 0 && matrix[i][j - 1] > 0) {
                matrix[i][j] = data[i][j - 1];
                matrix[i][j - 1] = 0;
            }
            else if (matrix[i][j] !== 0 && matrix[i][j] === matrix[i][j - 1]) {
                matrix[i][j] *= 2;
                // this.score += data[i][j];
                matrix[i][j - 1] = 0;
            }
        }
    }
    return matrix;
}
var data = [
    [0, 0, 0, 0,],
    [0, 0, 0, 0,],
    [0, 0, 0, 2,],
    [0, 0, 0, 4,],
];
console.table(data);
var rdata = rotateClockwise(data);
console.table(rdata);
var sdata = shiftRight(rdata);
console.table(sdata);
var adata = accumulateRight(sdata);
console.table(adata);
var recover_data = rotateClockwise(adata, 3);
console.table(recover_data);
