import styles from "./style.module.scss";
import React, { useState, useEffect } from "react";
import { fetchOpportunities } from "../../services/api/opportunities";

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null); // Mois sélectionné
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadOpportunities = async () => {
      setLoading(true);
      try {
        const data = await fetchOpportunities(page);
        setOpportunities((prev) => {
          const combined = [...prev, ...data];
          const unique = Array.from(
            new Map(combined.map((o) => [o.id, o])).values()
          );
          return unique;
        });
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des opportunités :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadOpportunities();
  }, [page]);

  console.log("Opportunités chargées :", opportunities);
  //count
  const totalCount = opportunities.length;
  console.log("Total d'opportunités :", totalCount);

  // Utilitaires dates
  function parseDate(dateStr) {
    if (!dateStr) return null;
    try {
      if (dateStr instanceof Date) return dateStr;
      if (typeof dateStr === "string" && dateStr.includes("/")) {
        // Format DD/MM/YYYY
        const [d, m, y] = dateStr.split("/");
        return new Date(`${y}-${m}-${d}`);
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  function formatDateToMonthYear(date) {
    if (!(date instanceof Date) || isNaN(date)) return null;
    // Ex: "janvier 2025"
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
    }).format(date);
  }

  function monthDiff(d1, d2) {
    // Retourne nombre de mois entre 2 dates (inclusif)
    const months =
      (d2.getFullYear() - d1.getFullYear()) * 12 +
      (d2.getMonth() - d1.getMonth());
    return Math.max(1, months + 1);
  }

  // Projection CA pondéré par mois
  const getMonthlyProjectedRevenue = (opps) => {
    const monthlyRevenue = {};

    const uniqueOpps = Array.from(new Map(opps.map((o) => [o.id, o])).values());

    uniqueOpps.forEach((opp) => {
      if (opp.is_archived) return;

      const amount = parseFloat(
        opp.amount?.toString().replace(/[^0-9.-]+/g, "") || 0
      );
      const probability = (opp.probability || 0) / 100;
      const caPondere = amount * probability;

      const plan = opp.custom_fields?.["Plan de facturation"] || [
        "100% - Livraison",
      ];
      const dueDate = parseDate(opp.due_date);
      const finDate =
        parseDate(opp.custom_fields?.["Date de Fin estimée"]) || dueDate;

      if (!dueDate || !finDate || finDate < new Date("2025-01-01")) return;

      // Étapes fixes
      plan.forEach((ligne) => {
        const match = ligne.match(/(\d+)%\s*-\s*([\wÀ-ÿ]+)/i);
        if (!match) return;
        const pourcentage = parseFloat(match[1]) / 100;
        const step = match[2].toLowerCase();

        if (step.includes("avancement")) return; // sauté ici

        let dateClé = null;
        if (step.includes("commande")) dateClé = dueDate;
        else if (step.includes("livraison") || step.includes("réception"))
          dateClé = finDate;
        else if (step.includes("etude") || step.includes("étude"))
          dateClé = new Date((dueDate.getTime() + finDate.getTime()) / 2);

        if (dateClé) {
          const montantPartiel = caPondere * pourcentage;
          const mois = formatDateToMonthYear(dateClé);
          monthlyRevenue[mois] = (monthlyRevenue[mois] || 0) + montantPartiel;
        }
      });

      // Cas "Avancement"
      const montantDéjàAlloué = plan
        .filter((ligne) => !ligne.toLowerCase().includes("avancement"))
        .map((ligne) => {
          const match = ligne.match(/(\d+)%/);
          return match ? parseFloat(match[1]) / 100 : 0;
        })
        .reduce((acc, val) => acc + val, 0);

      const ligneAvancement = plan.find((l) =>
        l.toLowerCase().includes("avancement")
      );
      if (ligneAvancement) {
        const pourcentageAvancement = 1 - montantDéjàAlloué;
        const montantAvancement = caPondere * pourcentageAvancement;
        const nbMois = monthDiff(dueDate, finDate);

        if (nbMois > 0 && montantAvancement > 0) {
          const partParMois = montantAvancement / nbMois;
          for (let i = 0; i < nbMois; i++) {
            const moisDate = new Date(dueDate);
            moisDate.setMonth(moisDate.getMonth() + i);
            const mois = formatDateToMonthYear(moisDate);
            monthlyRevenue[mois] = (monthlyRevenue[mois] || 0) + partParMois;
          }
        }
      }
    });

    return monthlyRevenue;
  };

  // Projection calculée
  const monthlyRevenue = getMonthlyProjectedRevenue(opportunities);

  // Gestion clic mois
  const handleMonthClick = (mois) => {
    setSelectedMonth(mois);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  // Tri des mois par date (année + mois)
  const sortedMonthlyRevenueEntries = Object.entries(monthlyRevenue).sort(
    ([moisA], [moisB]) => {
      const dateA = parseDateMonthYear(moisA);
      const dateB = parseDateMonthYear(moisB);
      return dateA - dateB;
    }
  );

  // Fonction pour parser "janvier 2025" en Date
  function parseDateMonthYear(str) {
    const [monthStr, yearStr] = str.split(" ");
    const monthsFR = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];
    const monthIndex = monthsFR.indexOf(monthStr.toLowerCase());
    if (monthIndex === -1) return new Date();
    return new Date(parseInt(yearStr, 10), monthIndex);
  }

  // Ajoute un état pour les années ouvertes
  const [openYears, setOpenYears] = useState({});

  // Transformation des données par année
  const revenueByYear = Object.entries(monthlyRevenue).reduce(
    (acc, [mois, montant]) => {
      const date = parseDateMonthYear(mois);
      const year = date.getFullYear();
      if (!acc[year]) acc[year] = { total: 0, months: {} };
      acc[year].total += montant;
      acc[year].months[mois] = montant;
      return acc;
    },
    {}
  );

  // Tri les années par ordre décroissant (optionnel)
  const sortedYears = Object.keys(revenueByYear).sort((a, b) => b - a);

  // Fonction toggle année ouverte
  const toggleYear = (year) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const [expandedRows, setExpandedRows] = useState({});
  const toggleRow = (oppId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [oppId]: !prev[oppId],
    }));
  };

  return (
    <div className={styles.opportunitiesContainer}>
      <h1>Opportunités</h1>

      <h2>Projection du chiffre d'affaires pondéré par mois</h2>
      <table className={styles.revenueTable}>
        <thead>
          <tr>
            <th>Année / Mois</th>
            <th>CA pondéré estimé (€)</th>
          </tr>
        </thead>
        <tbody>
          {sortedYears.map((year) => (
            <React.Fragment key={year}>
              <tr
                onClick={() => toggleYear(year)}
                style={{ cursor: "pointer", fontWeight: "bold" }}
                className={styles.yearRow}
              >
                <td>{year}</td>
                <td>
                  {revenueByYear[year].total.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
              </tr>

              {openYears[year] &&
                Object.entries(revenueByYear[year].months)
                  .sort(([moisA], [moisB]) => {
                    const dateA = parseDateMonthYear(moisA);
                    const dateB = parseDateMonthYear(moisB);
                    return dateA - dateB;
                  })
                  .map(([mois, montant]) => (
                    <tr
                      key={mois}
                      onClick={() => handleMonthClick(mois)}
                      style={{ cursor: "pointer" }}
                      className={styles.monthRow}
                    >
                      <td style={{ paddingLeft: "2em" }}>{mois}</td>
                      <td>
                        {montant.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                    </tr>
                  ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {showModal && selectedMonth && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Détails de {selectedMonth}</h3>
            <table className={styles.detailsTable}>
              <thead>
                <tr>
                  <th>Nom de l'opportunité</th>
                  <th>Due date</th>
                  <th>Date de fin estimée</th>
                  <th>Montant initial (€)</th>
                  <th>Probabilité (%)</th>
                  <th>CA pondéré (€)</th>
                  <th>Plan de facturation</th>
                  <th>Montants par étape de facturation</th>
                </tr>
              </thead>
              <tbody>
                {opportunities
                  .filter((opp) => {
                    if (opp.is_archived) return false;

                    const dueDate = parseDate(opp.due_date);
                    const finDate =
                      parseDate(opp.custom_fields?.["Date de Fin estimée"]) ||
                      dueDate;

                    if (!dueDate || !finDate) return false;

                    // Vérifie si l'opportunité contribue au mois sélectionné
                    // en vérifiant chaque étape dans plan
                    const plan = opp.custom_fields?.["Plan de facturation"] || [
                      "100% - Livraison",
                    ];
                    const monthStart = parseDateMonthYear(selectedMonth);
                    const monthEnd = new Date(monthStart);
                    monthEnd.setMonth(monthEnd.getMonth() + 1);

                    // Fonction qui retourne la date de chaque étape
                    const stepDates = plan
                      .filter((ligne) => {
                        const match = ligne.match(/(\d+)%\s*-\s*([\wÀ-ÿ]+)/i);
                        return (
                          match &&
                          !match[2].toLowerCase().includes("avancement")
                        );
                      })
                      .map((ligne) => {
                        const match = ligne.match(/(\d+)%\s*-\s*([\wÀ-ÿ]+)/i);
                        if (!match) return null;
                        const step = match[2].toLowerCase();

                        if (step.includes("commande")) return dueDate;
                        if (
                          step.includes("livraison") ||
                          step.includes("réception")
                        )
                          return finDate;
                        if (step.includes("etude") || step.includes("étude"))
                          return new Date(
                            (dueDate.getTime() + finDate.getTime()) / 2
                          );
                        return null;
                      })
                      .filter(Boolean);

                    // Cas avancement : réparti sur la période dueDate → finDate
                    const hasAvancement = plan.some((l) =>
                      l.toLowerCase().includes("avancement")
                    );

                    // Si étape tombe dans le mois sélectionné
                    const étapeDansLeMois = stepDates.some(
                      (d) => d >= monthStart && d < monthEnd
                    );

                    // Pour avancement on vérifie si le mois est dans l'intervalle
                    const avancementDansLeMois =
                      hasAvancement &&
                      dueDate <= monthEnd &&
                      finDate >= monthStart;

                    return étapeDansLeMois || avancementDansLeMois;
                  })
                  .map((opp) => {
                    const oppId = opp.id;
                    const amount = parseFloat(
                      opp.amount?.toString().replace(/[^0-9.-]+/g, "") || 0
                    );
                    const probability = (opp.probability || 0) / 100;
                    const caPondere = amount * probability;

                    const dueDate = parseDate(opp.due_date);
                    const finDate =
                      parseDate(opp.custom_fields?.["Date de Fin estimée"]) ||
                      dueDate;

                    const plan = opp.custom_fields?.["Plan de facturation"] || [
                      "100% - Livraison",
                    ];

                    const étapes = [];

                    const montantDéjàAlloué = plan
                      .filter((l) => !l.toLowerCase().includes("avancement"))
                      .map((l) => {
                        const m = l.match(/(\d+)%/);
                        return m ? parseFloat(m[1]) / 100 : 0;
                      })
                      .reduce((a, b) => a + b, 0);

                    plan.forEach((ligne) => {
                      const match = ligne.match(/(\d+)%\s*-\s*([\wÀ-ÿ]+)/i);
                      if (!match) return;
                      const pourcentage = parseFloat(match[1]) / 100;
                      const label = match[2];
                      let dateClé = null;

                      const step = label.toLowerCase();
                      if (step.includes("commande")) dateClé = dueDate;
                      else if (
                        step.includes("livraison") ||
                        step.includes("réception")
                      )
                        dateClé = finDate;
                      else if (step.includes("etude") || step.includes("étude"))
                        dateClé = new Date(
                          (dueDate.getTime() + finDate.getTime()) / 2
                        );

                      if (dateClé) {
                        étapes.push({
                          label,
                          mois: formatDateToMonthYear(dateClé),
                          montant: caPondere * pourcentage,
                        });
                      }
                    });

                    // Avancement réparti
                    const ligneAvancement = plan.find((l) =>
                      l.toLowerCase().includes("avancement")
                    );
                    if (ligneAvancement) {
                      const pourcentageAvancement = 1 - montantDéjàAlloué;
                      const montantAvancement =
                        caPondere * pourcentageAvancement;
                      const nbMois = monthDiff(dueDate, finDate);
                      const partParMois = montantAvancement / nbMois;

                      for (let i = 0; i < nbMois; i++) {
                        const moisDate = new Date(dueDate);
                        moisDate.setMonth(moisDate.getMonth() + i);
                        étapes.push({
                          label: "Avancement",
                          mois: formatDateToMonthYear(moisDate),
                          montant: partParMois,
                        });
                      }
                    }

                    return (
                      <React.Fragment key={oppId}>
                        <tr
                          onClick={() => toggleRow(oppId)}
                          className={styles.opportunityRow}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{opp.name}</td>
                          <td>{dueDate?.toLocaleDateString("fr-FR")}</td>
                          <td>{finDate?.toLocaleDateString("fr-FR")}</td>
                          <td>{amount.toLocaleString("fr-FR")} €</td>
                          <td>{opp.probability}%</td>
                          <td>{caPondere.toLocaleString("fr-FR")} €</td>
                          <td>
                            {plan.map((l, i) => (
                              <div key={i}>{l}</div>
                            ))}
                          </td>
                          <td>{expandedRows[oppId] ? "▼" : "▶"}</td>
                        </tr>

                        {expandedRows[oppId] && (
                          <tr className={styles.expandedRow}>
                            <td colSpan="8">
                              <table className={styles.subTable}>
                                <thead>
                                  <tr>
                                    <th>Étape</th>
                                    <th>Mois</th>
                                    <th>Montant pondéré</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {étapes.map((etape, i) => (
                                    <tr key={i}>
                                      <td>{etape.label}</td>
                                      <td>{etape.mois}</td>
                                      <td>
                                        {etape.montant.toLocaleString("fr-FR", {
                                          style: "currency",
                                          currency: "EUR",
                                        })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>

            <button className={styles.closeButton} onClick={closeModal}>
              Fermer
            </button>
          </div>
        </div>
      )}

      <h2>Liste des opportunités</h2>
      <table className={styles.opportunitiesTable}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Due date</th>
            <th>Date de fin estimée</th>
            <th>Montant (€)</th>
            <th>Probabilité (%)</th>
            <th>CA pondéré (€)</th>
            <th>Plan de facturation</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => {
            const amount = parseFloat(
              opp.amount?.toString().replace(/[^0-9.-]+/g, "") || 0
            );
            const probability = (opp.probability || 0) / 100;
            const caPondere = amount * probability;

            return (
              <tr key={opp.id}>
                <td>{opp.name}</td>
                <td>{opp.due_date || "-"}</td>
                <td>{opp.custom_fields?.["Date de Fin estimée"] || "-"}</td>
                <td>
                  {amount.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td>{(probability * 100).toFixed(0)}</td>
                <td>
                  {caPondere.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td>{opp.custom_fields?.["Plan de facturation"] || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
