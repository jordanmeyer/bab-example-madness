// Call after canonical tokens and local fonts load; charts need literal values.
export function duke() {
  const css = getComputedStyle(document.documentElement);
  const color = name => css.getPropertyValue(`--duke-${name}`).trim();
  return { navy: color('navy-blue'), royal: color('royal-blue'), copper: color('copper'),
    teal: color('magnolia'), ironweed: color('ironweed'), paper: color('white'),
    panel: color('hatteras'), ink: color('cast-iron'), muted: color('graphite'),
    heading: color('font-heading'), body: color('font-body') };
}
