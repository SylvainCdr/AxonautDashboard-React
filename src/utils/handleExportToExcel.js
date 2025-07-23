import * as XLSX from "xlsx";

export const handleExportToExcel = () => {
  const rows = [];

  Object.entries(monthlyBilling).forEach(([monthKey, monthData]) => {
    if (
      (!selectedMonth || selectedMonth === monthKey) &&
      (!selectedYear ||
        monthData.dateSample.getFullYear().toString() === selectedYear)
    ) {
      monthData.items.forEach((item) => {
        rows.push({
          Mois: monthKey,
          Projet: item.title,
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plan de facturation");

  XLSX.writeFile(workbook, `facturation-${selectedYear || "toutes"}.xlsx`);
};
