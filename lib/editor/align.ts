// Forward streaming alignment with whitespace-tolerant lookahead.
// (Shared by the editor's CM6 trace decorations; the original lives in
// app/trace/TraceClient.tsx and is kept identical here so both behave the same.)
//
// Whitespace runs don't count toward the lookahead budget, so indent/newline
// differences can be absorbed without painting the rest of the file red.
// Tie-breaks prefer treating extra typed chars as insertions over marking
// original chars as deletions.

export interface Alignment {
  matched: boolean[];
  wrong: boolean[];
  typedDiverged: boolean[];
}

export function alignTyped(original: string, typed: string): Alignment {
  const matched = new Array(original.length).fill(false);
  const wrong = new Array(original.length).fill(false);
  const typedDiverged = new Array(typed.length).fill(false);
  const NON_WS_LOOKAHEAD = 5;
  const isWs = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r";

  let oi = 0;
  let ti = 0;
  while (ti < typed.length && oi < original.length) {
    if (typed[ti] === original[oi]) {
      matched[oi++] = true;
      ti++;
      continue;
    }

    let skipOrig = -1;
    {
      let nonWs = 0;
      for (let k = 1; oi + k < original.length; k++) {
        const c = original[oi + k];
        if (c === typed[ti]) {
          skipOrig = k;
          break;
        }
        if (!isWs(c)) {
          nonWs++;
          if (nonWs > NON_WS_LOOKAHEAD) break;
        }
      }
    }

    let skipTyped = -1;
    {
      let nonWs = 0;
      for (let k = 1; ti + k < typed.length; k++) {
        const c = typed[ti + k];
        if (c === original[oi]) {
          skipTyped = k;
          break;
        }
        if (!isWs(c)) {
          nonWs++;
          if (nonWs > NON_WS_LOOKAHEAD) break;
        }
      }
    }

    if (skipOrig !== -1 && skipTyped !== -1) {
      if (skipOrig < skipTyped) {
        for (let k = 0; k < skipOrig; k++) wrong[oi + k] = true;
        oi += skipOrig;
      } else {
        for (let k = 0; k < skipTyped; k++) typedDiverged[ti + k] = true;
        ti += skipTyped;
      }
    } else if (skipOrig !== -1) {
      for (let k = 0; k < skipOrig; k++) wrong[oi + k] = true;
      oi += skipOrig;
    } else if (skipTyped !== -1) {
      for (let k = 0; k < skipTyped; k++) typedDiverged[ti + k] = true;
      ti += skipTyped;
    } else {
      wrong[oi++] = true;
      typedDiverged[ti] = true;
      ti++;
    }
  }

  return {matched, wrong, typedDiverged};
}

// How far into the original we have consumed (matched or skipped-as-wrong).
// The remaining original.slice(reached) is what the trace ghost still shows.
export function reachedOriginalIndex(a: Alignment): number {
  let reached = 0;
  for (let i = 0; i < a.matched.length; i++) {
    if (a.matched[i] || a.wrong[i]) reached = i + 1;
  }
  return reached;
}

export function matchCount(a: Alignment): number {
  let n = 0;
  for (let i = 0; i < a.matched.length; i++) if (a.matched[i]) n++;
  return n;
}
