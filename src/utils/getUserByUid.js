// fonction pour récupérer l email grace à l uid dans la collections users
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";


export const getUserByUid = async (uid) => {
    if (!uid) return null; // Vérification avant d'exécuter la requête
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  };




