import React, { useState } from "react";
import { auth } from "../../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./style.module.scss";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Utilisateur connecté :", userCredential.user);

      // Afficher une notification de succès
      toast.success("Connexion réussie !");

      // Redirection après connexion
      navigate("/"); // Changez "/dashboard" par la route de votre tableau de bord
    } catch (err) {
      console.error("Erreur de connexion :", err.message);

      // Afficher un message d'erreur clair
      if (err.code === "auth/user-not-found") {
        setError("Utilisateur non trouvé.");
      } else if (err.code === "auth/wrong-password") {
        setError("Mot de passe incorrect.");
      } else if (err.code === "auth/invalid-email") {
        setError("Email invalide.");
      } else {
        setError("Une erreur s'est produite. Veuillez réessayer.");
      }

      // Afficher une notification d'erreur
      toast.error("Erreur de connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSignIn();
    }
  };

  return (
    <div className={styles.loginContainer}> 

      {/* Animation spéciale pour l'image */}
      <motion.img
        src="assets/logo-dark.png"
        alt=""
        initial={{ scale: 0 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      />
      <p className={styles.cross}>X</p>
      {/* Animation spéciale pour l'image */}
      <motion.img
        src="assets/axo.png"
        alt=""
        initial={{ scale: 0 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      />
      <h2>Connexion</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyPress}
       
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyPress}
   
      />
      <button
        onClick={handleSignIn}
        disabled={loading}
     
      >
        {loading ? "Connexion en cours..." : "Se connecter"}
      </button>
      {error && <p >{error}</p>}
    </div>
  );
}
