// fonction pour récupérer l email grace à l uid dans la collections users
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";


export const getUserByUid = async (uid) => {
    const user = await getDoc(doc(db, "users", uid));
    return user.data();
    }




