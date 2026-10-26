# Création et activation des comptes

## Identité et comptes

Le mot de passe et le jeton de réinitialisation appartiennent à `User`, partagé entre BC et MIP. Le statut, le rôle et le rattachement à une organisation appartiennent aux comptes applicatifs. Une modification du mot de passe ne doit pas activer les autres comptes de l'utilisateur.

## MIP

`AccountMip` est unique par utilisateur et environnement. La définition du mot de passe cible explicitement le compte de l'environnement MIP.

| Statut initial                             | Définition du mot de passe | Statut final      |
| ------------------------------------------ | -------------------------- | ----------------- |
| `VALIDATED`                                | Autorisée                  | `ACTIVE`          |
| `ACTIVE`                                   | Autorisée                  | `ACTIVE`          |
| `IMPORTED`, `PENDING_REQUEST`, `SUSPENDED` | Refusée                    | Inchangé          |
| Compte absent                              | Refusée                    | Aucun compte créé |

L'activation du compte, l'écriture du mot de passe et la suppression du jeton de réinitialisation sont effectuées dans une même transaction. Une suspension concurrente détectée avant l'activation fait échouer l'opération. Le rôle et le rattachement à l'organisation sont préservés.
