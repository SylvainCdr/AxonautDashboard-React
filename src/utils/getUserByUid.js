// fonction pour récupérer l email grace à l uid dans la collections users 

export const getUserByUid = async (uid) => {
    const user = await getDoc(doc(db, "users", uid));
    return user.data();
    }




