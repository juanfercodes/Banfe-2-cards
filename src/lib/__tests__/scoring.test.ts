import { describe, expect, it } from 'vitest';
import { summarize } from '@/lib/scoring';
import type { ScoreSummary } from '@/lib/scoring';
import type { TurnEvent } from '@/lib/gameEngine';
import { BLOCK_SIZE, TOTAL_TURNS, SHORT_TOTAL_TURNS } from '@/lib/protocol';

function makeEvent(turn: number, stack: 1 | 2 | 3 | 4 | 5, net: number, hadPenalty: boolean): TurnEvent {
  return {
    turn,
    stack,
    reward: net + (hadPenalty ? 3 : 0),
    hadPenalty,
    penalty: hadPenalty ? -3 : 0,
    net,
    runningTotal: 0,
  };
}

describe('summarize', () => {
  it('hand-crafted fixture — all fields correct', () => {
    const events: TurnEvent[] = [
      makeEvent(1, 1, 1, false),
      makeEvent(2, 2, 1, false),
      makeEvent(3, 4, -2, true),
      makeEvent(4, 5, -5, true),
      makeEvent(5, 3, 3, false),
    ];
    const summary: ScoreSummary = summarize(events, 200);

    expect(summary.totalNet).toBe(1 + 1 + -2 + -5 + 3);
    expect(summary.penalizations).toBe(2);
    expect(summary.perStack[1]).toBe(1);
    expect(summary.perStack[2]).toBe(1);
    expect(summary.perStack[3]).toBe(3);
    expect(summary.perStack[4]).toBe(-2);
    expect(summary.perStack[5]).toBe(-5);
    expect(summary.drawsPerStack[1]).toBe(1);
    expect(summary.drawsPerStack[2]).toBe(1);
    expect(summary.drawsPerStack[3]).toBe(1);
    expect(summary.drawsPerStack[4]).toBe(1);
    expect(summary.drawsPerStack[5]).toBe(1);
  });

  it('advantageDisadvantageIndex positive when favoring low stacks', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < 10; i++) events.push(makeEvent(i + 1, 1, 1, false));
    for (let i = 0; i < 10; i++) events.push(makeEvent(11 + i, 2, 2, false));
    for (let i = 0; i < 2; i++) events.push(makeEvent(21 + i, 4, -2, true));
    for (let i = 0; i < 2; i++) events.push(makeEvent(23 + i, 5, -5, true));

    const summary = summarize(events, 200);
    expect(summary.advantageDisadvantageIndex).toBe(20 - 4);
  });

  it('advantageDisadvantageIndex negative when favoring high stacks', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < 2; i++) events.push(makeEvent(i + 1, 1, 1, false));
    for (let i = 0; i < 20; i++) events.push(makeEvent(3 + i, 4, -2, true));
    for (let i = 0; i < 20; i++) events.push(makeEvent(23 + i, 5, -5, true));

    const summary = summarize(events, 200);
    expect(summary.advantageDisadvantageIndex).toBe(2 - 40);
  });

  it('learningCurve length = ceil(totalTurns / BLOCK_SIZE) for 200 turns', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < TOTAL_TURNS; i++) {
      events.push(makeEvent(i + 1, 1, 1, false));
    }
    const summary = summarize(events, TOTAL_TURNS);
    expect(summary.learningCurve).toHaveLength(Math.ceil(TOTAL_TURNS / BLOCK_SIZE));
  });

  it('learningCurve per-block sums are correct', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < TOTAL_TURNS; i++) {
      events.push(makeEvent(i + 1, 1, 1, false));
    }
    const summary = summarize(events, TOTAL_TURNS);
    for (const block of summary.learningCurve) {
      expect(block).toBe(BLOCK_SIZE);
    }
  });

  it('learningCurve length = ceil(SHORT_TOTAL_TURNS / BLOCK_SIZE) for short game', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < SHORT_TOTAL_TURNS; i++) {
      events.push(makeEvent(i + 1, 1, 1, false));
    }
    const summary = summarize(events, SHORT_TOTAL_TURNS);
    expect(summary.learningCurve).toHaveLength(Math.ceil(SHORT_TOTAL_TURNS / BLOCK_SIZE));
  });

  it('empty events produce zeroed summary', () => {
    const summary = summarize([], 200);
    expect(summary.totalNet).toBe(0);
    expect(summary.penalizations).toBe(0);
    expect(summary.advantageDisadvantageIndex).toBe(0);
    for (const s of [1, 2, 3, 4, 5] as const) {
      expect(summary.perStack[s]).toBe(0);
      expect(summary.drawsPerStack[s]).toBe(0);
    }
  });
});
