import { describe, test, expect } from "vitest";
import Engine, { Situation as PublicodesSituation } from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

describe("Poste - Tournées avant-premières", () => {
  const engine = new Engine(rules);
  test("le poste tournées est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("tournées avant premières");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("devrait calculer les émissions liées aux équipes reçues", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "tournées avant premières . équipes reçues . nombre équipes": 2,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("tournées avant premières");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("avec la situation exemple, calcule l'empreinte pour 5 équipes reçues", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "tournées avant premières . équipes reçues . nombre équipes": 5,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const item = localEngine.evaluate(
      "tournées avant premières . équipes reçues",
    );
    const total = localEngine.evaluate("tournées avant premières");

    expect(item.nodeValue).toBeTypeOf("number");
    expect(item.nodeValue).toBeGreaterThan(0);
    expect(total.nodeValue).toBeTypeOf("number");
    expect(total.nodeValue).toBeGreaterThanOrEqual(item.nodeValue as number);
    expect(total.unit?.numerators).toContain("kgCO2e");
  });
});
