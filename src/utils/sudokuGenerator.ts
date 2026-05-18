// Sudoku board generator using backtracking

type Board = number[][];

const isValid = (board: Board, row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
};

const solve = (board: Board): boolean => {
  let row = -1;
  let col = -1;
  let isEmpty = false;

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = true;
        break;
      }
    }
    if (isEmpty) break;
  }

  // No empty space left, solved
  if (!isEmpty) return true;

  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      if (solve(board)) return true;
      board[row][col] = 0; // Backtrack
    }
  }

  return false;
};

// Generates a fully populated valid Sudoku grid
const generateSolvedBoard = (): Board => {
  const board: Board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  // Fill diagonal 3x3 boxes first (independent)
  const fillBox = (row: number, col: number) => {
    const numList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle list
    for (let i = numList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numList[i], numList[j]] = [numList[j], numList[i]];
    }
    
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[row + i][col + j] = numList[idx++];
      }
    }
  };

  fillBox(0, 0);
  fillBox(3, 3);
  fillBox(6, 6);

  solve(board);
  return board;
};

// Mask cells based on difficulty
export const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard') => {
  const solved = generateSolvedBoard();
  const puzzle = solved.map(row => [...row]);

  // Difficulty counts (how many cells to empty)
  // Easy: 35 empty, Medium: 45 empty, Hard: 55 empty
  let emptyCellsCount = 35;
  if (difficulty === 'medium') emptyCellsCount = 45;
  if (difficulty === 'hard') emptyCellsCount = 55;

  let count = 0;
  while (count < emptyCellsCount) {
    const cellIdx = Math.floor(Math.random() * 81);
    const row = Math.floor(cellIdx / 9);
    const col = cellIdx % 9;

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      count++;
    }
  }

  return { solved, puzzle };
};
