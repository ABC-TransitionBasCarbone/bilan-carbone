import { describe, test, expect } from "vitest";
import Engine from "publicodes";
import rules from "../publicodes-build/index.js";

describe("Sous-poste : Restauration", () => {
  const engine = new Engine(rules);

  test("Il ne devrait pas y avoir d'erreur lors de la conversion d'unité avec une situation vide", () => {
    const localEngine = engine.shallowCopy();
    const result = localEngine.evaluate("restauration");
    expect(result.nodeValue).toEqual(0);
  });
});
