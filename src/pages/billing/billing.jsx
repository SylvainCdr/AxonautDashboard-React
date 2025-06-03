import styles from "./style.module.scss";
import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { format, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { Link } from "react-router-dom";

export default function Billing() {
  const [monthlyBilling, setMonthlyBilling] = useState({});
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const currentDate = new Date();

  useEffect(() => {
    const fetchPlansGroupedByMonth = async () => {
      try {
        const snapshot = await getDocs(collection(db, "billingPlans"));
        const monthlyData = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const { projectTitle, quotationId, steps } = data;

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
        const keys = Object.entries(monthlyData).sort(
          ([, a], [, b]) => b.dateSample - a.dateSample
        );
        if (keys.length > 0) setSelectedMonthKey(keys[0][0]);
      } catch (err) {
        console.error("Erreur chargement plans mensuels :", err);
      }
    };

    fetchPlansGroupedByMonth();
  }, []);

  const handleToggleInvoiced = async (docId, stepIndex, currentValue) => {
    try {
      const planRef = doc(db, "billingPlans", docId);
      const planSnap = await getDocs(collection(db, "billingPlans"));
      const planDoc = planSnap.docs.find((d) => d.id === docId);
      const planData = planDoc.data();

      planData.steps[stepIndex].invoiced = !currentValue;
      await updateDoc(planRef, { steps: planData.steps });

      const updated = { ...monthlyBilling };
      Object.keys(updated).forEach((monthKey) => {
        updated[monthKey].items = updated[monthKey].items.map((item) => {
          if (item.docId === docId && item.stepIndex === stepIndex) {
            item.invoiced = !currentValue;
          }
          return item;
        });

        updated[monthKey].total = updated[monthKey].items.reduce(
          (sum, item) =>
            !item.invoiced ? sum + item.amount + item.revision : sum,
          0
        );
      });

      setMonthlyBilling(updated);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
    }
  };

  const sortedMonths = Object.entries(monthlyBilling).sort(
    ([, a], [, b]) => b.dateSample - a.dateSample
  );

  return (
    <div className={styles.billingContainer}>
      <h1>Facturation</h1>
      <div className={styles.twoColumns}>
        <aside className={styles.monthSidebar}>
          <h3>Mois</h3>
          {sortedMonths.map(([month, data]) => {
            const isCurrentMonth = isSameMonth(data.dateSample, currentDate);
            const isSelected = selectedMonthKey === month;

            return (
              <div
                key={month}
                className={`${styles.monthItem} ${
                  isCurrentMonth ? styles.currentMonth : ""
                } ${isSelected ? styles.selectedMonth : ""}`}
                onClick={() => setSelectedMonthKey(month)}
              >
                🗓 {month.charAt(0).toUpperCase() + month.slice(1)} <br /> <br />{" "}
                {data.total.toFixed(2)} €
              </div>
            );
          })}
        </aside>

        <main className={styles.monthDetails}>
          {selectedMonthKey && monthlyBilling[selectedMonthKey] ? (
            <>
              <h3>Détails : {selectedMonthKey}</h3>

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
                      }}
                    >
                      Reste à facturer
                    </h4>
                    <table className={styles.billingTable}>
                      <thead>
                        <tr>
                          <th>Commande</th>
                          <th>Étape</th>
                          <th>Commentaire</th>
                          <th>Date</th>
                          <th>Montant (€)</th>
                          <th>Facturé ?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toBeInvoiced.map((item, idx) => (
                          <tr key={`toBeInvoiced-${idx}`}>
                            <td>
                              <Link
                                to={`/quotation/${item.quotationId}/billing-plan`}
                                className={styles.projectLink}
                              >
                                {item.title}
                              </Link>
                            </td>
                            <td>
  {item.stepIndex + 1}/{item.totalSteps}
</td>

                            <td>{item.stepsComment}</td>
                            <td>
                              {format(item.date, "dd MMM yyyy", { locale: fr })}
                            </td>
                            <td>
                              {(item.amount + item.revision).toFixed(2)} €
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
                            {toBeInvoiced
                              .reduce(
                                (sum, item) =>
                                  sum + item.amount + item.revision,
                                0
                              )
                              .toFixed(2)}{" "}
                            €
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
                      }}
                    >
                      Déjà facturé
                    </h4>
                    <table className={styles.billingTable}>
                      <thead>
                        <tr>
                          <th>Projet</th>
                          <th>Commentaire</th>
                          <th>Date</th>
                          <th>Montant (€)</th>
                          <th>Facturé ?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alreadyInvoiced.map((item, idx) => (
                          <tr key={`alreadyInvoiced-${idx}`}>
                            <td>
                              <Link
                                to={`/quotation/${item.quotationId}/billing-plan`}
                                className={styles.projectLink}
                              >
                                {item.title}
                              </Link>
                            </td>
                            <td>{item.stepsComment}</td>
                            <td>
                              {format(item.date, "dd MMM yyyy", { locale: fr })}
                            </td>
                            <td>
                              {(item.amount + item.revision).toFixed(2)} €
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
                            {alreadyInvoiced
                              .reduce(
                                (sum, item) =>
                                  sum + item.amount + item.revision,
                                0
                              )
                              .toFixed(2)}{" "}
                            €
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
