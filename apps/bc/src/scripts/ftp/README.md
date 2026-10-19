# Import et activation des utilisateurs


```mermaid
flowchart TD
    subgraph Import["1. Import FTP"]
        FTP["Normaliser l'adresse e-mail, l'environnement et le niveau de formation"]
        Eligible{"Compte nouveau ou au statut IMPORTED ?"}
        Target{"Identifiant d'entreprise disponible ?"}
        Members{"L'organisation cible a-t-elle des comptes actifs ?"}
        Skip["Ne pas rattacher le compte ni modifier l'organisation"]
        Sync["Créer ou synchroniser l'organisation et rattacher le compte"]
        Keep["Conserver l'organisation et le rattachement du compte"]
        Save["Créer le compte ou actualiser les données personnelles et le niveau de formation<br/>Si nouveau : user.role = DEFAULT<br/>Si nouveau : account.status = IMPORTED"]
        FTP --> Eligible
        Eligible -->|Non| Keep
        Eligible -->|Oui| Target
        Target -->|Non| Keep
        Target -->|Oui| Members
        Members -->|Oui| Skip
        Members -->|Non| Sync
        Keep --> Save
        Skip --> Save
        Sync --> Save
    end
    subgraph Activation["2. Demande d'activation du compte"]
        Request["Vérifier le compte, l'organisation et la licence BC"]
        Approval{"L'organisation a des comptes actifs et le compte n'est pas au statut VALIDATED ?"}
        Pending["Notifier les administrateurs et gestionnaires actifs<br/>account.status = PENDING_REQUEST"]
        Approved["Un responsable valide le compte<br/>user.role = rôle choisi par le responsable<br/>account.status = VALIDATED"]
        Reservation{"Une autre activation fait-elle l'objet d'une réservation ?"}
        ReservationValid{"La réservation est-elle toujours valide ?"}
        Expired["Supprimer la réservation expirée"]
        Validated["Réserver l'organisation pendant 24 h<br/>account.status = VALIDATED"]
        Email["Envoyer le lien d'activation"]
        Password["Vérifier le lien et le mot de passe, puis finaliser l'activation<br/>account.status = ACTIVE"]
        First{"Est-ce le premier compte VALIDATED de l'organisation avec le rôle DEFAULT ?"}
        FirstRole["Attribuer le rôle à l'activation<br/>user.role = ADMIN si formé, sinon GESTIONNAIRE"]
        Blocked["Bloquer cette seconde activation"]
        KeepRole["Conserver le rôle"]
        Request --> Approval
        Approval -->|Oui| Pending --> Approved --> Email
        Approval -->|Non| Reservation
        Reservation -->|Non| Validated
        Reservation -->|Oui| ReservationValid
        ReservationValid -->|Oui| Blocked
        ReservationValid -->|Non| Expired --> Validated
        Email --> Password --> First
        First -->|Oui| FirstRole
        First -->|Non| KeepRole
    end
    Save -. Action de l'utilisateur .-> Request
```

### Scripts lancés par CRON

L'import des utilisateurs s'exécute toutes les 10 minutes pour BC et TILT. Il met à jour les données personnelles et le niveau de formation, sans enregistrer les détails de la formation ni modifier le rôle ou le statut des comptes existants. Les nouveaux comptes ont le statut `IMPORTED` et le rôle `DEFAULT`.

Seuls les nouveaux comptes ou ceux au statut `IMPORTED` peuvent être rattachés à une organisation. Les comptes déjà au statut `VALIDATED`, `PENDING_REQUEST` ou `ACTIVE` conservent leur organisation. Si l'organisation cible a des comptes actifs, l'import ne rattache pas le compte et ne modifie pas l'organisation. Si elle n'en a pas, l'import crée ou synchronise l'organisation et y rattache le compte; le nom d'une organisation existante est conservé.

L'activation nécessite une organisation et, pour BC, une licence. Un compte qui rejoint une organisation ayant déjà des comptes actifs doit être approuvé par un administrateur ou un gestionnaire actif, sauf s'il est déjà au statut `VALIDATED`. Sinon, l'activation peut se poursuivre directement : si un autre compte dispose d'une réservation toujours valide, la demande est bloquée; si la réservation a expiré, elle est supprimée. Le compte passe alors au statut `VALIDATED`, l'organisation est réservée pendant 24 heures et un lien d'activation valable 24 heures est envoyé. Les liens ordinaires de réinitialisation du mot de passe restent valables une heure.

Lorsque le mot de passe est défini, le compte passe au statut `ACTIVE`. Pour BC comme pour TILT, le premier compte au statut `VALIDATED` et doté du rôle `DEFAULT` dans une organisation sans compte actif reçoit le rôle `ADMIN` si son niveau de formation est renseigné, ou `GESTIONNAIRE` dans le cas contraire. Les rôles attribués explicitement et ceux des comptes appartenant à une organisation qui a déjà des comptes actifs sont conservés.
