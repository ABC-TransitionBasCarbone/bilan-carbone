import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules, { Situation } from "../publicodes-build/index.js";

describe("Poste - Mobilité Spectateurs", () => {
  const engine = new Engine(rules);
  test("le poste mobilité spectateurs est à 0 si aucune réponse n'est donnée", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {};

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBe(0);
  });

  test("ne devrait pas calculer d'émissions si besoin d'enquête", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "mobilité spectateurs . mobilité spectateurs . précision": "'besoin'",
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");
    const itemResult = localEngine.evaluate(
      "mobilité spectateurs . mobilité spectateurs . précision . besoin . contact",
    );

    // Vérifier que c'est positif
    expect(result.nodeValue).toBe(0);

    // Vérifier que la règle qui contient le message à afficher est applicable et est un texte.

    expect(
      localEngine.evaluate({
        "est applicable":
          "mobilité spectateurs . mobilité spectateurs . précision . besoin . contact",
      }).nodeValue,
    ).toBe(true);
    expect(itemResult.nodeValue).toBeTypeOf("string");
  });

  test("si enquête mobilité, devrait calculer l'empreinte précise", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "mobilité spectateurs . mobilité spectateurs . précision":
        "'résultat précis'",
      "mobilité spectateurs . résultat précis . empreinte . RER et transilien . distance": 1000,
      "mobilité spectateurs . résultat précis . empreinte . métro ou tram . distance": 500,
      "mobilité spectateurs . résultat précis . empreinte . bus . distance": 200,
      "mobilité spectateurs . résultat précis . empreinte . vélo électrique . distance": 100,
      "mobilité spectateurs . résultat précis . empreinte . vélo classique . distance": 50,
      "mobilité spectateurs . résultat précis . empreinte . marche . distance": 20,
      "mobilité spectateurs . résultat précis . empreinte . voiture diesel . distance": 300,
      "mobilité spectateurs . résultat précis . empreinte . voiture essence . distance": 400,
      "mobilité spectateurs . résultat précis . empreinte . voiture hybride . distance": 150,
      "mobilité spectateurs . résultat précis . empreinte . voiture électrique . distance": 250,
      "mobilité spectateurs . résultat précis . empreinte . moto . distance": 80,
      "mobilité spectateurs . résultat précis . empreinte . scooter . distance": 60,
      "mobilité spectateurs . résultat précis . empreinte . trottinette électrique . distance": 40,
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBeGreaterThan(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("si enquête mobilité, devrait calculer l'empreinte précise même si les distances ne sont pas toutes saisies", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "mobilité spectateurs . mobilité spectateurs . précision":
        "'résultat précis'",
      "mobilité spectateurs . résultat précis . empreinte . RER et transilien . distance": 1000,
      "mobilité spectateurs . résultat précis . empreinte . métro ou tram . distance": 500,
      "mobilité spectateurs . résultat précis . empreinte . bus . distance": 200,
      "mobilité spectateurs . résultat précis . empreinte . vélo électrique . distance": 100,
      "mobilité spectateurs . résultat précis . empreinte . vélo classique . distance": 50,
      "mobilité spectateurs . résultat précis . empreinte . marche . distance": 20,
      "mobilité spectateurs . résultat précis . empreinte . voiture diesel . distance": 300,
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBeGreaterThan(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });

  test("si besoin d'un profil de cinéma, devrait calculer une empreinte estimée seulement si la degré d'accessibilité de l'établissement est renseigné - 1", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "mobilité spectateurs . mobilité spectateurs . précision": "'estimation'",
      "mobilité spectateurs . résultat estimé . proximité spectateurs":
        "'majoritairement locaux'",
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");

    expect(result.nodeValue).toBe(0);
  });

  test("si besoin d'un profil de cinéma, devrait calculer une empreinte estimée seulement si la degré d'accessibilité de l'établissement est renseigné - 2", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "mobilité spectateurs . mobilité spectateurs . précision": "'estimation'",
      "mobilité spectateurs . résultat estimé . profil établissement":
        "'distances longues'",
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");

    expect(result.nodeValue).toBe(0);
  });

  test("si besoin d'un profil de cinéma, devrait calculer une empreinte estimée seulement si la degré d'accessibilité de l'établissement est renseigné - 3", () => {
    const localEngine = engine.shallowCopy();

    const situation: Situation = {
      "mobilité spectateurs . mobilité spectateurs . précision": "'estimation'",
      "mobilité spectateurs . résultat estimé . proximité spectateurs":
        "'majoritairement locaux'",
      "mobilité spectateurs . résultat estimé . profil établissement":
        "'distances longues'",
    };

    localEngine.setSituation(situation);
    const result = localEngine.evaluate("mobilité spectateurs");

    // Vérifier que le calcul retourne un nombre
    expect(result.nodeValue).toBeTypeOf("number");

    // Vérifier que c'est positif
    expect(result.nodeValue).toBeGreaterThan(0);

    // Vérifier l'unité
    expect(result.unit?.numerators).toContain("kgCO2e");
  });
});
