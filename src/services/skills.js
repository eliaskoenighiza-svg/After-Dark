import { localGet } from '../storage';

export function baseSlots(sport) {
  return sport.levels.flatMap(([level, names], levelIndex) =>
    names.map((name, order) => ({ slotId: `${levelIndex}:${order}`, level, levelIndex, order, name }))
  );
}

export function effectiveSlots(sport, overrides = {}) {
  return baseSlots(sport).map((slot) => ({ ...slot, name: overrides[slot.slotId] || slot.name }));
}

export function effectiveLevels(sport, overrides = {}) {
  return sport.levels.map(([level], levelIndex) => [
    level,
    effectiveSlots(sport, overrides).filter((x) => x.levelIndex === levelIndex),
  ]);
}

export function nextRecommendedSkill(sport, overrides = {}, done = {}) {
  const slots = effectiveSlots(sport, overrides);
  return slots.find((x) => !done[x.name]) || null;
}

export async function loadSkillContext(sport) {
  const done = await localGet(`skills:${sport.id}`, {});
  const overrides = await localGet(`skills:overrides:${sport.id}`, {});
  const completed = effectiveSlots(sport, overrides).filter((x) => done[x.name]).map((x) => x.name);
  const next = nextRecommendedSkill(sport, overrides, done);
  return {
    done,
    overrides,
    completed,
    next,
    text: `Geschafft: ${completed.length ? completed.join(', ') : 'noch keine markierten Tricks'}. Nächstes sinnvolles Ziel: ${next?.name || 'Skill-Baum komplett'}.`,
  };
}
