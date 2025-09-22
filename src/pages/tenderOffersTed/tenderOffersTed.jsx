import { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { db } from "../../firebase/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

/**
 * Extract possible French department codes from a TED notice.
 * We try postal codes in buyer address / placesOfPerformance etc.
 */
function postalCodeToDepts(postal) {
  if (!postal) return [];
  const codes = new Set();

  // find 5-digit sequences
  const matches = postal.match(/\d{5}/g);
  if (matches) {
    matches.forEach((pc) => {
      if (pc.startsWith("20")) {
        // Corsica -> map to both 2A/2B for safety
        codes.add("2A");
        codes.add("2B");
      } else {
        codes.add(pc.slice(0, 2));
      }
    });
  } else {
    // maybe user passed something shorter (e.g. "75" or "75001")
    const m2 = postal.match(/\d{2,3}/);
    if (m2) {
      const val = m2[0];
      if (val.length === 2) codes.add(val);
      else if (val.length >= 3) codes.add(val.slice(0, 2));
    }
  }

  return Array.from(codes);
}

function extractDepartmentsFromTed(n) {
  const deps = new Set();

  // buyer address postal codes
  const buyerPostal =
    n.buyer?.address?.postalCode ||
    n.buyer?.postCode ||
    n.buyerAddress?.postalCode ||
    (n.buyers && n.buyers[0]?.address?.postalCode) ||
    null;
  if (buyerPostal) {
    postalCodeToDepts(String(buyerPostal)).forEach((d) => deps.add(d));
  }

  // places of performance or delivery
  if (n.placesOfPerformance && Array.isArray(n.placesOfPerformance)) {
    n.placesOfPerformance.forEach((p) => {
      const pc =
        p?.address?.postalCode || p?.postalCode || p?.postCode || p?.postal;
      if (pc) postalCodeToDepts(String(pc)).forEach((d) => deps.add(d));
    });
  }

  // sometimes postal codes are embedded in description text
  const textCandidates = [
    n.title?.text,
    n.description?.text,
    n.summary,
    n.noticeText,
  ]
    .filter(Boolean)
    .join(" ");

  if (textCandidates) {
    const found = textCandidates.match(/\b\d{5}\b/g);
    if (found) {
      found.forEach((pc) => postalCodeToDepts(pc).forEach((d) => deps.add(d)));
    }
  }

  return Array.from(deps);
}

/** Map a TED notice item to a BOAMP-like object used by your UI */
function mapTedToBoamp(n) {
  const depts = extractDepartmentsFromTed(n);
  return {
    idweb: n.noticeId || n.id || n.businessId || (n._id || ""),
    objet:
      (n.title && (n.title.text || (Array.isArray(n.title) && n.title[0]?.text))) ||
      (n.description && (n.description.text || n.description)) ||
      "Sans titre",
    nomacheteur:
      n.buyer?.name ||
      (n.buyers && n.buyers[0]?.name) ||
      (n.organisation && n.organisation.name) ||
      "N/A",
    dateparution: n.publicationDate || n.publicationDateTime || null,
    datelimitereponse:
      n.deadlineDate || n.tenderingDeadlineDate || n.deadline || null,
    url_avis: (n.links && (n.links.html || n.links.self)) || n.links?.url || null,
    nature_libelle: n.noticeType || n.noticeKind || n.type || "",
    code_departement: depts, // array of strings like ["54","57"] when found
    type_marche_facette: n.contractNature ? [n.contractNature] : n.procurementType ? [n.procurementType] : [],
    criteres: (n.criteria && n.criteria.map(c => c.text || c)) || [],
    raw: n,
  };
}

export default function TenderOffersTed() {
  const [tenderOffers, setTenderOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTed() {
      setLoading(true);
      setError(null);

      const keywords = ["surete", "videoprotection", "supervision", "hypervision"];
      const query = keywords.join(" OR ");

      const body = {
        query,
        page: 1,
        pageSize: 100
      };

      try {
        const res = await fetch("https://cors-anywhere.herokuapp.com/https://api.ted.europa.eu/v3/notices/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: '("surete" OR "videoprotection" OR "supervision" OR "hypervision")',
    fields: [
      "title",
      "notice-id",
      "buyer-country-sub",
      "deadline-date-lot",
      "content"
    ],
    limit: 50
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Résultats TED:", data);
    setTenderOffers(data.notices || []); // <- adapter selon la structure
  })
  .catch((err) => console.error("Erreur TED:", err));


        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`TED API ${res.status} — ${txt}`);
        }

        const json = await res.json();
        // items is the usual array, but be defensive:
        const items = json.items || json.results || [];

        // map to BOAMP-like objects:
        const mapped = items.map(mapTedToBoamp);

        // collect available departments from mapped results
        const depsSet = new Set();
        mapped.forEach((m) => {
          (m.code_departement || []).forEach((d) => depsSet.add(d));
        });

        setAvailableDepartments(Array.from(depsSet).sort());
        setTenderOffers(mapped);
        setLoading(false);
      } catch (err) {
        console.error("Erreur TED:", err);
        setError(err.message || String(err));
        setLoading(false);
      }
    }

    fetchTed();
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

  function toggleDepartment(dep) {
    setSelectedDepartments((prev) =>
      prev.includes(dep) ? prev.filter((d) => d !== dep) : [...prev, dep]
    );
  }

  const filteredOffers = tenderOffers.filter((f) => {
    if (selectedDepartments.length === 0) return true;
    return f.code_departement?.some((d) => selectedDepartments.includes(d));
  });

  return (
    <div className={styles.aoContainer}>
      <h1>Appels d’offres (TED)</h1>

      <Link to="/tender-offers-favorites" className={styles.favLink}>
        Favoris
      </Link>

      <br />
      <h3>Filtrer par département</h3>

      <div className={styles.filters}>
        <div className={styles.deps}>
          {availableDepartments.length === 0 && <div>Aucun département détecté (TED ne fournit pas toujours de codes postaux FR)</div>}
          {availableDepartments.map((dep) => (
            <div key={dep} className={styles.depItem}>
              <input
                id={`dep-${dep}`}
                type="checkbox"
                checked={selectedDepartments.includes(dep)}
                onChange={() => toggleDepartment(dep)}
              />
              <label htmlFor={`dep-${dep}`} className={styles.depLabel}>
                {dep}
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{ color: "red", margin: "1rem 0" }}>Erreur TED : {error}</div>}
      {loading && <p>Chargement…</p>}
      {!loading && filteredOffers.length === 0 && <p>Aucun résultat pour ce filtre.</p>}

      <div className={styles.listing}>
        {filteredOffers.map((f) => (
          <div key={f.idweb || f.objet} className={styles.card}>
            <div className={styles.header}>
              <h3 className={styles.title}>{f.objet}</h3>
              <span className={styles.nature}>{f.nature_libelle}</span>
            </div>

            <p className={styles.acheteur}>
              <strong>Acheteur :</strong> {f.nomacheteur}
            </p>

            {f.type_procedure && (
              <p>
                <strong>Procédure :</strong> {f.type_procedure} / {f.procedure_libelle}
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
                <strong>Parution :</strong> {f.dateparution || "N/A"}
              </span>
              <span>
                <strong>Limite réponse :</strong>{" "}
                {f.datelimitereponse ? new Date(f.datelimitereponse).toLocaleDateString() : "N/A"}
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
              <a href={f.url_avis || "#"} target="_blank" rel="noreferrer" className={styles.link}>
                Voir l’annonce
              </a>
              <button onClick={() => addFavorite(f)} className={styles.favButton}>
                ⭐ Ajouter aux favoris
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
