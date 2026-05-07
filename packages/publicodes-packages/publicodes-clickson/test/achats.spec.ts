import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { Situation } from "../publicodes-build/index.js";

describe("Sous-poste : Achats", () => {
  const engine = new Engine(rules);

  test("La fin de vie moyenne est exprimée en kgCO2e", () => {
    const localEngine = engine.shallowCopy();
    const situation: Situation = {
      "achats . fin de vie moyenne . bois . nombre": 1,
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("achats . fin de vie moyenne");

    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
    expect(result.unit?.denominators).toEqual([]);
  });
});
