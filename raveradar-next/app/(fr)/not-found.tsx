import NotFoundPage from "@/components/NotFoundPage";

/* Une 404 par groupe de routes, et non une seule à la racine d'`app/` : avec deux
   layouts racines, un `not-found.tsx` racine n'a aucun layout qui lui donne son
   `<html>`, et Next refuse de le rendre — il répondait 500, y compris sur la page
   d'accueil. Chaque groupe a donc la sienne, dans sa langue. */
export default function NotFound() {
  return <NotFoundPage lang="fr" />;
}
