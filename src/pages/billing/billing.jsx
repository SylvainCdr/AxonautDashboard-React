import styles from "./style.module.scss";
import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { format, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import BillingSummaryChart from "../../components/billingSummaryChart/billingSummaryChart";
import YearlyBillingBarChart from "../../components/yearlyBillingBarChart/yearlyBillingBarChart";

export default function Billing() {
  const [monthlyBilling, setMonthlyBilling] = useState({});
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const currentDate = new Date();
  const [openYears, setOpenYears] = useState(() => {
    const currentYear = currentDate.getFullYear();
    return { [currentYear]: true }; // année en cours ouverte par défaut
  });

  const monthRefs = useRef({}); // 👈 Pour garder une ref sur chaque mois affiché

  useEffect(() => {
    const fetchPlansGroupedByMonth = async () => {
      try {
        const snapshot = await getDocs(collection(db, "billingPlans"));
        const monthlyData = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const { projectTitle, quotationId, steps, generatedBy } = data;

          steps.forEach((step, index) => {
            const stepDate = new Date(step.date);
            const monthKey = format(stepDate, "MMMM yyyy", { locale: fr });

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                total: 0,
                items: [],
                dateSample: stepDate,
              };
            }

            const invoiced = step.invoiced || false;
            const amount =
              parseFloat(step.amount || 0) + parseFloat(step.revision || 0);

            monthlyData[monthKey].items.push({
              quotationId,
              title: decodeHtmlEntities(projectTitle),
              date: stepDate,
              stepsComment: step.stepsComment,
              amount: parseFloat(step.amount || 0),
              revision: parseFloat(step.revision || 0),
              invoiced,
              generatedBy: generatedBy || "Inconnu",
              docId: docSnap.id,
              stepIndex: index,
              totalSteps: steps.length, // ⬅️ on ajoute cette ligne
            });

            if (!invoiced) {
              monthlyData[monthKey].total += amount;
            }
          });
        });

        setMonthlyBilling(monthlyData);

        // Sélectionner le mois courant automatiquement si présent
        let currentMonthKey = null;
        for (const [key, value] of Object.entries(monthlyData)) {
          if (isSameMonth(value.dateSample, currentDate)) {
            currentMonthKey = key;
            break;
          }
        }

        if (currentMonthKey) {
          setSelectedMonthKey(currentMonthKey);
          // Après avoir défini selectedMonthKey :

          if (currentMonthKey && monthRefs.current[currentMonthKey]) {
            monthRefs.current[currentMonthKey].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        } else {
          const keys = Object.entries(monthlyData).sort(
            ([, a], [, b]) => b.dateSample - a.dateSample
          );
          if (keys.length > 0) setSelectedMonthKey(keys[0][0]);
        }
      } catch (err) {
        console.error("Erreur chargement plans mensuels :", err);
      }
    };

    fetchPlansGroupedByMonth();
  }, []);

  const handleToggleInvoiced = (docId, stepIndex, currentValue) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <p style={{ marginBottom: "10px", marginTop: "20px" }}>
            Confirmer la modification de l'état de facturation ?
          </p>
          <button
            onClick={async () => {
              try {
                const planRef = doc(db, "billingPlans", docId);
                const planSnap = await getDocs(collection(db, "billingPlans"));
                const planDoc = planSnap.docs.find((d) => d.id === docId);
                const planData = planDoc.data();

                planData.steps[stepIndex].invoiced = !currentValue;
                await updateDoc(planRef, { steps: planData.steps });

                const updated = { ...monthlyBilling };
                Object.keys(updated).forEach((monthKey) => {
                  updated[monthKey].items = updated[monthKey].items.map(
                    (item) => {
                      if (
                        item.docId === docId &&
                        item.stepIndex === stepIndex
                      ) {
                        item.invoiced = !currentValue;
                      }
                      return item;
                    }
                  );

                  updated[monthKey].total = updated[monthKey].items.reduce(
                    (sum, item) =>
                      !item.invoiced ? sum + item.amount + item.revision : sum,
                    0
                  );
                });

                setMonthlyBilling(updated);
                toast.success("Mise à jour réussie !");
                closeToast();
              } catch (error) {
                console.error("Erreur lors de la mise à jour :", error);
                toast.error("Erreur lors de la mise à jour");
              }
            }}
            style={{ marginBottom: "10px" }}
          >
            ✅ Confirmer
          </button>
          <button onClick={closeToast}>❌ Annuler</button>
        </div>
      ),
      { autoClose: false }
    );
  };

  const sortedMonths = Object.entries(monthlyBilling).sort(
    ([, a], [, b]) => b.dateSample - a.dateSample
  );

  function formatEuro(amount) {
    return amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // fonction pour checker la date et si = jour actuelle ou depassé alors cellule en orange
  function isDatePastOrToday(date) {
    const today = new Date();
    return (
      date.getFullYear() < today.getFullYear() ||
      (date.getFullYear() === today.getFullYear() &&
        (date.getMonth() < today.getMonth() ||
          (date.getMonth() === today.getMonth() &&
            date.getDate() <= today.getDate())))
    );
  }

  // Calculer le total à facturer et déjà facturé par année disponible
  const yearlyTotals = {};

  Object.values(monthlyBilling).forEach((month) => {
    const year = month.dateSample.getFullYear();
    if (!yearlyTotals[year]) {
      yearlyTotals[year] = { toBeInvoiced: 0, alreadyInvoiced: 0 };
    }
    month.items.forEach((item) => {
      const amount = item.amount + item.revision;
      if (item.invoiced) {
        yearlyTotals[year].alreadyInvoiced += amount;
      } else {
        yearlyTotals[year].toBeInvoiced += amount;
      }
    });
  });

  console.log("Totaux par année :", yearlyTotals);
  const selectedYear =
    selectedMonthKey &&
    monthlyBilling[selectedMonthKey]?.dateSample?.getFullYear();

  const monthsByYear = {};

  sortedMonths.forEach(([monthKey, data]) => {
    const year = data.dateSample.getFullYear();
    if (!monthsByYear[year]) {
      monthsByYear[year] = [];
    }
    monthsByYear[year].push([monthKey, data]);
  });

  const toggleYear = (year) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  return (
    <div className={styles.billingContainer}>
      <h1>Plan de Facturation - {selectedMonthKey} </h1>
      <div className={styles.twoColumns}>
        <aside className={styles.monthSidebar}>
          <h3>Mois</h3>

          {Object.entries(monthsByYear)
            .sort((a, b) => b[0] - a[0]) // années décroissantes
            .map(([year, months]) => {
              const isOpen = openYears[year];

              return (
                <div key={year}>
                  <div
                    onClick={() => toggleYear(year)}
                    className={styles.yearHeader}
                    style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      padding: "8px 0",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {isOpen ? "▼" : "▶"} {year}
                  </div>

                  {isOpen &&
                    months.map(([month, data]) => {
                      const isCurrentMonth = isSameMonth(
                        data.dateSample,
                        currentDate
                      );
                      const isSelected = selectedMonthKey === month;

                      return (
                        <div
                          key={month}
                          ref={(el) => {
                            if (el) monthRefs.current[month] = el;
                          }}
                          className={`${styles.monthItem} ${
                            isCurrentMonth ? styles.currentMonth : ""
                          } ${isSelected ? styles.selectedMonth : ""}`}
                          onClick={() => setSelectedMonthKey(month)}
                        >
                          <strong>
                            🗓 {month.charAt(0).toUpperCase() + month.slice(1)}
                          </strong>
                          <br />
                          <br />
                          {formatEuro(data.total)} €
                        </div>
                      );
                    })}
                </div>
              );
            })}
        </aside>

        <main className={styles.monthDetails}>
          <div className={styles.charts}>
            <div className={styles.chart1}>
              {/* Affichage des totaux par année (facturation à venir et déjà facturée) : */}
              {selectedYear && yearlyTotals[selectedYear] && (
                <div className={styles.yearlyTotals}>
                  <h3>Total {selectedYear}</h3>
                  <p>
                    <span style={{ color: "#00ab39" }}>
                      Déjà facturé :{" "}
                      {formatEuro(yearlyTotals[selectedYear].alreadyInvoiced)} €
                    </span>
                    <br />
                    <span style={{ color: "#ff5a3d" }}>
                      À facturer :{" "}
                      {formatEuro(yearlyTotals[selectedYear].toBeInvoiced)} €
                    </span>
                  </p>
                </div>
              )}
              {selectedMonthKey && (
                <BillingSummaryChart
                  dataForMonth={monthlyBilling[selectedMonthKey]}
                  monthName={selectedMonthKey}
                />
              )}
            </div>

            <div className={styles.chart2}>
              <YearlyBillingBarChart monthlyBilling={monthlyBilling} />
            </div>
          </div>
          {selectedMonthKey && monthlyBilling[selectedMonthKey] ? (
            <>
              <h3>Détails</h3>

              {/* Filtrage */}
              {(() => {
                const allItems = monthlyBilling[selectedMonthKey].items;
                const toBeInvoiced = allItems.filter((item) => !item.invoiced);
                const alreadyInvoiced = allItems.filter(
                  (item) => item.invoiced
                );

                return (
                  <>
                    {/* Tableau Reste à facturer */}
                    <h4
                      style={{
                        marginTop: "2rem",
                        backgroundColor: "#ff5a3d",
                        color: "white",
                        textAlign: "center",
                        textTransform: "uppercase",
                      }}
                    >
                      Reste à facturer
                    </h4>
                    <table className={styles.billingTable}>
                      <thead>
                        <tr>
                          <th style={{ width: "80px", whiteSpace: "nowrap" }}>
                            Affaire
                          </th>
                          <th style={{ width: "20px", whiteSpace: "nowrap" }}>
                            Étape
                          </th>
                          <th>Commentaire</th>
                          <th> Etabli par </th>
                          <th>Date</th>
                          <th style={{ width: "45px", whiteSpace: "nowrap" }}>
                            Montant(€)
                          </th>
                          <th>Facturé?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toBeInvoiced.map((item, idx) => (
                          <tr key={`toBeInvoiced-${idx}`}>
                            <td style={{ width: "80px", whiteSpace: "nowrap" }}>
                              <Link
                                to={`/quotation/${item.quotationId}/billing-plan`}
                                className={styles.projectLink}
                              >
                                {item.title.length > 50
                                  ? item.title.slice(0, 50) + "..."
                                  : item.title}
                              </Link>
                            </td>
                            <td style={{ width: "20px", whiteSpace: "nowrap" }}>
                              {item.stepIndex + 1}/{item.totalSteps}
                            </td>

                            <td>{item.stepsComment}</td>

                            <td>{item.generatedBy.split(".")[0]}</td>

                            <td>
                              <span
                                className={
                                  isDatePastOrToday(item.date)
                                    ? styles.pastDate
                                    : ""
                                }
                              >
                                {new Date(item.date).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                  }
                                )}
                              </span>
                            </td>
                            <td style={{ width: "45px", whiteSpace: "nowrap" }}>
                              {formatEuro(item.amount + item.revision)}
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={item.invoiced}
                                onChange={() =>
                                  handleToggleInvoiced(
                                    item.docId,
                                    item.stepIndex,
                                    item.invoiced
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan="4"
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            Total à facturer :
                          </td>
                          <td style={{ fontWeight: "bold" }}>
                            {formatEuro(
                              toBeInvoiced.reduce(
                                (sum, item) =>
                                  sum + item.amount + item.revision,
                                0
                              )
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Tableau Déjà facturé */}
                    <h4
                      style={{
                        marginTop: "2rem",
                        backgroundColor: "#00ab39",
                        color: "white",
                        textAlign: "center",
                        textTransform: "uppercase",
                      }}
                    >
                      Déjà facturé
                    </h4>
                    <table className={styles.billingTable}>
                      <thead>
                        <tr>
                          <th style={{ width: "80px", whiteSpace: "nowrap" }}>
                            Affaire
                          </th>
                          <th style={{ width: "20px", whiteSpace: "nowrap" }}>
                            Étape
                          </th>
                          <th>Commentaire</th>
                          <th> Etabli par </th>
                          <th>Date</th>
                          <th style={{ width: "45px", whiteSpace: "nowrap" }}>
                            Montant (€)
                          </th>
                          <th>Facturé ?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alreadyInvoiced.map((item, idx) => (
                          <tr key={`alreadyInvoiced-${idx}`}>
                            <td style={{ width: "80px", whiteSpace: "nowrap" }}>
                              <Link
                                to={`/quotation/${item.quotationId}/billing-plan`}
                                className={styles.projectLink}
                              >
                                {item.title.length > 50
                                  ? item.title.slice(0, 50) + "..."
                                  : item.title}
                              </Link>
                            </td>
                            <td style={{ width: "20px", whiteSpace: "nowrap" }}>
                              {item.stepIndex + 1}/{item.totalSteps}
                            </td>
                            <td>{item.stepsComment}</td>
                            <td>{item.generatedBy.split(".")[0]}</td>
                            <td>
                              {new Date(item.date).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              })}
                            </td>
                            <td style={{ width: "45px", whiteSpace: "nowrap" }}>
                              {formatEuro(item.amount + item.revision)}
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={item.invoiced}
                                onChange={() =>
                                  handleToggleInvoiced(
                                    item.docId,
                                    item.stepIndex,
                                    item.invoiced
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan="4"
                            style={{ textAlign: "right", fontWeight: "bold" }}
                          >
                            Total déjà facturé :
                          </td>
                          <td style={{ fontWeight: "bold" }}>
                            {formatEuro(
                              alreadyInvoiced.reduce(
                                (sum, item) =>
                                  sum + item.amount + item.revision,
                                0
                              )
                            )}{" "}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                );
              })()}
            </>
          ) : (
            <p>Sélectionne un mois pour voir les détails.</p>
          )}
        </main>
      </div>
    </div>
  );
}
