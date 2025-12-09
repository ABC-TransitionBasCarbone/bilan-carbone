import { describe, test, expect } from "vitest";
import Engine, { Situation } from "publicodes";
import rules, { RuleName } from "../publicodes-build/index.js";

describe("Poste - Déchets", () => {
  const engine = new Engine(rules);

  test("devrait calculer les émissions totales de déchets", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation<RuleName> = {
      "déchets . ordinaires . ordures ménagères . nombre bennes": 2,
      "déchets . ordinaires . ordures ménagères . taille benne": 660,
      "déchets . exceptionnels . lampe xenon . nombre": 10,
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("déchets");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBeGreaterThan(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait retourner 0 quand aucune donnée", () => {
    const localEngine = engine.shallowCopy();
    const result = localEngine.evaluate("déchets");

    expect(result.nodeValue).toBe(0);
  });
});
