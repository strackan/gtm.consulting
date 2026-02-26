// Thin assembler — all prose lives in content/scenarios/*.json
import shared from '../content/scenarios/shared.json';
import chess from '../content/scenarios/chess.json';
import dartboard from '../content/scenarios/dartboard.json';
import puzzle from '../content/scenarios/puzzle.json';
import cards from '../content/scenarios/cards.json';

// Build the full system prompt by combining shared rules + baseline memory + character prompt
function buildSystemPrompt(scenario) {
  const memory = shared.baselineMemoryTemplate.replace('{text}', scenario.baselineMemory);
  return shared.npcGroundRules + memory + '\n\n' + scenario.characterPrompt;
}

// Assemble scenarios with computed systemPrompt
export const scenarios = Object.fromEntries(
  [chess, dartboard, puzzle, cards].map(s => [
    s.id,
    { ...s, systemPrompt: buildSystemPrompt(s) },
  ])
);

// Scoring prompts keyed by scenario ID
export const scoringPrompts = Object.fromEntries(
  [chess, dartboard, puzzle, cards].map(s => [s.id, s.scoringContext])
);

// Result labels from shared data
export const resultLabels = shared.resultLabels;

// Computed max possible score per scenario and total across all scenarios
// Per scenario: discovery(40) + action(40) + efficiency(20) + sentiment(15) + easter_eggs(3/badge) + achievements(10)
export const MAX_PER_SCENARIO = Object.fromEntries(
  Object.entries(scenarios).map(([id, s]) => {
    const discoveryMax = 40;
    const actionMax = 40;
    const efficiencyMax = 20;
    const sentimentMax = 15;
    const easterEggCount = s.facts.filter(f => f.tier === 4 && f.badge).length;
    const easterEggMax = easterEggCount * 3;
    const achievementMax = 10; // the_silence(5) + first_instinct(5)
    return [id, discoveryMax + actionMax + efficiencyMax + sentimentMax + easterEggMax + achievementMax];
  })
);

export const MAX_POSSIBLE_SCORE = Object.values(MAX_PER_SCENARIO).reduce((sum, v) => sum + v, 0);

export function getResultLabel(score) {
  for (const tier of resultLabels) {
    if (score >= tier.min && score <= tier.max) return tier.label;
  }
  return resultLabels[resultLabels.length - 1].label;
}

/**
 * Get per-scenario outcome based on score.
 * Returns { label, delta } or falls back to generic resultLabel.
 */
export function getScenarioOutcome(scenarioId, score) {
  const scenario = scenarios[scenarioId];
  if (scenario && scenario.outcomes) {
    for (const outcome of scenario.outcomes) {
      if (score >= outcome.min) return outcome;
    }
    return scenario.outcomes[scenario.outcomes.length - 1];
  }
  return { label: getResultLabel(score), delta: null };
}

/**
 * Get the ghost verdict for a scenario based on score.
 */
export function getVerdict(scenarioId, score) {
  const scenario = scenarios[scenarioId];
  if (!scenario || !scenario.verdicts) return null;
  if (score >= 70) return scenario.verdicts.high;
  if (score >= 40) return scenario.verdicts.mid;
  return scenario.verdicts.low;
}

/**
 * Get personalized or default mailbox message.
 */
export function getMailboxMessage(visitorProfile) {
  if (visitorProfile?.welcome_letter) {
    return `You unfold the letter and read:\n\n${visitorProfile.welcome_letter}`;
  }

  if (visitorProfile) {
    const first = visitorProfile.name.split(' ')[0];
    return `You unfold the letter and read:\n\n"Hey ${first},\n\nMost consultants give you a pitch deck. I made you something different.\n\nInside this house, there are four customers. Real scenarios. Real stakes.\n\nEach one is about to leave — and right now, you don't know why.\n\nYou'll get five minutes. Face to face, before things went wrong. They'll answer your questions. But they won't volunteer what's really going on. You have to ask.\n\nWhat you uncover — and what you do with it — determines whether they stay or go.\n\nFind your way inside. The clock starts when you sit down.\n\n- Justin"`;
  }
  return null;
}
