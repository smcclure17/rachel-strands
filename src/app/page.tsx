import React from "react";
import { Grid } from "@/components/Grid";
import { Arvo } from "next/font/google";

const arvo = Arvo({
  weight: "700",
  subsets: ["latin"],
});

// Grid designed to contain the words: GIRL, FRIEND, GIRLFRIEND
const SAMPLE_GRID = [
  ["L", "G", "Y", "M", "U"],
  ["L", "R", "I", "B", "O"],
  ["I", "W", "L", "E", "Y"],
  ["C", "H", "F", "R", "I"],
  ["R", "A", "D", "N", "E"],
];

const TARGET_WORDS = ["RACH", "WILL", "YOU", "BE", "MY", "GIRLFRIEND"];

export default function Strands() {
  return (
    <div className="flex flex-col items-center sm:mt-24 mt-16 space-y-4">
      <div className="flex flex-col items-center">
        <span className={`text-xs font-bold text-[#BA0001]`}>Beautiful Woman</span>
        <span
          className={`text-2xl ${arvo.className}`}
          style={{ letterSpacing: "-0.025em" }}
        >
          STRANDS
        </span>
      </div>
      <span>Find the words to solve the super secret puzzle 🤔</span>
      <Grid
        gridData={SAMPLE_GRID}
        targetWords={TARGET_WORDS}
        title="Find the Words!"
      />
    </div>
  );
}
