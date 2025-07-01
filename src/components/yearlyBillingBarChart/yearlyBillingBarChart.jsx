import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function YearlyBillingBarChart({ monthlyBilling }) {
  const currentYear = new Date().getFullYear();

  // Initialisation : tableau des 12 mois avec 0
  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(currentYear, i), "MMMM", { locale: fr })
  );

  const factured = Array(12).fill(0);
  const toBeFactured = Array(12).fill(0);

  Object.entries(monthlyBilling).forEach(([monthKey, data]) => {
    const date = data.dateSample;
    if (date.getFullYear() === currentYear) {
      const monthIndex = date.getMonth(); // 0 à 11

      data.items.forEach((item) => {
        const amount = item.amount + item.revision;
        if (item.invoiced) {
          factured[monthIndex] += amount;
        } else {
          toBeFactured[monthIndex] += amount;
        }
      });
    }
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Facturé (€)",
        data: factured,
        backgroundColor: "#4caf50",
      },
      {
        label: "À facturer (€)",
        data: toBeFactured,
        backgroundColor: "#ff9800",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value} €`,
        },
      },
    },
  };

  return (
    <div style={{ maxWidth: 800, margin: "0px auto" }}>
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Bilan annuel – {currentYear}
      </h3>
      <Bar data={chartData} options={options} />
    </div>
  );
}
