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
    return `You unfold the letter and read:\n\n"Greetings ${first},\n\nThanks for playing my little game. I hope you like it!\n\nHere's how it works:\n\nInside this cottage are 4 real customers who, unfortunately, no longer do business with your company. Each one churned — or nearly churned — for a different reason. Each one is a different kind of person with different motivations, frustrations, and communication styles.\n\nHowever, due to a strange electrical storm (don't ask), time has folded back on itself, and you've been given a rare second chance.\n\nYou get 10 questions.\n\nThat's it. Ten questions spread across all four customers. You can distribute them however you want — blow all 10 on one customer, spread them evenly, or skip someone entirely. It's your call.\n\nEach customer is in a different room of the cottage. You can visit them in any order. When you enter a room, you'll learn a little about who they are. Then you start asking.\n\nYour goal: Change the outcome.\n\nEach of these customers had a real ending. Some churned. Some stayed but barely. Your score reflects whether you can do better than what actually happened — or worse.\n\nAfter your 10 questions are up, you'll see your debrief: what actually happened, what you changed, and what you missed.\n\nA few things to know:\n\nThe questions you ask matter more than the answers you get. These customers are watching how you engage, not just what you say. Ask something selfish, they'll notice. Ask something that shows you actually listened, they'll notice that too.\n\nYou won't have access to a CRM, usage data, or internal notes. All you have is what they tell you — and what you can pick up between the lines.\n\nReady?\n\nType LOOK AROUND to see the cottage, or HELP for commands.\n\nGood luck, ${first}. They're waiting for you.\n\n— The Consultant\n\n[GTM.CONSULTANT is an interactive training experience. Your choices and outcomes are tracked and will be reviewed in your debrief session.]"`;
  }
  return null;
}
