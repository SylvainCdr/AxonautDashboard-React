import styles from "./style.module.scss";
import React, { useState, useEffect } from "react";
import { fetchOpportunities } from "../../services/api/opportunities";
import DotLoader from "react-spinners/DotLoader";
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  PieChart,
  Pie,
} from "recharts";

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null); // Mois sélectionné
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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
  // const monthlyRevenue = getMonthlyProjectedRevenue(opportunities);

  const filteredOpps = selectedUser
    ? opportunities.filter((o) => o.user_name === selectedUser)
    : opportunities;

  const monthlyRevenue = getMonthlyProjectedRevenue(filteredOpps);

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

  // Tri les années par ordre croissant (optionnel)
  const sortedYears = Object.keys(revenueByYear)
    .map(Number)
    .sort((a, b) => a - b);

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

  const users = Array.from(
    new Set(opportunities.map((o) => o.user_name).filter(Boolean))
  ).sort();

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <DotLoader color="#C60F7B" loading={loading} size={60} />
        <p>Chargement de l'analyse prévisionnelle du CA...</p>
      </div>
    );
  }

  if (error) return <p>Erreur : {error}</p>;

  const areaChartData = sortedMonthlyRevenueEntries.map(([mois, montant]) => ({
    mois,
    montant: Math.round(montant),
  }));

  return (
    <div className={styles.opportunitiesContainer}>
      <h1>Opportunités</h1>
      <h2>
        Projection du chiffre d'affaires pondéré
        {selectedUser ? ` – ${selectedUser}` : ""}
      </h2>
      <p className={styles.description}>
        Cette projection permet d’estimer le chiffre d’affaires mensuel à venir
        en fonction des opportunités en cours et de leur plan de facturation.
        Chaque étape (Commande, Études, Réception, Livraison, etc.) est pondérée
        selon le pourcentage associé dans l’opportunité, puis répartie sur la
        période correspondante (date de commande, fin estimée, ou échéance
        intermédiaire). L’objectif est de fournir une vision réaliste et
        pondérée du chiffre d’affaires attendu, en tenant compte de l’avancement
        commercial et opérationnel.
      </p>

      <div className={styles.lineChartContainer}>
        <AreaChart
          width={1200}
          height={350}
          data={areaChartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" angle={-35} textAnchor="end" height={70} />
          <YAxis />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(value)
            }
          />
          <Area
            type="monotone"
            dataKey="montant"
            stroke="#C60F7B"
            fill="#C60F7B"
            fillOpacity={0.15}
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </AreaChart>
      </div>

      <div className={styles.filterContainer}>
        <label>Filtrer par commercial(e) :</label>
        <select
          value={selectedUser || ""}
          onChange={(e) => setSelectedUser(e.target.value || null)}
        >
          <option value="">Tous</option>
          {users.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>
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
                <td>
                  <span style={{ marginRight: "0.5em" }}>
                    {openYears[year] ? "▼" : "▶"}
                  </span>
                  {year}
                </td>

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
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()} // ← bloque la propagation
          >
            <h3>
              Détails de {selectedMonth}{" "}
              {selectedUser ? ` – ${selectedUser}` : ""}
            </h3>
            <table className={styles.detailsTable}>
              <thead>
                <tr>
                  <th>Nom de l'opportunité</th>
                  <th>Commercial(e)</th>
                  <th>Date de C° estimée</th>
                  <th>Date de fin estimée</th>
                  <th>Montant initial (€)</th>
                  <th>Probabilité (%)</th>
                  <th>Total CA pondéré (€)</th>
                  <th>Plan prévi de factu</th>
                  <th>Montants par étape de factu</th>
                </tr>
              </thead>
              <tbody>
                {opportunities
                  .filter((opp) => {
                    if (opp.is_archived) return false;
                    if (selectedUser && opp.user_name !== selectedUser)
                      return false; // 👈 AJOUT
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
                    // Vérifie les anomalies de dates et applique le style
                    const isSameDate =
                      dueDate?.toDateString() === finDate?.toDateString();
                    const isDueAfterEnd =
                      dueDate &&
                      finDate &&
                      dueDate.getTime() > finDate.getTime();

                    const ligneAlerteStyle =
                      isSameDate || isDueAfterEnd
                        ? { backgroundColor: "#ffe6e6" } // rouge clair
                        : {};

                    const lignesAvecPourcentage = plan.filter(
                      (l) =>
                        /\d+%/.test(l) &&
                        !l.toLowerCase().includes("avancement")
                    );

                    const sommePourcentages = lignesAvecPourcentage
                      .map((l) => {
                        const m = l.match(/(\d+)%/);
                        return m ? parseFloat(m[1]) : 0;
                      })
                      .reduce((a, b) => a + b, 0);

                    const contientAvancement = plan.some((l) =>
                      l.toLowerCase().includes("avancement")
                    );

                    // 👉 Cas valides :
                    const planValide =
                      // Cas 1 : 100% exact sans avancement
                      (sommePourcentages === 100 && !contientAvancement) ||
                      // Cas 2 : somme < 100% avec avancement
                      (sommePourcentages < 100 && contientAvancement) ||
                      // Cas 3 : aucune ligne %, juste avancement
                      (sommePourcentages === 0 && contientAvancement);

                    // ❌ Sinon invalide
                    const planInvalide = !planValide;

                    return (
                      <React.Fragment key={oppId}>
                        <tr
                          onClick={() => toggleRow(oppId)}
                          className={styles.opportunityRow}
                          style={{ cursor: "pointer", ...ligneAlerteStyle }}
                        >
                          <td>{opp.name}</td>
                          <td>{opp.user_name}</td>
                          <td>{dueDate?.toLocaleDateString("fr-FR")}</td>
                          <td>{finDate?.toLocaleDateString("fr-FR")}</td>
                          <td>{amount.toLocaleString("fr-FR")} €</td>
                          <td>{opp.probability}%</td>
                          <td>{caPondere.toLocaleString("fr-FR")} €</td>
                          <td
                            style={
                              planInvalide ? { backgroundColor: "#fff3cd" } : {}
                            }
                            title={
                              planInvalide
                                ? `Plan invalide : pourcentage total = ${sommePourcentages}%, Avancement ${
                                    contientAvancement ? "présent" : "absent"
                                  }`
                                : undefined
                            }
                          >
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
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
