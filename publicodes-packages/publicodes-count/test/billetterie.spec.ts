import { describe, test, expect } from "vitest";
import Engine, { Situation as PublicodesSituation } from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

describe("Poste - Billetterie et communication", () => {
  const engine = new Engine(rules);
  test("le poste billetterie est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("billetterie et communication");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("devrait calculer les émissions liées aux newsletters si renseigné", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "billetterie et communication . communication digitale . newsletters . nombre": 10,
      "billetterie et communication . communication digitale . newsletters . destinataires": 100,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("billetterie et communication");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer les émissions liées à différents matériels de communication", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "billetterie et communication . matériel distributeurs . affiches . affiches 120x160 . nombre": 20,
      "billetterie et communication . matériel distributeurs . affiches . affiches 40x60 . nombre": 40,
      "billetterie et communication . matériel distributeurs . PLV . PLV comptoir . nombre": 10,
      "billetterie et communication . matériel distributeurs . PLV . PLV grand format . nombre": 5,
      "billetterie et communication . matériel cinéma . production . programme . nombre": 2000,
      "billetterie et communication . matériel cinéma . production . affiches . nombre": 300,
      "billetterie et communication . matériel cinéma . production . flyers . nombre": 5000,
      "billetterie et communication . communication digitale . newsletters . nombre": 24,
      "billetterie et communication . communication digitale . newsletters . destinataires": 3500,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const total = localEngine.evaluate("billetterie et communication");

    expect(total.nodeValue).toBeTypeOf("number");
    expect(total.nodeValue).toBeGreaterThan(0);
    expect(total.unit?.numerators).toContain("kgCO2e");
  });
});
