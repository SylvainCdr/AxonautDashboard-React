import styles from "./style.module.scss";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function BillingPlanExtractModal({ onClose, billingData }) {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // ✅ Ne pas rendre le composant si billingData est absent
  if (!billingData) return null;

  const monthsByYear = {};
  Object.entries(billingData).forEach(([monthKey, data]) => {
    const year = data.dateSample.getFullYear();
    if (!monthsByYear[year]) monthsByYear[year] = [];
    monthsByYear[year].push([monthKey, data]);
  });

  const handleExportToExcel = () => {
    const rows = [];

    Object.entries(billingData).forEach(([monthKey, monthData]) => {
      if (
        (!selectedMonth || selectedMonth === monthKey) &&
        (!selectedYear ||
          monthData.dateSample.getFullYear().toString() === selectedYear)
      ) {
        monthData.items.forEach((item) => {
          rows.push({
            Mois: monthKey,
            Projet: item.title,


                // <td style={{ width: "20px", whiteSpace: "nowrap" }}>
                //               {item.stepIndex + 1}/{item.totalSteps}
                //             </td>
            Etape : item.stepIndex + 1 + "/" + item.totalSteps,
            Montant: item.amount,
            Révision: item.revision,
            Facturé: item.invoiced ? "Oui" : "Non",
            Commentaire: item.stepsComment || "",
            GénéréPar: item.generatedBy,
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturation");

    XLSX.writeFile(
      workbook,
      `export-facturation-${selectedYear || "toutes"}.xlsx`
    );
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ❌ Fermer
        </button>
        <h2>Exporter les données de facturation</h2>

        <form className={styles.extractForm}>
          <label>Année</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Toutes</option>
            {Object.keys(monthsByYear).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <label>Mois (optionnel)</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={!selectedYear}
          >
            <option value="">Tous</option>
            {(monthsByYear[selectedYear] || []).map(([monthKey]) => (
              <option key={monthKey} value={monthKey}>
                {monthKey}
              </option>
            ))}
          </select>

          <button type="button" onClick={handleExportToExcel}>
            📤 Exporter en Excel
          </button>
        </form>
      </div>
    </div>
  );
}
