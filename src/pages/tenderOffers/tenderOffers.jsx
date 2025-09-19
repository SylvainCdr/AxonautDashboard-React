import { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { db } from "../../firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function TenderOffers() {
  const [tenderOffers, setTenderOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const keywords = [
      "surete",
      "videoprotection",
      "supervision",
      "hypervision",
      // "controle d acces"
    ];

    // Construire clause OR en plein texte
    const query = keywords.map((k) => `"${k}"`).join(" OR ");

    const url = `https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records?where=${encodeURIComponent(
      query
    )}&limit=100&order_by=-dateparution`;

    console.log("URL générée:", url);

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log("Résultats BOAMP:", data);
        setTenderOffers(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API BOAMP:", err);
        setLoading(false);
      });
  }, []);

  console.log("tenderOffers", tenderOffers);

  function addFavorite(tenderOffer) {
    // sauvegarde dans la collection "tenderOffers" avec l'id BOAMP
    const ref = doc(db, "tenderOffers", tenderOffer.idweb);
    setDoc(ref, {
      ...tenderOffer,
      savedAt: serverTimestamp(),
    })
      .then(() => console.log("Favori sauvegardé !"))
      .catch((err) => console.error("Erreur sauvegarde :", err));
  }

  return (
    <div className={styles.aoContainer}>
      <h1>Appels d’offres (BOAMP)</h1>

      <ul>
        notes :
        <li>
          {" "}
          les appels d'offres sont filtrés par mots-clés (sureté,
          vidéoprotection, supervision, hypervision)
        </li>
        <li>
          - les appels d'offres sont triés par date de parution (les plus
          récents en premier)
        </li>
        <li>
          - cliquer sur "Voir l'annonce" ouvre le lien dans un nouvel onglet
        </li>
        <li>
          - cliquer sur "Ajouter aux favoris" sauvegarde l'appel d'offre dans la
          collection "tenderOffers"
        </li>
      </ul>

      <br />

      <ul>
        {" "}
        reflexions :
        <li>
          {" "}
          Scrap / fetch & duplicate data from boamp, ted europa, maximilien...
        </li>
        <li>Back up in database</li>
        <li>Filter by notices (avis de marché & résultats de marché)</li>
        <li>Use IA for analyse results (attributaires, montant…) </li>
        <li>Make stats ?</li>
      </ul>
      <br />
      <br />

      {loading && <p>Chargement…</p>}
      {!loading && tenderOffers.length === 0 && <p>Aucun résultat.</p>}

      <Link to="/tender-offers-favorites" className={styles.favLink}>
        Favoris
      </Link>

      <div className={styles.listing}>
        {tenderOffers.map((f, i) => (
          <div key={i} className={styles.card}>
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
                onClick={() => addFavorite(f)}
                className={styles.favButton}
              >
                ⭐ Ajouter aux favoris
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
