import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { DotLoader } from "react-spinners";

const ProtectedRoute = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Vous devez être connecté pour accéder à cette page.");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <DotLoader color="#C60F7B" loading={loading} size={60} />
      </div>
    ); // Affichez un loader pendant le chargement
  }

  if (error) {
    return <div>Erreur : {error.message}</div>; // Gestion des erreurs éventuelles
  }

  // Si l'utilisateur est connecté, on affiche les enfants (la route protégée)
  return user ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
