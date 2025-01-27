import React, { useState } from "react";
import { auth, db } from "../../firebase/firebase"; // Assurez-vous d'importer Firestore
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"; // Firestore utilities
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
      // Connexion utilisateur
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Utilisateur connecté :", user);

      // Récupérer la référence du document utilisateur
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Si le document utilisateur n'existe pas, le créer
        await setDoc(userDocRef, {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          role: "user", // Rôle par défaut
          createdAt: serverTimestamp(),
          lastConnection: serverTimestamp(),
        });
        console.log("Nouvel utilisateur ajouté à Firestore.");
      } else {
        // Si le document utilisateur existe, mettre à jour la dernière connexion
        await updateDoc(userDocRef, {
          lastConnection: serverTimestamp(),
        });
        console.log("Dernière connexion mise à jour.");
      }

      // Afficher une notification de succès
      toast.success("Connexion réussie !");

      // Redirection après connexion
      navigate("/"); // Changez "/dashboard" par la route de votre tableau de bord
    } catch (err) {
      console.error("Erreur de connexion :", err.message);

      // Gérer les erreurs
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
      <button onClick={handleSignIn} disabled={loading}>
        {loading ? "Connexion en cours..." : "Se connecter"}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
