function rotateClockwise(matrix: number[][], rotateTimes: number = 1) {
  let modedRotateTimes = rotateTimes % 4;
  const r = matrix.length;
  const c = matrix[0].length;

  while (modedRotateTimes--) {
    for (let i: number = 0, len = r; i < ~~(r/2); i++, len -= 2) {
      for (let j: number = i; j < c-i-1; j++) {
        let t: number = matrix[i][j];
        matrix[i][j] = matrix[i+len-1 - (j-i)][i];
        matrix[i+len-1 - (j-i)][i] = matrix[i+len-1][i+len-1 - (j-i)];
        matrix[i+len-1][i+len-1 - (j-i)] = matrix[j][i+len-1];
        matrix[j][i+len-1] = t;
      }
    }
  }
  return matrix;
}

function shiftRight(matrix: number[][]): number[][] {

  const r = matrix.length;
  const c = matrix[0].length;

  for (let i: number = 0; i < r; i++) {
    const row = [];
    for (let j: number = 0; j < c; j++) {
      if (matrix[i][j] === 0) {
        row.unshift(0);
      } else {
        row.push(matrix[i][j]);
      }
    }
    matrix[i] = row;
  }
  return matrix;
}

function accumulateRight(matrix: number[][]): number[][] {
  const r = matrix.length;
  const c = matrix[0].length;
  for (let i: number = 0; i < r; i++) {
    for (let j: number = c - 1; j > 0; j--) {
      if (matrix[i][j] === 0 && matrix[i][j - 1] >0 ) {
        matrix[i][j] = data[i][j-1];
        matrix[i][j - 1] = 0;
      } else if (matrix[i][j] !== 0 && matrix[i][j] === matrix[i][j - 1]) {
        matrix[i][j] *= 2;
        // this.score += data[i][j];
        matrix[i][j - 1] = 0;
      }
    }
  }
  return matrix;
}

const data: number[][] = [
  [0, 0, 0, 0,],
  [0, 0, 0, 0,],
  [0, 0, 0, 2,],
  [0, 0, 0, 4,],
];

console.table(
  data,
);

const rdata = rotateClockwise(data);
console.table(
  rdata,
);

const sdata = shiftRight(rdata);
console.table(
  sdata,
);

const adata = accumulateRight(sdata);
console.table(
  adata,
);


const recover_data = rotateClockwise(adata, 3);
console.table(
  recover_data,
);