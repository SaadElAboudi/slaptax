# Pif Paf et Bagarre de Table : crasses jouables

## Pif Paf : banane, poisson et poêle

Les quatre actions sont choisies simultanément et restent cachées à l’adversaire jusqu’à la révélation. Le bot solo choisit avant le joueur à partir des seuls états publics.

| Ton choix | Choix adverse | Effet réel |
| --- | --- | --- |
| Banane | Charge | Le rival glisse et perd 2 PV ; sa charge est néanmoins acquise |
| Banane | Attaque | Tu prends les dégâts de l’attaque + 1 dégât de vulnérabilité |
| Défense | Attaque | Tu bloques et renvoies les dégâts à l’attaquant : 1, ou 2 si chargé |
| Charge | Autre action | Ton prochain coup peut faire 2 dégâts ; la charge ne dure qu’un tour |
| Attaque | Charge ou expiration | 1 dégât, ou 2 après une charge |

Six PV, huit échanges maximum, choix sous trois secondes. La défense ne peut pas être utilisée deux tours de suite. Une expiration n’attaque pas et ne protège pas. Les autres paires n’infligent pas de dégâts. Les KO simultanés et égalités après huit tours demandent l’accord des deux joueurs pour rejouer.

Les accessoires représentent la vraie action : gant, gros poisson après charge, poêle de défense et banane. Les réactions « GLISSADE » et « DANS TA POÊLE » correspondent aux dégâts réellement attribués par le serveur. L’historique et l’image exportée conservent les actions réelles. Le récapitulatif compte les bananes placées et les attaques renvoyées par le joueur, sans inventer de réussite.

## Bagarre de Table : coups de nappe

À 6, 12 et 16 secondes, la nappe donne une impulsion horizontale à tous les personnages encore sur la table. L’ordre est droite, gauche, droite. Des flèches et un avertissement annoncent la direction 1,2 seconde à l’avance. On peut se replacer, contre-braquer ou profiter de la glissade pour percuter un rival.

L’impulsion est identique pour les humains et les bots, même si un bot se propulse au même instant. Les positions initiales des deux humains restent symétriques face à ces forces horizontales ; rester tous deux inactifs n’accorde pas une victoire gratuite à un emplacement.

Les règles précédentes restent applicables : propulsion au glisser-relâcher, collisions physiques, table qui rétrécit après dix secondes, départage par proximité du centre à vingt secondes. Le calendrier de nappe suit l’horloge simulée et se décale avec une pause réseau.

Le résultat et l’export de Bagarre de Table dessinent maintenant sa vraie scène serveur. Le récapitulatif donne le nombre réel de coups de nappe survenus et les KO attribués. Les animations respectent la réduction des mouvements.

## Objectif produit

Ces changements visent des interactions mémorables et des occasions de revanche entre amis. Le duel conserve les invitations, le score serveur et les revanches existantes. La popularité, l’humour et la rétention doivent encore être mesurés avec de vrais groupes de joueurs ; ils ne sont pas déduits des tests techniques.
