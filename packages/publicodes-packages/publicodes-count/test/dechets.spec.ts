import { describe, test, expect } from "vitest";
import Engine, { Situation as PublicodesSituation } from "publicodes";
import rules, { RuleName, Situation } from "../publicodes-build/index.js";

describe("Poste - Déchets", () => {
  const engine = new Engine(rules);
  test("le poste des déchets est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("déchets");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBe(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer les émissions totales de déchets", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
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

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("déchets");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBeGreaterThan(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer correctement les émissions associées aux lampes Xénon", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "déchets . exceptionnels . lampe xenon . nombre": 10000,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("déchets");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que le résultats est bien de 430kTCO2e pour 10 000 lampes
    expect(result.nodeValue).toBe(430000);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("devrait calculer les émissions totales de déchets même si toutes les réponses ne sont pas fournies", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "déchets . ordinaires . ordures ménagères . nombre bennes": 2,
      "déchets . ordinaires . ordures ménagères . taille benne": 660,
      "déchets . ordinaires . ordures ménagères . fréquence ramassage": 1,
      "déchets . ordinaires . emballages et papier . nombre bennes": 2,
      "déchets . ordinaires . emballages et papier . taille benne": 660,
      "déchets . ordinaires . emballages et papier . fréquence ramassage": 1,
      "déchets . exceptionnels . matériel technique . quantité": 5,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const result = localEngine.evaluate("déchets");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBeGreaterThan(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("ne devrait pas calculer un élément de la somme dont les questions sont partiellement renseignées", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "déchets . ordinaires . ordures ménagères . nombre bennes": 2,
      "déchets . ordinaires . ordures ménagères . taille benne": 660,
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);
    const itemResult = localEngine.evaluate(
      "déchets . ordinaires . ordures ménagères",
    );
    const result = localEngine.evaluate("déchets");

    // Vérifier que l'élément partiellement renseigné est non défini.
    expect(itemResult.nodeValue).toBe(0);

    // Vérifier que le total est nul.
    expect(result.nodeValue).toBe(0);
  });

  test("devrait correctement calculer l'empreinte des déchets exceptionnels", () => {
    const localEngine = engine.shallowCopy();
    const situation = {
      "général . nombre entrées": 10,
      "général . nombre séances": 10,
      "général . nombre de jours ouverture": 250,
      "déchets . exceptionnels . lampe xenon . nombre": "100",
      "déchets . ordinaires . ordures ménagères . nombre bennes": "10",
      "déchets . exceptionnels . matériel technique . quantité": "100",
    };

    localEngine.setSituation(situation as PublicodesSituation<RuleName>);

    const result = localEngine.evaluate("déchets . exceptionnels");

    expect(result.nodeValue).toBe(4499.5);
  });
});
