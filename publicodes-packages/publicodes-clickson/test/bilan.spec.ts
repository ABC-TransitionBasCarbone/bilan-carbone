import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

const SUB_POSTS: RuleName[] = [
  "énergie",
  "restauration",
  "déplacements",
  "achats",
  "immobilisations",
];

describe("Sous-poste : Bilan", () => {
  const engine = new Engine(rules);

  test("Devrait être égal à 0 pour une situation vide", () => {
    const localEngine = engine.shallowCopy();
    const result = localEngine.evaluate("bilan");

    expect(result.nodeValue).toEqual(0);
  });

  test("Devrait être égal au sous-poste", () => {
    const localEngine = engine.shallowCopy();
    const situation: Situation = {
      "énergie . combustibles . fioul domestique . consommation": 100,
      "énergie . combustibles . fioul lourd . consommation": 100,
      "énergie . combustibles . gaz naturel . consommation": 1000,
      "énergie . combustibles . granulés de bois . consommation": 100,
      "énergie . électricité . consommation": 1000,
    };
    localEngine.setSituation(situation);
    const subPostResult = localEngine.evaluate("énergie");
    const bilanResult = localEngine.evaluate("bilan");

    expect(subPostResult.nodeValue).toEqual(bilanResult.nodeValue);
  });

  test("Devrait être égal à la somme de tous les sous-postes", () => {
    const localEngine = engine.shallowCopy();
    const situation = {};
    for (const subPost of SUB_POSTS) {
      situation[subPost] = 500;
    }
    localEngine.setSituation(situation);

    for (const subPost of SUB_POSTS) {
      expect(localEngine.evaluate(subPost).nodeValue).toEqual(500);
    }

    expect(localEngine.evaluate("bilan").nodeValue).toEqual(
      SUB_POSTS.length * 500,
    );
  });
});
