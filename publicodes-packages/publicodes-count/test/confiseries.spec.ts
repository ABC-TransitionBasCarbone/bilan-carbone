import { describe, test, expect } from "vitest";
import Engine, { Situation as PublicodesSituation } from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

describe("Poste - Confiseries et boissons", () => {
  const engine = new Engine(rules);
  test("le poste confiseries est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("le poste confiseries est à 0 si la réponse est partielle", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "confiseries et boissons . achats . vente sur place": "oui",
      "général . nombre entrées": 1000,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("devrait calculer les achats de confiseries si renseigné (type d'achat standard)", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "confiseries et boissons . achats . vente sur place": "oui",
      "confiseries et boissons . achats . achat type": "'standard'",
      "général . nombre entrées": 1000,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer les achats de confiseries si renseigné (type d'achat faible)", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "confiseries et boissons . achats . vente sur place": "oui",
      "confiseries et boissons . achats . achat type": "'un peu'",
      "général . nombre entrées": 1000,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer les achats de confiseries si renseigné (type d'achat important)", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "confiseries et boissons . achats . vente sur place": "oui",
      "confiseries et boissons . achats . achat type": "'significatif'",
      "général . nombre entrées": 1000,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("ne devrait pas calculer le fret si pas de vente", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "confiseries et boissons . achats . vente sur place": "non",
      "général . nombre entrées": 1000,
      "confiseries et boissons . fret . distance": 50,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("devrait calculer le fret si renseigné", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "confiseries et boissons . achats . vente sur place": "oui",
      "confiseries et boissons . achats . achat type": "'standard'",
      "général . nombre entrées": 1000,
      "confiseries et boissons . fret . distance": 50,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("confiseries et boissons");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });
});
