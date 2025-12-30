import { describe, test, expect } from "vitest";
import Engine, { Situation as PublicodesSituation } from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

describe("Poste - Salles et cabines", () => {
  const engine = new Engine(rules);
  test("le poste salles et cabines est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("salles et cabines");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("devrait calculer l'empreinte des lunettes 3D si le nombre est renseigné", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "salles et cabines . autre matériel . lunettes 3D . nombre": 100,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("salles et cabines");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer l'empreinte d'une salle si projecteur, écran, fauteuils renseignés", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "salles et cabines . matériel technique . salle . projecteur . année achat":
        "'01/2018'",
      "salles et cabines . matériel technique . salle . projecteur . type":
        "'xénon'",
      "salles et cabines . matériel technique . salle . écran . année achat":
        "'01/2021'",
      "salles et cabines . matériel technique . salle . écran . surface écran": 70,
      "salles et cabines . matériel technique . salle . écran . type":
        "'écran 2D'",
      "salles et cabines . matériel technique . salle . fauteuils . année achat":
        "'01/2021'",
      "salles et cabines . matériel technique . salle . fauteuils . nombre": 180,
      "salles et cabines . matériel technique . salle . fauteuils . type":
        "'fauteuils classiques'",
      "salles et cabines . matériel technique . salle . système son . année achat":
        "'01/2022'",
      "salles et cabines . matériel technique . salle . système son . type":
        "'dolby 51'",
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("salles et cabines");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer l'empreinte des clouds et disques durs si renseignés", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "salles et cabines . matériel technique . cloud . stockage": 2000,
      "salles et cabines . matériel technique . disques durs . nombre": 10,
      "salles et cabines . matériel technique . films . nombre films dématérialisés": 300,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("salles et cabines");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });
});
