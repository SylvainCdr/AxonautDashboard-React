import { useEffect, useState } from "react";
import styles from "./style.module.scss";

export default function TenderOffersResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [attributorsStats, setAttributorsStats] = useState([]);
  const [source, setSource] = useState("pixecurity");
  const [selectedAttributor, setSelectedAttributor] = useState(null);

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

  // Fonction de nettoyage de nom
  const normalizeName = (name = "") =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  function extractTenderValue(r) {
    let valeur = 0;

    // 1️⃣ Champs directs (parfois présents dans les anciens jeux BOAMP)
    if (r.montant) {
      valeur = parseFloat(r.montant.toString().replace(/\s|,/g, "")) || 0;
    }
    if (!valeur && r.montantmax) {
      valeur =
        parseFloat(r.montantmax.toString().replace(/\s|,/g, "")) || valeur;
    }
    if (!valeur && r.montantmin && r.montantmax) {
      const min = parseFloat(r.montantmin.toString().replace(/\s|,/g, ""));
      const max = parseFloat(r.montantmax.toString().replace(/\s|,/g, ""));
      if (min && max) valeur = (min + max) / 2;
    }

    // 2️⃣ Champs internes dans "donnees"
    if (!valeur && r.donnees) {
      try {
        const parsed = JSON.parse(r.donnees);

        // Cas classique BOAMP (ancienne structure)
        const titulaire = parsed?.ATTRIBUTION?.DECISION?.TITULAIRE;
        if (titulaire) {
          const raw =
            titulaire.VALEUR_OFFRE ||
            titulaire.VALUE ||
            titulaire.MONTANT ||
            titulaire["VALEUR TOTALE"] ||
            0;
          valeur = parseFloat(raw.toString().replace(/[^\d.]/g, "")) || 0;
        }

        // Cas eForms / JOUE (nouvelle structure)
        if (!valeur) {
          const eforms = parsed?.EFORMS?.ContractAwardNotice;
          const total =
            eforms?.ext?.UBLExtensions?.ext?.UBLExtension?.ext?.ExtensionContent
              ?.efext?.EformsExtension?.efac?.NoticeResult?.[
              "cbc:TotalAmount"
            ]?.["#text"];
          if (total)
            valeur = parseFloat(total.toString().replace(/[^\d.]/g, "")) || 0;
        }

        // Fallback — recherche récursive d’un champ “montant / valeur / amount”
        if (!valeur) {
          const deepSearch = (obj) => {
            if (typeof obj !== "object" || obj === null) return null;
            for (const [k, v] of Object.entries(obj)) {
              if (typeof v === "object") {
                const found = deepSearch(v);
                if (found) return found;
              } else if (
                typeof v === "string" &&
                /(\d+[.,]?\d*)/.test(v) &&
                /(montant|valeur|amount|price|total)/i.test(k)
              ) {
                return parseFloat(v.replace(/[^\d.]/g, ""));
              }
            }
            return null;
          };
          valeur = deepSearch(parsed) || valeur;
        }
      } catch (err) {
        console.warn("Erreur parsing donnees", err);
      }
    }

    return valeur;
  }

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      setResults([]);
      setAttributorsStats([]);
      setProgress(0);
      setSelectedAttributor(null);

      const config = sourcesConfig[source];
      const query = config.keywords.map((k) => `"${k}"`).join(" OR ");
      const dateFilter = `dateparution >= '2025-01-01' AND dateparution <= '2025-12-31'`;
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
          hasMore = pageResults.length === limit;
          offset += limit;
        }

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

        // Construction robuste des statistiques
        const statsMap = {};

        semanticFiltered.forEach((r) => {
          const valeur = extractTenderValue(r); // 🪄 récupération de la valeur du marché
          const names = extractAttributors(r)
            .map((n) => normalizeName(n))
            .filter((n) => n && n !== "non renseigne");

          const uniqueNames = [...new Set(names)];

          uniqueNames.forEach((cleanName) => {
            if (!statsMap[cleanName]) {
              statsMap[cleanName] = {
                count: 0,
                cumulative: 0, // ajout du cumul €
                displayName:
                  extractAttributors(r).find(
                    (n) => normalizeName(n) === cleanName
                  ) || cleanName,
              };
            }
            statsMap[cleanName].count += 1;
            statsMap[cleanName].cumulative += valeur; // cumul de la valeur trouvée
          });
        });

        semanticFiltered.forEach((r, i) => {
          console.log(`Marché ${i}:`, r);
        });

        // Transformation finale pour l’affichage
        const total = semanticFiltered.length;
        const statsWithPercent = Object.entries(statsMap)
          .map(([_, { displayName, count }]) => ({
            name: displayName,
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

  const extractAttributors = (r) => {
    const attributaires = [];
    if (Array.isArray(r.titulaire)) attributaires.push(...r.titulaire);
    else if (typeof r.titulaire === "string") attributaires.push(r.titulaire);
    else if (r.nom_entreprise_attributaire)
      attributaires.push(r.nom_entreprise_attributaire);

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

  const filteredResultsByAttributor = selectedAttributor
    ? results.filter((r) =>
        extractAttributors(r).some(
          (a) => normalizeName(a) === normalizeName(selectedAttributor)
        )
      )
    : [];

  // console log count of results
  console.log(`Total résultats affichés: ${results.length}`);

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
      {!loading && results.length === 0 && <p>Aucun résultat trouvé.</p>}

      {!loading && (
        <>
          <h3>🏆 Répartition des attributaires</h3>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Marchés gagnés</th>
                <th>Part (%)</th>
              </tr>
            </thead>
            <tbody>
              {attributorsStats.map((a, i) => (
                <tr
                  key={i}
                  onClick={() =>
                    setSelectedAttributor(
                      selectedAttributor === a.name ? null : a.name
                    )
                  }
                  className={
                    selectedAttributor === a.name ? styles.activeRow : ""
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>{a.name}</td>
                  <td>{a.count}</td>
                  <td>{a.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 🪟 MODAL affichant les résultats d’un attributaire */}
          {selectedAttributor && (
            <div
              className={styles.modalOverlay}
              onClick={() => setSelectedAttributor(null)}
            >
              <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
              >
                <h2>
                  📋 Marchés attribués à <em>{selectedAttributor}</em> (
                  {filteredResultsByAttributor.length})
                </h2>
                <div className={styles.listing}>
                  {filteredResultsByAttributor.map((f, i) => {
                    const attributaires =
                      extractAttributors(f).join(", ") || "Non renseigné";
                    return (
                      <div key={i} className={styles.card}>
                        <h3>{f.objet}</h3>
                        <p>
                          <strong>Acheteur :</strong> {f.nomacheteur}
                        </p>
                        <p>
                          <strong>Attribué à :</strong> {attributaires}
                        </p>
                        <p>
                          <strong>Date :</strong> {f.dateparution}
                        </p>
                        {f.texteintegral && (
                          <details>
                            <summary>Voir le texte intégral</summary>
                            <p>{f.texteintegral}</p>
                          </details>
                        )}
                        <a href={f.url_avis} target="_blank" rel="noreferrer">
                          Voir l’avis complet
                        </a>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSelectedAttributor(null)}
                  className={styles.closeBtn}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
