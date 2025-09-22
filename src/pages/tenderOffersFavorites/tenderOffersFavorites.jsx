import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { db } from "../../firebase/firebase";

export default function TenderOffersFavorites() {
  const [tenderOffers, setTenderOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tenderOffers"));
        const favoritesList = querySnapshot.docs.map((doc) => ({
          idweb: doc.id, // <-- correspond à l'ID du doc Firestore (idweb)
          ...doc.data(),
        }));
        setTenderOffers(favoritesList);
        setLoading(false);
      } catch (error) {
        console.error("Erreur récupération favoris :", error);
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  function removeFavorite(idweb) {
    const ref = doc(db, "tenderOffers", idweb);
    deleteDoc(ref)
      .then(() => {
        console.log("Favori supprimé !");
        setTenderOffers((prev) =>
          prev.filter((offer) => offer.idweb !== idweb)
        );
      })
      .catch((err) => console.error("Erreur suppression :", err));
  }

  return (
    <div className={styles.aoFavoritesContainer}>
      <h2>Favoris des appels d’offres</h2>

      {loading && <p>Chargement des favoris…</p>}
      {!loading && tenderOffers.length === 0 && <p>Aucun favori.</p>}

      <div className={styles.listing}>
        {tenderOffers.map((f) => (
          <div key={f.idweb} className={styles.card}>
            <div className={styles.header}>
              <h3 className={styles.title}>{f.objet}</h3>
              <span className={styles.nature}>{f.nature_libelle}</span>
            </div>

            <p className={styles.acheteur}>
              <strong>Acheteur :</strong> {f.nomacheteur}
            </p>

            {f.type_procedure && (
              <p>
                <strong>Procédure :</strong> {f.type_procedure} /{" "}
                {f.procedure_libelle}
              </p>
            )}

            {f.code_departement?.length > 0 && (
              <p>
                <strong>Départements :</strong> {f.code_departement.join(", ")}
              </p>
            )}

            {f.criteres?.length > 0 && (
              <p>
                <strong>Critères :</strong> {f.criteres.join(", ")}
              </p>
            )}

            <div className={styles.info}>
              <span>
                <strong>Parution :</strong> {f.dateparution}
              </span>
              <span>
                <strong>Limite réponse :</strong>{" "}
                {f.datelimitereponse
                  ? new Date(f.datelimitereponse).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            <div className={styles.tags}>
              {f.type_marche_facette?.map((t, idx) => (
                <span key={idx} className={styles.tag}>
                  {t}
                </span>
              ))}
            </div>

            <div className={styles.actions}>
              <a
                href={f.url_avis}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                Voir l’annonce
              </a>
              <button
                onClick={() => removeFavorite(f.idweb)}
                className={styles.favButton}
              >
                ❌ Supprimer le favori
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
