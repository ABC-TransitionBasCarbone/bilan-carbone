import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { Situation } from "../publicodes-build/index.js";

describe("Sous-poste : Restauration", () => {
  const engine = new Engine(rules);

  test("Il ne devrait pas y avoir d'erreur lors de la conversion d'unité avec une situation vide", () => {
    const localEngine = engine.shallowCopy();
    const result = localEngine.evaluate("restauration");
    expect(result.nodeValue).toEqual(0);
  });

  test("Les émissions des barres chocolatées sont bien exprimées en kgCO2e", () => {
    const localEngine = engine.shallowCopy();
    const situation: Situation = {
      "restauration . distributeur automatiques . barre chocolatée . nombre": 1,
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate(
      "restauration . distributeur automatiques . barre chocolatée",
    );

    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
    expect(result.unit?.denominators).toEqual([]);
  });
});
