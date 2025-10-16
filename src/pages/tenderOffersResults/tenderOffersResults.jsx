import { useEffect, useState } from "react";
import styles from "./style.module.scss";

export default function TenderOffersResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [attributorsStats, setAttributorsStats] = useState([]);
  const [source, setSource] = useState("pixecurity");

  const sourcesConfig = {
    pixecurity: {
      label: "Pixecurity",
      keywords: [
        "sûreté",
        "vidéoprotection",
        "vidéosurveillance",
        "hypervision",
        "contrôle d'accès",
      ],
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
        "interphonie",
        "contrôle d'accès",
        "GTB",
        "GTC",
        "intelligence artificielle",
      ],
    },
  };

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      setResults([]);
      setAttributorsStats([]);
      setProgress(0);

      const config = sourcesConfig[source];
      const query = config.keywords.map((k) => `"${k}"`).join(" OR ");

      // 🗓️ Filtrage sur l’année 2025 (champ dateparution)
      const dateFilter = `dateparution >= '2024-01-01' AND dateparution <= '2025-12-31'`;

      const where = `(${query}) AND (${dateFilter})`;
      const limit = 100;
      let offset = 0;
      let allResults = [];
      let hasMore = true;

      try {
        while (hasMore) {
          const url = `https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records?where=${encodeURIComponent(
            where
          )}&limit=${limit}&offset=${offset}&order_by=-dateparution`;

          const res = await fetch(url);
          const data = await res.json();
          const pageResults = data.results || [];

          allResults = [...allResults, ...pageResults];
          setProgress(allResults.length);

          console.log(`📦 Page ${offset / limit + 1}: ${pageResults.length} résultats`);

          hasMore = pageResults.length === limit;
          offset += limit;
        }

        // 🧠 Filtrage ATTRIBUTION / RESULTAT
        const filtered = allResults.filter((r) => {
          const nature = r.nature?.toUpperCase() || "";
          const typeavis = r.typeavis?.toUpperCase() || "";
          const facette = (r.type_avis_facette || []).join(" ").toUpperCase();

          return (
            nature.includes("ATTRIBUTION") ||
            typeavis.includes("ATTRIBUTION") ||
            facette.includes("RESULTAT") ||
            facette.includes("ATTRIBUTION")
          );
        });

        // 🧠 Filtrage des marchés réellement liés à nos mots-clés
        const lowerKeywords = config.keywords.map((k) => k.toLowerCase());
        const semanticFiltered = filtered.filter((r) => {
          const texte = [
            r.objet,
            r.descripteur,
            r.description,
            r.titre,
            r.resume,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return lowerKeywords.some((k) => texte.includes(k));
        });

        console.log("📊 Total marchés attribués (filtrés) :", semanticFiltered.length);

        // 🏆 Statistiques par attributaire
        const statsMap = {};
        semanticFiltered.forEach((r) => {
          const attributaires = r.titulaire || r.nom_entreprise_attributaire || [];
          if (Array.isArray(attributaires)) {
            attributaires.forEach((a) => {
              const name = a.nom || a || "Non renseigné";
              statsMap[name] = (statsMap[name] || 0) + 1;
            });
          } else if (typeof attributaires === "string") {
            statsMap[attributaires] = (statsMap[attributaires] || 0) + 1;
          }
        });

        const total = semanticFiltered.length;
        const statsWithPercent = Object.entries(statsMap)
          .map(([name, count]) => ({
            name,
            count,
            percent: ((count / total) * 100).toFixed(1),
          }))
          .sort((a, b) => b.count - a.count);

        setResults(semanticFiltered);
        setAttributorsStats(statsWithPercent);
      } catch (err) {
        console.error("Erreur API :", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [source]);

  // 🔍 Extraction fiable des attributaires
  const extractAttributors = (r) => {
    const attributaires = [];

    if (Array.isArray(r.titulaire)) {
      attributaires.push(...r.titulaire);
    } else if (typeof r.titulaire === "string") {
      attributaires.push(r.titulaire);
    } else if (r.nom_entreprise_attributaire) {
      attributaires.push(r.nom_entreprise_attributaire);
    }

    if (r.donnees) {
      try {
        const parsed = JSON.parse(r.donnees);
        const titulaire = parsed?.ATTRIBUTION?.DECISION?.TITULAIRE;
        if (titulaire?.DENOMINATION) {
          const nomComplet = [
            titulaire.DENOMINATION,
            titulaire.VILLE,
            titulaire.CP,
          ]
            .filter(Boolean)
            .join(" ");
          attributaires.push(nomComplet);
        }
      } catch {}
    }

    return [...new Set(attributaires)].filter(Boolean);
  };

  return (
    <div className={styles.aoContainer}>
      <h1>Analyse Résultats des Appels d'Offres (BOAMP)</h1>

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

      {loading && <p>Chargement… ({progress} résultats)</p>}
      {!loading && results.length === 0 && (
        <p>Aucun résultat trouvé pour cette source.</p>
      )}

      {!loading && (
        <>
          <h3>🏆 Répartition des attributaires</h3>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Nombre de marchés gagnés</th>
                <th>Part (%)</th>
              </tr>
            </thead>
            <tbody>
              {attributorsStats.map((a, i) => (
                <tr key={i}>
                  <td>{a.name}</td>
                  <td>{a.count}</td>
                  <td>{a.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>📋 Détails des marchés</h3>
          <div className={styles.listing}>
            {results.map((f, i) => {
              const attributaires = extractAttributors(f).join(", ") || "Non renseigné";
              return (
                <div key={i} className={styles.card}>
                  <h3>{f.objet}</h3>
                  <p><strong>Acheteur :</strong> {f.nomacheteur}</p>
                  <p><strong>Attribué à :</strong> {attributaires}</p>
                  <p><strong>Date :</strong> {f.dateparution}</p>
                  <a href={f.url_avis} target="_blank" rel="noreferrer">
                    Voir l’avis
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
