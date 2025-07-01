import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function BillingSummaryChart({ dataForMonth, monthName }) {
  let totalFactured = 0;
  let totalToBeFactured = 0;

  if (!dataForMonth) return null;

  dataForMonth.items.forEach((item) => {
    const total = item.amount + item.revision;
    if (item.invoiced) {
      totalFactured += total;
    } else {
      totalToBeFactured += total;
    }
  });

  const data = {
    labels: ["Facturé", "À facturer"],
    datasets: [
      {
        label: "Montant (€)",
        data: [totalFactured, totalToBeFactured],
        backgroundColor: ["#4caf50", "#ff9800"],
        borderWidth: 1,
      },
    ],
  };

  function formatEuro(amount) {
    return amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div style={{ maxWidth: "350px", margin: "20px auto" }}>
      <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
        Synthèse de facturation – {monthName}
      </h3>
      <Doughnut data={data} />
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <p style={{ marginBottom: "10px" }}>
          <strong>Facturé :</strong> {formatEuro(totalFactured)} €
        </p>
        <p>
          <strong>À facturer :</strong> {formatEuro(totalToBeFactured)} €
        </p>
      </div>
    </div>
  );
}
