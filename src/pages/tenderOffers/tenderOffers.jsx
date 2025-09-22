import { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { db } from "../../firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function TenderOffers() {
  const [tenderOffers, setTenderOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  useEffect(() => {
    const keywords = [
      "surete",
      "videoprotection",
      "supervision",
      "hypervision",
    ];

    const query = keywords.map((k) => `"${k}"`).join(" OR ");
    const url = `https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records?where=${encodeURIComponent(
      query
    )}&limit=100&order_by=-dateparution`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const results = data.results || [];

        // Récupérer tous les départements uniques
        const deps = new Set();
        results.forEach((f) => {
          f.code_departement?.forEach((d) => deps.add(d));
        });

        setAvailableDepartments(Array.from(deps).sort());
        setTenderOffers(results);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API BOAMP:", err);
        setLoading(false);
      });
  }, []);

  function addFavorite(tenderOffer) {
    const ref = doc(db, "tenderOffers", tenderOffer.idweb);
    setDoc(ref, {
      ...tenderOffer,
      savedAt: serverTimestamp(),
    })
      .then(() => console.log("Favori sauvegardé !"))
      .catch((err) => console.error("Erreur sauvegarde :", err));
  }

  // Appliquer le filtre
  const filteredOffers = tenderOffers.filter((f) => {
    if (selectedDepartments.length === 0) return true;
    return f.code_departement?.some((d) => selectedDepartments.includes(d));
  });

  function toggleDepartment(dep) {
    setSelectedDepartments((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  }

  return (
    <div className={styles.aoContainer}>
      <h1>Appels d’offres (BOAMP)</h1>

      <Link to="/tender-offers-favorites" className={styles.favLink}>
        Favoris
      </Link>

      <br />
      <h3>Filtrer par département</h3>
      {/* Filtres départements */}
      <div className={styles.filters}>
        <div className={styles.deps}>
          {availableDepartments.map((dep) => (
            <label key={dep} className={styles.depLabel}>
              <input
                type="checkbox"
                checked={selectedDepartments.includes(dep)}
                onChange={() => toggleDepartment(dep)}
              />
              {dep}
            </label>
          ))}
        </div>
      </div>

      {loading && <p>Chargement…</p>}
      {!loading && filteredOffers.length === 0 && (
        <p>Aucun résultat pour ce filtre.</p>
      )}

      <div className={styles.listing}>
        {filteredOffers.map((f, i) => (
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
