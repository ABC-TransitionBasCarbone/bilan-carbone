# Architecture des paquets

## Organisation

- `packages/application/components` : composants communs.
- `packages/application/ui` : composants UI et styles (`css/`).
- `packages/shared` : services, Publicodes, providers, i18n, types et utils.
- L’alias `@abc-transitionbascarbone/css` pointe vers `packages/application/ui/css`.

```mermaid
flowchart LR
    Apps["Apps BC et MIP"] --> Application["application<br/>components + ui/css"]
    Apps --> Shared["shared<br/>services + Publicodes + utils"]
    Application --> Shared
    Shared -. "Dépendance UI actuelle" .-> Application
```
