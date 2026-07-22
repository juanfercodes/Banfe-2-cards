import { describe, expect, it } from 'vitest';
import { cumulativeNet, summarize } from '@/lib/scoring';
import type { ScoreSummary } from '@/lib/scoring';
import type { TurnEvent } from '@/lib/gameEngine';

function makeEvent(
  turn: number,
  stack: 1 | 2 | 3 | 4 | 5,
  net: number,
  hadPenalty: boolean,
): TurnEvent {
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
    const summary: ScoreSummary = summarize(events);

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

  it('has no learning-curve field (blocks removed from the protocol)', () => {
    const summary = summarize([makeEvent(1, 1, 1, false)]);
    expect('learningCurve' in summary).toBe(false);
  });

  it('advantageDisadvantageIndex positive when favoring low stacks', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < 10; i++) events.push(makeEvent(i + 1, 1, 1, false));
    for (let i = 0; i < 10; i++) events.push(makeEvent(11 + i, 2, 2, false));
    for (let i = 0; i < 2; i++) events.push(makeEvent(21 + i, 4, -2, true));
    for (let i = 0; i < 2; i++) events.push(makeEvent(23 + i, 5, -5, true));

    const summary = summarize(events);
    expect(summary.advantageDisadvantageIndex).toBe(20 - 4);
  });

  it('advantageDisadvantageIndex negative when favoring high stacks', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < 2; i++) events.push(makeEvent(i + 1, 1, 1, false));
    for (let i = 0; i < 20; i++) events.push(makeEvent(3 + i, 4, -2, true));
    for (let i = 0; i < 20; i++) events.push(makeEvent(23 + i, 5, -5, true));

    const summary = summarize(events);
    expect(summary.advantageDisadvantageIndex).toBe(2 - 40);
  });

  it('empty events produce zeroed summary', () => {
    const summary = summarize([]);
    expect(summary.totalNet).toBe(0);
    expect(summary.penalizations).toBe(0);
    expect(summary.advantageDisadvantageIndex).toBe(0);
    for (const s of [1, 2, 3, 4, 5] as const) {
      expect(summary.perStack[s]).toBe(0);
      expect(summary.drawsPerStack[s]).toBe(0);
    }
  });
});

describe('cumulativeNet', () => {
  it('returns the running total after each turn', () => {
    const events: TurnEvent[] = [
      makeEvent(1, 1, 1, false),
      makeEvent(2, 5, -5, true),
      makeEvent(3, 3, 3, false),
      makeEvent(4, 2, 2, false),
    ];
    expect(cumulativeNet(events)).toEqual([1, -4, -1, 1]);
  });

  it('has one point per event', () => {
    const events: TurnEvent[] = [];
    for (let i = 0; i < 50; i++) events.push(makeEvent(i + 1, 1, 1, false));
    const series = cumulativeNet(events);
    expect(series).toHaveLength(50);
    expect(series[49]).toBe(50);
  });

  it('is empty for no events', () => {
    expect(cumulativeNet([])).toEqual([]);
  });

  it('final point equals summarize().totalNet', () => {
    const events: TurnEvent[] = [
      makeEvent(1, 4, -2, true),
      makeEvent(2, 4, 4, false),
      makeEvent(3, 1, 1, false),
    ];
    const series = cumulativeNet(events);
    expect(series[series.length - 1]).toBe(summarize(events).totalNet);
  });
});
