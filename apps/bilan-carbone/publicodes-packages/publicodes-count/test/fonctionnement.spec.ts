import { describe, test, expect } from "vitest";
import Engine, { Situation as PublicodesSituation } from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

describe("Poste - Fonctionnement", () => {
  const engine = new Engine(rules);
  test("le poste fonctionnement est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("fonctionnement");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBe(0);
  });

  test("devrait calculer les émissions de l'équipe (transport) quand renseigné", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "fonctionnement . équipe . collaborateur type . nombre de jours par semaine": 5,
      "fonctionnement . équipe . collaborateur type . transport . distance": 10,
      "fonctionnement . équipe . collaborateur type . transport . moyen de transport":
        "'voiture essence'",
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("fonctionnement");

    expect(result.nodeValue).toBeTypeOf("number");
    expect(result.nodeValue).toBeGreaterThan(0);
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("avec la situation exemple, calcule les différents sous-postes énergie et équipe", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "fonctionnement . équipe . collaborateur type . nombre de jours par semaine": 5,
      "fonctionnement . équipe . collaborateur type . transport . distance": 10,
      "fonctionnement . équipe . collaborateur type . transport . moyen de transport":
        "'voiture hybride'",
      "fonctionnement . énergie . électricité . consommation": 120000,
      "fonctionnement . énergie . gaz . consommation": 8000,
      "fonctionnement . énergie . est équipé climatisation": "oui",
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const total = localEngine.evaluate("fonctionnement");
    const elec = localEngine.evaluate("fonctionnement . énergie . électricité");

    expect(total.nodeValue).toBeTypeOf("number");
    expect(total.nodeValue).toBeGreaterThan(0);
    expect(elec.nodeValue).toBeTypeOf("number");
    expect(elec.nodeValue).toBeGreaterThan(0);
    expect(total.unit?.numerators).toContain("kgCO2e");
    expect(elec.unit?.numerators).toContain("kgCO2e");
  });
});
