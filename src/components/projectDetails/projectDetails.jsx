import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProjectById } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchExpensesByProject } from "../../services/api/expenses";
// import {
//   fetchDeliveryNotesByProject,
//   downloadDeliveryNote,
// } from "../../services/deliveryNotes";
import styles from "./style.module.scss";
import { GridLoader } from "react-spinners";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import GaugeChart from "react-gauge-chart";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expandedExpenses, setExpandedExpenses] = useState({}); // Suivre l'état déployé des dépenses
  // const [deliveryNotes, setDeliveryNotes] = useState([]);
  // const [expandedNotes, setExpandedNotes] = useState({}); // Pour gérer les BL déroulés

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        const companyData = await fetchCompanyById(projectData.company_id);
        const expensesData = await fetchExpensesByProject(
          projectData.estimated_start,
          projectData.estimated_end,
          projectId
        );
        // const deliveryNotesData = await fetchDeliveryNotesByProject(projectId);
        // console.log(
        //   "Données brutes des bons de livraison :",
        //   deliveryNotesData
        // );
        // setDeliveryNotes(deliveryNotesData);

        setProject(projectData);
        setCompany(companyData);
        setExpenses(expensesData);
        // setDeliveryNotes(deliveryNotesData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données du projet.");
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  
  // Calcul de la marge réelle
  const margeReelle = (project.actual_revenue - project.actual_expenses_cost) / project.actual_revenue;



  // console.log ("Dépenses du projet :", expenses);
  // console.log ("Bons de livraison du projet :", deliveryNotes);

  // Fonction pour télécharger un bon de livraison, on transforme le base64 en Blob puis on crée un lien pour le télécharger
  const handleDownloadDeliveryNote = async (deliveryNoteId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/downloadDeliveryNote?deliveryNoteId=${deliveryNoteId}`
      );
      const data = await response.json();
      const base64PDF = data.deliveryNote;

      // Convert base64 to Blob
      const byteCharacters = atob(base64PDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create a link to download the PDF
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `delivery_note_${deliveryNoteId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error downloading the delivery note:", err);
    }
  };

  // Fonction pour déployer ou réduire les détails d'une dépense
  const toggleExpense = (expenseId) => {
    setExpandedExpenses((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };

  // Préparation des données pour le graphique
  const difference =
    project.estimated_revenue - project.actual_expenses_cost || 0;

  const chartData = [
    { name: "Revenu estimé", estimatedRevenue: project.estimated_revenue },
    { name: "Revenu actuel", actualRevenue: project.actual_revenue },
    {
      name: "Dépenses actuelles",
      actualExpenses: project.actual_expenses_cost,
    },
    { name: "Différence (Revenu - Dépenses)", difference },
  ];

  // Calcul des totaux pour les dépenses TTC
  const totalExpensesTTC = expenses.reduce(
    (acc, expense) => acc + expense.total_amount,
    0
  );
  const totalLeftToPayTTC = expenses.reduce(
    (acc, expense) => acc + expense.left_to_pay,
    0
  );

  // Calcul du pourcentage restant à payer
  const percentageLeftToPay = totalExpensesTTC
    ? (totalLeftToPayTTC / totalExpensesTTC) * 100
    : 0;

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.projectContainer}>
      <h1>Détails du projet - {project.number}</h1>

      <div className={styles.header}>
        <div className={styles.section1}>
          {/* <p>
            <strong>Id :</strong> {project.id}
          </p>
          <p>
            <strong>Numéro :</strong> {project.number}
          </p>
          <p>
            <strong>Nom :</strong> {project.name}
          </p> */}
          <p>
            <strong>Date de début estimé : </strong>
            {new Date(project.estimated_start).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de fin estimé : </strong>{" "}
            {new Date(project.estimated_end).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de début réelle : </strong>{" "}
            {new Date(project.actual_start).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de fin réelle : </strong>{" "}
            {new Date(project.actual_end).toLocaleDateString()}
          </p>
          <p>
            <strong>Entreprise :</strong>{" "}
            {company.name || "Entreprise inconnue"}
          </p>
          <p>
            <strong>Adresse :</strong> {company.address_street}
          </p>

          <p>
            <strong>Ville :</strong> {company.address_city} {company.zip_code} (
            {company.address_country})
          </p>
          <p>
            <strong>Commercial en charge :</strong>{" "}
            {company.business_manager?.name || "Inconnu"}
          </p>
        </div>
        <div className={styles.section2}>

          
        <h3>
            <strong>Montant total HT:</strong> {project.actual_revenue.toFixed(2)} €
          </h3>
          <h3>
            <strong>Total des dépenses  :</strong>  {project.actual_expenses_cost.toFixed(2)} €
          </h3>
          <h3>
            <strong>Marge nette  :</strong>  {(project.actual_revenue - project.actual_expenses_cost).toFixed(2)} €
          </h3>

          <h3>
            {" "}
            <strong>Marge (%) </strong>
          </h3>
          
            {/* Jauge représentant la marge réelle */}
            <GaugeChart
            id="margin-gauge"
            nrOfLevels={5}
            percent={margeReelle}
            arcsLength={[0.15, 0.10, 0.30, 0.45 ]} // Définir les longueurs des arcs
            colors={['#EA4228', '#F5CD19',  '#5BE12C', '#109f30' ]} // Couleurs des arcs
            textColor="#000"
            needleColor="#4520ff"
            arcPadding={0.02}
          />
        </div>
      </div>

      {/* Section Graphique */}
      <div className={styles.graphContainer}>
        <h2>Graphique des coûts et revenus</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="estimatedRevenue" fill="#4682B4" />
            <Bar dataKey="actualRevenue" fill="#2E8B57" />
            <Bar dataKey="actualExpenses" fill="#FF69B4" />
            <Bar dataKey="difference" fill="#FFD700" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.expensesContainer}>
        <h1>Dépenses</h1>

        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Date</th>
              <th>Montant HT</th>
              <th>Montant TTC</th>
              <th>Reste à payer TTC</th>
              <th>Nom comptable</th>
              <th>Fournisseur</th>
              <th>Projet</th>
              <th>Détails</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((expense) => (
              <React.Fragment key={expense.id}>
                {/* Ligne principale */}
                <tr onClick={() => toggleExpense(expense.id)}>
                  <td>
                    <span>+</span>
                    {expense.title}
                  </td>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>{expense.pre_tax_amount.toFixed(2)} €</td>
                  <td>{expense.total_amount.toFixed(2)} €</td>
                  <td>{expense.left_to_pay.toFixed(2)} €</td>
                  <td>{expense.accounting_code_name}</td>
                  <td>{expense.supplier_name}</td>
                  <td>{expense.project_id}</td>
                  <td>
                    <a
                      href={expense.public_path}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lien
                    </a>
                  </td>
                </tr>

                {/* Détails déroulants */}
                {expandedExpenses[expense.id] && (
                  <tr>
                    <td colSpan="9">
                      <table className={styles.expenseDetails}>
                        <thead>
                          <tr>
                            <th>Article</th>
                            <th>Quantité</th>
                            <th>Montant HT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expense.expense_lines.map((line, index) => (
                            <tr key={index}>
                              <td>{line.title}</td>
                              <td>{line.quantity}</td>
                              <td>{line.total_pre_tax_amount.toFixed(2)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Total des dépenses</td>
              <td>
                {expenses
                  .reduce((acc, expense) => acc + expense.pre_tax_amount, 0)
                  .toFixed(2)}{" "}
                €
              </td>
              <td>
                {expenses
                  .reduce((acc, expense) => acc + expense.total_amount, 0)
                  .toFixed(2)}{" "}
                €
              </td>
              <td>
                {expenses
                  .reduce((acc, expense) => acc + expense.left_to_pay, 0)
                  .toFixed(2)}{" "}
                €
              </td>
              {/* // jauge avec le reste des dépenses a payer */}
              {/* Jauge */}
              {/* Jauge */}
              <td colSpan="4">
                <div className={styles.gaugeContainer}>
                  <div
                    className={styles.gaugeFill}
                    style={{
                      width: `${percentageLeftToPay}%`,
                      backgroundColor:
                        percentageLeftToPay === 0 ? "green" : "red", // Vert si tout est payé, rouge sinon
                    }}
                  ></div>
                </div>
                <p>Reste à payer : {totalLeftToPayTTC.toFixed(2)} €</p>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
