import { useEffect } from 'react'

/**
 * Met à jour document.title avec le format "Sous-titre — Orakl".
 * Passer une chaîne vide pour afficher juste "Orakl".
 */
export function usePageTitle(subtitle: string) {
  useEffect(() => {
    document.title = subtitle ? `${subtitle} — Orakl` : 'Orakl'
    return () => {
      document.title = 'Orakl'
    }
  }, [subtitle])
}
