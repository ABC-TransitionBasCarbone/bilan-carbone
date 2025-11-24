import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { Questions } from "../publicodes-build/index.js";

describe("Poste - Déchets", () => {
  const engine = new Engine(rules);

  test("devrait calculer les émissions totales de déchets", () => {
    const localEngine = engine.shallowCopy();

    const situation: Questions = {
      "déchets . ordinaires . ordures ménagères . nombre bennes": 2,
      "déchets . ordinaires . ordures ménagères . taille benne": 660,
      "déchets . ordinaires . ordures ménagères . fréquence ramassage": 1,
      "déchets . ordinaires . emballages et papier . nombre bennes": 2,
      "déchets . ordinaires . emballages et papier . taille benne": 660,
      "déchets . ordinaires . emballages et papier . fréquence ramassage": 1,
      "déchets . ordinaires . biodéchets . nombre bennes": 2,
      "déchets . ordinaires . biodéchets . taille benne": 660,
      "déchets . ordinaires . biodéchets . fréquence ramassage": 1,
      "déchets . ordinaires . verre . nombre bennes": 2,
      "déchets . ordinaires . verre . taille benne": 660,
      "déchets . ordinaires . verre . fréquence ramassage": 1,
      "déchets . exceptionnels . lampe xenon . nombre": 10,
      "déchets . exceptionnels . matériel technique . quantité": 5,
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

  // NOTE: We want to have non-zero default values to dynamically check unit homogeneity.
  test.skip("devrait retourner undefined quand aucune donnée", () => {
    const localEngine = engine.shallowCopy();
    const result = localEngine.evaluate("déchets");

    expect(result.nodeValue).toBeUndefined();
  });
});
