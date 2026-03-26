import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { RuleName } from "../publicodes-build/index.js";

// Rule names mapped to CUT posts in /cut/publicodes/subPostMapping.ts
const POST_RULES: RuleName[] = [
  "fonctionnement",
  "mobilité spectateurs",
  "tournées avant premières",
  "salles et cabines",
  "confiseries et boissons",
  "déchets",
  "billetterie et communication",
];

const POST_SITUATION = {
  fonctionnement: 100,
  "mobilité spectateurs": 100,
  "tournées avant premières": 100,
  "salles et cabines": 100,
  "confiseries et boissons": 100,
  déchets: 100,
  "billetterie et communication": 100,
};

describe("Bilan", () => {
  // PERF: If performance issues begin to arise during testing, they will need
  // to be refactored to have a single instance of the engine and to use
  // shallow copies.
  const engine = new Engine(rules);

  test("devrait être la somme de tous les postes", () => {
    const localEngine = engine.shallowCopy();
    localEngine.setSituation(POST_SITUATION);
    const bilan = localEngine.evaluate("bilan");

    expect(bilan.nodeValue).toBe(POST_RULES.length * 100);
  });
});
