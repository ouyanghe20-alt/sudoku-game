class SudokuGame {
    constructor() {
        this.board = [];
        this.solution = [];
        this.userBoard = [];
        this.selectedCell = null;
        this.startTime = null;
        this.timerInterval = null;
        this.gameActive = true;
        this.emptyCount = 0;

        this.difficultyLevels = {
            easy: 40,
            medium: 50,
            hard: 60
        };

        this.initElements();
        this.attachEventListeners();
        this.newGame();
    }

    initElements() {
        this.gridElement = document.getElementById('sudoku-grid');
        this.timerElement = document.getElementById('timer');
        this.messageElement = document.getElementById('message');
        this.statsElement = document.getElementById('stats');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.checkBtn = document.getElementById('checkBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalBtn = document.getElementById('modal-btn');
    }

    attachEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.checkBtn.addEventListener('click', () => this.checkAnswer());
        this.resetBtn.addEventListener('click', () => this.resetBoard());
        this.hintBtn.addEventListener('click', () => this.provideHint());
        this.modalBtn.addEventListener('click', () => this.closeModal());
    }

    generateBoard() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard();
        this.solution = this.board.map(row => [...row]);
    }

    fillBoard() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (let num of numbers) {
                        if (this.isValid(this.board, row, col, num)) {
                            this.board[row][col] = num;
                            if (this.fillBoard()) {
                                return true;
                            }
                            this.board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(board, row, col, num) {
        // 检查行
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }

        // 检查列
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }

        // 检查 3x3 方格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }

        return true;
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    createPuzzle(emptyCount) {
        let removed = 0;
        while (removed < emptyCount) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
        this.emptyCount = emptyCount;
    }

    newGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const difficulty = this.difficultySelect.value;
        const emptyCount = this.difficultyLevels[difficulty];

        this.generateBoard();
        this.createPuzzle(emptyCount);
        this.userBoard = this.board.map(row => [...row]);
        this.selectedCell = null;
        this.gameActive = true;
        this.startTime = Date.now();
        this.messageElement.textContent = '';
        this.messageElement.className = '';

        this.renderBoard();
        this.startTimer();
    }

    renderBoard() {
        this.gridElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                const value = this.userBoard[row][col];

                if (this.solution[row][col] !== 0 && value === 0) {
                    // 这是一个空的初始位置
                } else if (this.board[row][col] !== 0 && this.userBoard[row][col] === this.board[row][col]) {
                    // 这是一个固定的初始数字
                    cell.classList.add('fixed');
                    cell.textContent = value;
                } else if (value !== 0) {
                    cell.classList.add('editable');
                    cell.textContent = value;
                }

                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.selectCell(row, col, cell));

                this.gridElement.appendChild(cell);
            }
        }

        this.updateStats();
    }

    selectCell(row, col, cellElement) {
        if (!this.gameActive) return;

        // 如果点击的是固定的初始数字，不选中
        if (this.solution[row][col] !== 0 && this.board[row][col] !== 0 && this.userBoard[row][col] === this.board[row][col]) {
            return;
        }

        // 移除之前选中的样式
        document.querySelectorAll('.sudoku-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });

        cellElement.classList.add('selected');
        this.selectedCell = { row, col, element: cellElement };

        // 允许直接输入数字
        this.handleKeyboard();
    }

    handleKeyboard() {
        const handleKeyPress = (e) => {
            if (!this.selectedCell || !this.gameActive) return;

            const row = this.selectedCell.row;
            const col = this.selectedCell.col;

            // 只允许编辑原始为空的单元格
            if (this.solution[row][col] !== 0 && this.board[row][col] !== 0) {
                return;
            }

            if (e.key >= '1' && e.key <= '9') {
                this.userBoard[row][col] = parseInt(e.key);
                this.renderBoard();
                // 重新选中当前单元格
                if (this.selectedCell) {
                    const nextCol = col + 1;
                    if (nextCol < 9) {
                        this.selectCell(row, nextCol, document.querySelector(`[data-row="${row}"][data-col="${nextCol}"]`));
                    }
                }
            } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
                this.userBoard[row][col] = 0;
                this.renderBoard();
                if (this.selectedCell) {
                    this.selectCell(row, col, document.querySelector(`[data-row="${row}"][data-col="${col}"]`));
                }
            }

            document.removeEventListener('keydown', handleKeyPress);
        };

        document.addEventListener('keydown', handleKeyPress, { once: true });
    }

    checkAnswer() {
        if (!this.gameActive) {
            this.showModal('提示', '游戏已结束');
            return;
        }

        let isCorrect = true;
        let invalidCells = [];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userBoard[row][col] === 0) {
                    isCorrect = false;
                } else if (this.userBoard[row][col] !== this.solution[row][col]) {
                    isCorrect = false;
                    invalidCells.push({ row, col });
                }
            }
        }

        if (isCorrect) {
            this.gameActive = false;
            this.showCompletion();
        } else {
            // 标记错误的单元格
            invalidCells.forEach(({ row, col }) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('invalid');
                }
            });

            this.messageElement.textContent = '⚠️ 有些答案不对，请继续努力！';
            this.messageElement.className = 'error';

            setTimeout(() => {
                document.querySelectorAll('.sudoku-cell.invalid').forEach(cell => {
                    cell.classList.remove('invalid');
                });
            }, 2000);
        }
    }

    resetBoard() {
        if (!this.gameActive) {
            this.showModal('提示', '游戏已结束，请开始新游戏');
            return;
        }

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    this.userBoard[row][col] = 0;
                }
            }
        }

        this.messageElement.textContent = '✨ 棋盘已重置';
        this.messageElement.className = 'info';
        this.renderBoard();

        setTimeout(() => {
            this.messageElement.textContent = '';
            this.messageElement.className = '';
        }, 2000);
    }

    provideHint() {
        if (!this.gameActive) {
            this.showModal('提示', '游戏已结束');
            return;
        }

        // 找到一个为空且有解的单元格
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userBoard[row][col] === 0 && this.solution[row][col] !== 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) {
            this.messageElement.textContent = '✨ 没有更多提示了！';
            this.messageElement.className = 'info';
            return;
        }

        const hint = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.userBoard[hint.row][hint.col] = this.solution[hint.row][hint.col];

        const cell = document.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
        if (cell) {
            cell.classList.add('hint');
            setTimeout(() => {
                cell.classList.remove('hint');
            }, 2000);
        }

        this.renderBoard();
        this.messageElement.textContent = '💡 已给出提示';
        this.messageElement.className = 'info';

        setTimeout(() => {
            this.messageElement.textContent = '';
            this.messageElement.className = '';
        }, 2000);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;

            this.timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    updateStats() {
        const filled = this.userBoard.flat().filter(num => num !== 0).length;
        const remaining = this.emptyCount - filled;
        this.statsElement.textContent = `已填充: ${filled} / ${this.emptyCount} | 剩余: ${remaining}`;
    }

    showCompletion() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        this.messageElement.textContent = '🎉 恭喜！你已完成数独！';
        this.messageElement.className = 'success';

        this.showModal(
            '🎊 成功完成！',
            `用时: ${timeStr}\n\n做得好！`
        );
    }

    showModal(title, message) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});