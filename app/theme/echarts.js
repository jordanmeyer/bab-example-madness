import { duke } from './tokens.js';
export function echartsTheme() {
  const d = duke();
  const solidStates = {
    emphasis: { itemStyle: { color: 'inherit', opacity: 1 } },
    blur: { itemStyle: { opacity: 1 } },
    select: { itemStyle: { borderColor: d.royal, borderWidth: 2, opacity: 1 } }
  };
  return { bar: solidStates, pie: solidStates, scatter: solidStates,
    // Line emphasis also lifts strokes; keep normal styling and tooltip interaction.
    line: { emphasis: { disabled: true }, blur: { lineStyle: { opacity: 1 }, itemStyle: { opacity: 1 } } },
    color: [d.navy,d.copper,d.teal,d.ironweed,d.royal], backgroundColor: d.paper,
    textStyle: { fontFamily: d.body, color: d.ink },
    title: { textStyle: { fontFamily: d.heading, fontWeight: 400, color: d.navy } },
    categoryAxis: { axisLabel: { color: d.ink }, axisLine: { lineStyle: { color: d.muted } } },
    valueAxis: { axisLabel: { color: d.ink } },
    legend: { textStyle: { color: d.ink } } };
}
