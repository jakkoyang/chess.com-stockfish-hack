function chessDotComToFEN(boardHTML) {
    const board = Array(8).fill().map(() => Array(8).fill(''));
    const pieceElements = boardHTML.match(/class="piece [wb][prnbqk] square-\d{2}"/g);
    
    if (!pieceElements) {
        throw new Error("No pieces found in HTML");
    }
    
    pieceElements.forEach(element => {
        const [, color, pieceType, square] = element.match(/class="piece ([wb])([prnbqk]) square-(\d{2})"/);
        const file = parseInt(square[0]) - 1;
        const rank = 8 - parseInt(square[1]);
        const fenPiece = color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase();
        board[rank][file] = fenPiece;
    });
    
    let fen = '';
    let emptyCount = 0;
    
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            if (board[rank][file] === '') {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                fen += board[rank][file];
            }
        }
        
        if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
        }
        
        if (rank < 7) {
            fen += '/';
        }
    }
    
    blackFen = fen + ' b KQkq - 0 1';
    whiteFen = fen + ' w KQkq - 0 1';
    return [whiteFen, blackFen];
}

async function analyzeChessPosition(fen, depth) {
    if (!fen || typeof fen !== 'string') {
        throw new Error('FEN string is required');
    }
    
    if (!depth || typeof depth !== 'number' || depth > 15 || depth < 1) {
        throw new Error('Depth must be a number between 1 and 15');
    }

    try {
        const encodedFen = encodeURIComponent(fen);
        const url = `https://stockfish.online/api/s/v2.php?fen=${encodedFen}&depth=${depth}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            throw new Error(`Analysis failed: ${data.value}`);
        }

        return {
            bestMove: data.bestmove,
            evaluation: {
                score: data.evaluation,
                isMate: data.mate,
            }
        };
    } catch (error) {
        console.error('Error analyzing position:', error);
        throw error;
    }
}

async function example(wfen, bfen) {
    try {
        const startingPosition = wfen;
        console.log(startingPosition);
        const result = await analyzeChessPosition(startingPosition, 14);
        resultParagraph.innerHTML = "W: " + result.bestMove;

        const startingPosition2 = bfen;
        const result2 = await analyzeChessPosition(startingPosition2, 14);
        resultParagraph.innerHTML += "<br>B: " + result2.bestMove;

        console.log('Best move:', result.bestMove);
        console.log('Evaluation:', result.evaluation.score);
    } catch (error) {
        console.error('Analysis failed:', error);
        resultParagraph.innerHTML = "Error";
    }
}

const resultParagraph = document.createElement('span');
const button = document.createElement('button');
button.textContent = 'Analyze';
button.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 9999;
    padding: 2px 5px;
    background-color: #2f2f2f;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: none;
`;

resultParagraph.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    z-index: 9999;
    padding: 2px 5px;
    background-color: #2f2f2f;
    color: red;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-size: 15px !important;
    opacity: 0.5;
`;

button.addEventListener('click', async () => {
    try {
        const boardHTML = document.querySelector('.board-layout-chessboard').innerHTML;
        const fens = chessDotComToFEN(boardHTML);
        const wFen = fens[0];
        const bFen = fens[1];
        example(wFen, bFen);
        //await navigator.clipboard.writeText(fen);
        const originalText = button.textContent;
        button.textContent = 'Analyzing';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '#2f2f2f';
        }, 2000);
    } catch (error) {
        console.error('Error copying FEN:', error);
        button.textContent = 'Error!';
        button.style.backgroundColor = '#f44336';
        
        setTimeout(() => {
            button.textContent = 'Copy FEN';
            button.style.backgroundColor = '#2f2f2f';
        }, 2000);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'z' || event.key === 'Z') {
        button.click();
    } else if (event.key === 'a' || event.key === 'A') {
        const isVisible = resultParagraph.style.display !== 'none';
        //button.style.display = isVisible ? 'none' : 'block';
        resultParagraph.style.display = isVisible ? 'none' : 'block';
    }
});

document.body.appendChild(button);
document.body.appendChild(resultParagraph);