// Confort visuel et retour caméra de l'arène Braquage du Goûter.
// Fonctions pures : aucune règle de jeu, aucun score, aucune collision n'en dépend.

export const SNACK_COMFORT_KEY = 'slaptax.snack.comfort';
export const SNACK_SHAKE_MS = 180;
export const SNACK_SHAKE_OWN = 7;
export const SNACK_SHAKE_OTHER = 4;

// Secousse amortie : un coup reçu ou porté décale légèrement la caméra.
// Le mouvement est désactivé par la réduction des animations ou le mode confort.
export function snackShakeOffset(elapsedMs: number, amplitude: number, reduced: boolean): {x: number; y: number} {
 if (reduced || !Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= SNACK_SHAKE_MS || !Number.isFinite(amplitude)) return {x: 0, y: 0};
 const decay = 1 - elapsedMs / SNACK_SHAKE_MS, t = elapsedMs / 1000;
 return {x: Math.sin(t * 90) * amplitude * decay, y: Math.cos(t * 73) * amplitude * decay * 0.6};
}

// Un identifiant d'équipe ne repose jamais sur la couleur seule : amis = disque, rivaux = triangle.
export type SnackTeamMarker = 'disc' | 'triangle';
export const snackTeamMarker = (own: boolean): SnackTeamMarker => (own ? 'disc' : 'triangle');
