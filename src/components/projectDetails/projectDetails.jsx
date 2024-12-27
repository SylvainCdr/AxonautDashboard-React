import { BarLoader } from "react-spinners";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProjectById } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchExpensesByProject } from "../../services/api/expenses";
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
  const [expandedExpenses, setExpandedExpenses] = useState({});
  const [loadExpenses, setLoadExpenses] = useState(false); // Nouvelle état pour charger les dépenses
  const [loadingExpenses, setLoadingExpenses] = useState(false); // État de chargement des dépenses
  
  const toggleExpense = (expenseId) => {
    setExpandedExpenses((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        const companyData = await fetchCompanyById(projectData.company_id);

        setProject(projectData);
        setCompany(companyData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données du projet.");
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    if (loadExpenses) {
      setLoadingExpenses(true); // Commencer le chargement des dépenses
      const loadExpensesData = async () => {
        try {
          const expensesData = await fetchExpensesByProject(
            project.estimated_start,
            project.estimated_end,
            projectId
          );
          setExpenses(expensesData);
        } catch (err) {
          console.error(err);
          setError("Erreur lors du chargement des dépenses.");
        } finally {
          setLoadingExpenses(false); // Fin du chargement
        }
      };

      loadExpensesData();
    }
  }, [loadExpenses, projectId, project.estimated_start, project.estimated_end]);

  // Calcul de la marge réelle
  const margeReelle = (project.actual_revenue - project.actual_expenses_cost) / project.actual_revenue;

  // Préparation des données pour le graphique
  const difference = project.estimated_revenue - project.actual_expenses_cost || 0;
  const chartData = [
    { name: "Montant Devis HT", estimatedRevenue: project.estimated_revenue },
    { name: "Revenu Actuel", actualRevenue: project.actual_revenue },
    { name: "Dépenses Actuelles", actualExpenses: project.actual_expenses_cost },
    { name: "Marge Nette Actuelle", difference },
  ];

  // Calcul des totaux pour les dépenses TTC
  const totalExpensesTTC = expenses.reduce((acc, expense) => acc + expense.total_amount, 0);
  const totalLeftToPayTTC = expenses.reduce((acc, expense) => acc + expense.left_to_pay, 0);

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
          <p><strong>Date de début estimé : </strong>{new Date(project.estimated_start).toLocaleDateString()}</p>
          <p><strong>Date de fin estimé : </strong>{new Date(project.estimated_end).toLocaleDateString()}</p>
          <p><strong>Date de début réelle : </strong>{new Date(project.actual_start).toLocaleDateString()}</p>
          <p><strong>Date de fin réelle : </strong>{new Date(project.actual_end).toLocaleDateString()}</p>
          <p><strong>Entreprise :</strong> {company.name || "Entreprise inconnue"}</p>
          <p><strong>Adresse :</strong> {company.address_street}</p>
          <p><strong>Ville :</strong> {company.address_city} {company.zip_code} ({company.address_country})</p>
          <p><strong>Commercial en charge :</strong> {company.business_manager?.name || "Inconnu"}</p>
        </div>
        <div className={styles.section2}>
          <h3><strong>Montant total HT:</strong> {project.actual_revenue.toFixed(2)} €</h3>
          <h3><strong>Total des dépenses :</strong> {project.actual_expenses_cost.toFixed(2)} €</h3>
          <h3><strong>Marge nette :</strong> {(project.actual_revenue - project.actual_expenses_cost).toFixed(2)} €</h3>
          <h3><strong>Marge (%) </strong></h3>
          <GaugeChart
            id="margin-gauge"
            nrOfLevels={5}
            percent={margeReelle}
            arcsLength={[0.15, 0.10, 0.30, 0.45]}
            colors={['#EA4228', '#F5CD19', '#5BE12C', '#109f30']}
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
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }} barSize={150} >
            <XAxis dataKey="name" /> {/* Axe des abscisses */}
            <YAxis /> {/* Axe des ordonnées */}
            <Tooltip />  {/* Afficher les valeurs au survol */}
            
            <Bar dataKey="estimatedRevenue" fill="#3467ff" />
            <Bar dataKey="actualRevenue" fill="#00950c" />
            <Bar dataKey="actualExpenses" fill="#e10069"  />
            <Bar dataKey="difference" fill="#FFD700"  />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section des dépenses */}
      <div className={styles.expensesContainer}>
        <h1>Dépenses</h1>
        <button onClick={() => setLoadExpenses(true)}> <i class="fa-solid fa-bars"></i>  Voir les dépenses du projet</button>

        {/* Afficher le loader pendant le chargement des dépenses */}
        {loadingExpenses ? (
          <div className={styles.loaderContainer}>
            <BarLoader color="#4520ff" loading={loadingExpenses} width={200} />
            <p>Chargement des dépenses...</p>
          </div>
        ) : (
          <>
            {/* Afficher le tableau seulement après que les dépenses sont chargées */}
            {expenses.length > 0 && (
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
                      <tr onClick={() => toggleExpense(expense.id)}>
                        <td><span>+</span>{expense.title}</td>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{expense.pre_tax_amount.toFixed(2)} €</td>
                        <td>{expense.total_amount.toFixed(2)} €</td>
                        <td>{expense.left_to_pay.toFixed(2)} €</td>
                        <td>{expense.accounting_code_name}</td>
                        <td>{expense.supplier_name}</td>
                        <td>{expense.project_id}</td>
                        <td><a href={expense.public_path} target="_blank" rel="noopener noreferrer">Lien</a></td>
                      </tr>
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
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
