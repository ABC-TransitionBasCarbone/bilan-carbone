import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { Situation } from "../publicodes-build/index.js";

describe("Sous-poste : Énergie", () => {
  const engine = new Engine(rules);

  test("Le bilan carbone est supérieur à 0 lorsque la situation contient des consommations d'énergie", () => {
    const localEngine = engine.shallowCopy();
    const situation: Situation = {
      "énergie . combustibles . fioul domestique . consommation": 100,
      "énergie . combustibles . fioul lourd . consommation": 100,
      "énergie . combustibles . gaz naturel . consommation": 1000,
      "énergie . combustibles . granulés de bois . consommation": 100,
      "énergie . électricité . consommation": 1000,
    };
    localEngine.setSituation(situation);
    const result = localEngine.evaluate("bilan");

    expect(result.nodeValue).toBeGreaterThan(0);
  });

  test("Les autres gaz sont exprimés en kgCO2e sans unité au dénominateur", () => {
    const localEngine = engine.shallowCopy();
    const situation: Situation = {
      "énergie . autres gaz . gaz réfrigérant . type": "'R134a'",
      "énergie . autres gaz . gaz réfrigérant . consommation": 1,
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("énergie . autres gaz");

    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
    expect(result.unit?.denominators).toEqual([]);
  });
});
