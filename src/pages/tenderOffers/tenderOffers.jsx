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
  const [source, setSource] = useState("pixecurity");
  const [offerType, setOfferType] = useState("avis"); // "avis" ou "resultats"

  const sourcesConfig = {
    pixecurity: {
      label: "Pixecurity",
      keywords: [
        "sûreté",
        "vidéoprotection",
        "vidéosurveillance",
        "supervision",
        "hypervision",
        "contrôle d'accès",
      ],
      url: (query) =>
        `https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records?where=${encodeURIComponent(
          query
        )}&limit=100&order_by=-dateparution`,
    },
    diviniti: {
      label: "Diviniti",
      keywords: [
        "hypervision",
        "supervision",
        "IA",
        "detection",
        "analytique",
        "sûreté",
        "intrusion",
        "smart city",
        "vidéoprotection",
        "vidéosurveillance",
        "géolocalisation",
        "interphonie",
        "vidéophonie",
        "contrôle d'accès",
        "GTB",
        "GTC",
        "3D",
        "IoT",
        "intelligence artificielle",
        "IA",
      ],
      url: (query) =>
        `https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records?where=${encodeURIComponent(
          query
        )}&limit=100&order_by=-dateparution`,
    },
  };

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      setTenderOffers([]);
      setAvailableDepartments([]);
      const config = sourcesConfig[source];
      const query = config.keywords.map((k) => `"${k}"`).join(" OR ");
      const url = config.url(query);

      try {
        const res = await fetch(url);
        const data = await res.json();
        const results = data.results || [];

        // Récupération des départements uniques
        const deps = new Set();
        results.forEach((f) => f.code_departement?.forEach((d) => deps.add(d)));

        setAvailableDepartments(Array.from(deps).sort());
        setTenderOffers(results);
      } catch (err) {
        console.error(`Erreur API ${config.label}:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, [source]);

  function addFavorite(tenderOffer) {
    const ref = doc(db, "tenderOffers", tenderOffer.idweb);
    setDoc(ref, {
      ...tenderOffer,
      savedAt: serverTimestamp(),
    })
      .then(() => console.log("Favori sauvegardé !"))
      .catch((err) => console.error("Erreur sauvegarde :", err));
  }

  function toggleDepartment(dep) {
    setSelectedDepartments((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  }

  // 🧠 Filtrage par type et département
  const filteredOffers = tenderOffers.filter((f) => {
    const nature = f.nature?.toUpperCase() || "";
    const typeavis = f.typeavis?.toLowerCase() || "";
    const facette = f.type_avis_facette?.join(" ").toLowerCase() || "";

    const isAvis =
      nature.includes("APPEL_OFFRE") ||
      typeavis.includes("appel") ||
      facette.includes("avis de marché");

    const isResult =
      nature.includes("ATTRIBUTION") ||
      typeavis.includes("résultat") ||
      facette.includes("résultat de marché");

    if (offerType === "avis" && !isAvis) return false;
    if (offerType === "resultats" && !isResult) return false;

    if (selectedDepartments.length === 0) return true;
    return f.code_departement?.some((d) => selectedDepartments.includes(d));
  });

  return (
    <div className={styles.aoContainer}>
      <h1>Appels d’offres</h1>

      <Link to="/tender-offers-favorites" className={styles.favLink}>
        Favoris
      </Link>

      {/* Sélecteur de source */}
      <div className={styles.sourceContainer}>
        <div className={styles.sourceToggle}>
          {Object.keys(sourcesConfig).map((key) => (
            <label key={key}>
              <input
                type="radio"
                name="source"
                value={key}
                checked={source === key}
                onChange={() => setSource(key)}
              />
              {sourcesConfig[key].label}
            </label>
          ))}
        </div>
      </div>

      {/* 🔘 Sélecteur de type d’annonce */}
      <div className={styles.typeToggle}>
        <label>
          <input
            type="radio"
            name="offerType"
            value="avis"
            checked={offerType === "avis"}
            onChange={() => setOfferType("avis")}
          />
          Avis de marché
        </label>
        <label>
          <input
            type="radio"
            name="offerType"
            value="resultats"
            checked={offerType === "resultats"}
            onChange={() => setOfferType("resultats")}
          />
          Résultats de marché
        </label>
      </div>

      <br />
      <h3>Filtrer par département</h3>
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
              <span className={styles.nature}>
                {f.nature === "APPEL_OFFRE"
                  ? "🟢 Avis de marché"
                  : f.nature === "ATTRIBUTION"
                  ? "🔵 Résultat de marché"
                  : f.nature_libelle}
              </span>
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
