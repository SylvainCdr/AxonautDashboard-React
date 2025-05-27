import styles from "./style.module.scss";
import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { format, parseISO, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { Link } from "react-router-dom";

export default function Billing() {
  const [monthlyBilling, setMonthlyBilling] = useState({});

  // Mois en cours pour highlight
  const currentDate = new Date();

  useEffect(() => {
    const fetchPlansGroupedByMonth = async () => {
      try {
        const snapshot = await getDocs(collection(db, "billingPlans"));
        const monthlyData = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          const { projectTitle, quotationId, steps } = data;

          steps.forEach((step) => {
            const stepDate = new Date(step.date);
            const monthKey = format(stepDate, "MMMM yyyy", { locale: fr }); // ex: "octobre 2025"

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                total: 0,
                items: [],
                dateSample: stepDate, // pour comparaison mois en cours
              };
            }

            monthlyData[monthKey].items.push({
              quotationId, // 🔗 important
              title: decodeHtmlEntities(projectTitle),
              date: stepDate,
              stepsComment: step.stepsComment,
              amount: step.amount,
            });

            monthlyData[monthKey].total += step.amount;
          });
        });

        setMonthlyBilling(monthlyData);
      } catch (err) {
        console.error("Erreur chargement plans mensuels :", err);
      }
    };

    fetchPlansGroupedByMonth();
  }, []);

  // Pour trier les mois dans l'ordre chronologique descendant (du plus récent au plus ancien)
  const sortedMonths = Object.entries(monthlyBilling).sort(
    ([, a], [, b]) => b.dateSample - a.dateSample
  );

  return (
    <div className={styles.billingContainer}>
      <h1>Facturation</h1>

      <section className={styles.billingByMonthSection}>
        <h3>Facturation par mois</h3>

        {sortedMonths.length === 0 ? (
          <p>Aucun plan de facturation à afficher.</p>
        ) : (
          sortedMonths.map(([month, data]) => {
            const isCurrentMonth = isSameMonth(data.dateSample, currentDate);

            return (
              <div
                key={month}
                className={`${styles.monthBlock} ${
                  isCurrentMonth ? styles.currentMonth : ""
                }`}
              >
                <h4>🗓 {month.charAt(0).toUpperCase() + month.slice(1)}</h4>
                <table className={styles.billingTable}>
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>Commentaire</th>
                      <th>Date</th>
                      <th>Montant (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={idx}>
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
  {item.revision
    ? (parseFloat(item.amount) + parseFloat(item.revision)).toFixed(2)
    : parseFloat(item.amount).toFixed(2)}
</td>

                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan="3"
                        style={{ textAlign: "right", fontWeight: "bold" }}
                      >
                        Total à facturer :
                      </td>
                      <td style={{ fontWeight: "bold" }}>
                        {data.total.toFixed(2)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
