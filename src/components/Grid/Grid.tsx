"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";

interface Cell {
  row: number;
  col: number;
}

interface FoundWord {
  word: string;
  cells: Cell[];
}

interface GridProps {
  gridData: string[][];
  targetWords: string[];
  title?: string;
}

export const Grid: React.FC<GridProps> = ({ gridData, targetWords }) => {
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [pulsingCells, setPulsingCells] = useState<Cell[]>([]);
  const [lastCorrectCells, setLastCorrectCells] = useState<Cell[]>([]);
  const isCompleted = foundWords.length === targetWords.length;
  const [completedPulseIndex, setCompletedPulseIndex] = useState<number | null>(
    null
  );
  const [completed, setCompleted] = useState(false);

  const dragRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  useEffect(() => {
    if (isCompleted) {
      setCompletedPulseIndex(0);
    } else {
      setCompletedPulseIndex(null);
    }
  }, [isCompleted]);

  useEffect(() => {
    if (foundWords.length === targetWords.length && !completed) {
      setCompleted(true);

      const orderedCells = targetWords.flatMap((target) => {
        const match = foundWords.find((fw) => fw.word === target.toLowerCase());
        return match ? match.cells : [];
      });

      orderedCells.forEach((cell, i) => {
        setTimeout(() => {
          setPulsingCells([cell]);
        }, i * 300);
      });

      setTimeout(() => {
        setPulsingCells([]);
      }, orderedCells.length * 100 + 500);
    }
  }, [foundWords, targetWords, completed]);

  const areAdjacent = (cell1: Cell, cell2: Cell): boolean => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  const isCellSelected = (row: number, col: number): boolean => {
    const activeSelection =
      selectedCells.length > 0 ? selectedCells : lastCorrectCells;
    return activeSelection.some((cell) => cell.row === row && cell.col === col);
  };

  const isCellFound = (row: number, col: number): boolean => {
    return foundWords.some((foundWord) =>
      foundWord.cells.some((cell) => cell.row === row && cell.col === col)
    );
  };

  // New helper: is this cell disabled? Disabled if already found in a word
  const isCellDisabled = (row: number, col: number): boolean => {
    return isCellFound(row, col);
  };

  const isCellCompletedPulsing = (row: number, col: number): boolean => {
    if (completedPulseIndex === null) return false;
    const allCells = foundWords.flatMap((fw) => fw.cells);
    if (completedPulseIndex >= allCells.length) return false;
    const currentCell = allCells[completedPulseIndex];
    return currentCell.row === row && currentCell.col === col;
  };

  const getSelectedWord = (): string => {
    const cellsToUse =
      selectedCells.length > 0 ? selectedCells : lastCorrectCells;
    return cellsToUse.map((cell) => gridData[cell.row][cell.col]).join("");
  };

  const validateWord = (word: string, cells: Cell[]) => {
    if (word.length <= 1) {
      setSelectedCells([]);
      setLastCorrectCells([]);
      return;
    }

    const isValid = targetWords.some(
      (target) => target.toLowerCase() === word.toLowerCase()
    );

    if (isValid) {
      const newFoundWord: FoundWord = {
        word: word.toLowerCase(),
        cells: [...cells],
      };

      setFoundWords((prev) => [...prev, newFoundWord]);

      setPulsingCells(cells);
      setLastCorrectCells(cells);
      setTimeout(() => setPulsingCells([]), 600);
    } else {
      setLastCorrectCells([]);
    }

    setSelectedCells([]);
  };

  const handleDragStart = (row: number, col: number) => {
    if (isCellDisabled(row, col)) return; // Prevent drag start on disabled cells

    setLastCorrectCells([]);
    setSelectedCells([{ row, col }]);
    setIsDragging(true);
    dragRef.current = true;
  };

  const handleDragContinue = (row: number, col: number) => {
    if (!isDragging || !dragRef.current) return;
    if (isCellDisabled(row, col)) return; // Prevent dragging over disabled cells

    const cellIndex = selectedCells.findIndex(
      (cell) => cell.row === row && cell.col === col
    );

    if (cellIndex !== -1) {
      setSelectedCells(selectedCells.slice(0, cellIndex + 1));
    } else if (selectedCells.length > 0) {
      const lastCell = selectedCells[selectedCells.length - 1];
      if (areAdjacent(lastCell, { row, col })) {
        setSelectedCells([...selectedCells, { row, col }]);
      }
    }
  };

  const isCellPulsing = (row: number, col: number): boolean => {
    return pulsingCells.some((cell) => cell.row === row && cell.col === col);
  };

  const stopDragging = useCallback(() => {
    if (isDragging && selectedCells.length > 1) {
      validateWord(getSelectedWord(), selectedCells);
    } else {
      setSelectedCells([]);
    }
    setIsDragging(false);
    dragRef.current = false;
  }, [isDragging, selectedCells]);

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !dragRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        const cellData = element.getAttribute("data-cell");
        if (cellData) {
          const [row, col] = cellData.split("-").map(Number);
          handleDragContinue(row, col);
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("touchend", stopDragging);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener("mouseup", stopDragging);
      document.removeEventListener("touchend", stopDragging);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [stopDragging]);

  const renderLines = () => {
    const lines: React.JSX.Element[] = [];

    const drawFor = (cells: Cell[], color: string) => {
      for (let i = 0; i < cells.length - 1; i++) {
        const fromKey = getCellKey(cells[i].row, cells[i].col);
        const toKey = getCellKey(cells[i + 1].row, cells[i + 1].col);

        const fromEl = cellRefs.current.get(fromKey);
        const toEl = cellRefs.current.get(toKey);
        const svgBounds = svgRef.current?.getBoundingClientRect();

        if (fromEl && toEl && svgBounds) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          const x1 = fromRect.left + fromRect.width / 2 - svgBounds.left;
          const y1 = fromRect.top + fromRect.height / 2 - svgBounds.top;
          const x2 = toRect.left + toRect.width / 2 - svgBounds.left;
          const y2 = toRect.top + toRect.height / 2 - svgBounds.top;

          lines.push(
            <line
              key={`${fromKey}-${toKey}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
            />
          );
        }
      }
    };

    if (selectedCells.length > 1) drawFor(selectedCells, "#8ec5ff");
    foundWords.forEach((fw) => drawFor(fw.cells, "#BA0001"));

    return lines;
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl text-center">
      <div className="text-xl font-mono h-[1.5em] mb-8 align-center">
        <span
          className={`font-bold text-3xl ${
            lastCorrectCells.length > 0 ? "text-[#BA0001]" : ""
          }`}
        >
          {getSelectedWord()}
        </span>
      </div>

      <div
        className="flex justify-center select-none touch-none"
        onMouseLeave={stopDragging}
      >
        <div className="relative">
          <svg
            className="absolute top-0 -z-10 left-0 w-full h-full pointer-events-none"
            ref={svgRef}
          >
            {renderLines()}
          </svg>
          <div className="flex flex-col gap-[2vw] sm:gap-2">
            {gridData.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-[4vw] sm:gap-2">
                {row.map((letter, colIndex) => {
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isFound = isCellFound(rowIndex, colIndex);

                  const getCellStyle = () => {
                    if (isFound) return "bg-[#BA0001] text-white";
                    if (isSelected) return "bg-blue-300";
                    return "bg-white hover:bg-gray-100";
                  };

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      ref={(el) => {
                        if (el)
                          cellRefs.current.set(
                            getCellKey(rowIndex, colIndex),
                            el
                          );
                      }}
                      data-cell={`${rowIndex}-${colIndex}`}
                      className={`
                        w-[11vw] h-[11vw] sm:w-10 sm:h-10 flex items-center justify-center
                        font-bold text-[5vw] sm:text-lg
                        touch-none rounded-full
                        ${getCellStyle()}
                        ${isDragging ? "select-none" : ""}
                        ${isCellPulsing(rowIndex, colIndex) ? "pulse" : ""}
                        ${
                          isCellCompletedPulsing(rowIndex, colIndex)
                            ? "pulse"
                            : ""
                        }
                      `}
                      onMouseDown={() => handleDragStart(rowIndex, colIndex)}
                      onMouseEnter={() =>
                        handleDragContinue(rowIndex, colIndex)
                      }
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleDragStart(rowIndex, colIndex);
                      }}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 mt-6 flex flex-col">
        <div className="text-sm text-gray-600 mt-2">
          Found: {foundWords.length} / {targetWords.length} words
        </div>
      </div>

      <div className="mb-6 text-center font-mono text-xl min-h-[2rem]">
        {foundWords.length === 0 ? (
          <></>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {targetWords.map((word) => {
              const isFound = foundWords.some(
                (fw) => fw.word.toLowerCase() === word.toLowerCase()
              );
              if (!isFound) return null;
              return (
                <span
                  key={word}
                  className="px-3 py-1 rounded-full font-bold uppercase text-sm bg-[#BA0001] text-white"
                >
                  {word}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
