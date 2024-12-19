import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProjectById } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchExpensesByProject } from "../../services/api/expenses";
import styles from "./style.module.scss";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GridLoader } from "react-spinners";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        const companyData = await fetchCompanyById(projectData.company_id);
        const expensesData = await fetchExpensesByProject(
          projectData.estimated_start,
          projectData.estimated_end
        );
       
        console.log(expensesData); // Log des données des dépenses pour vérifier
  
        setProject(projectData);
        setCompany(companyData);
        // Vérification si expensesData est un tableau
        if (expensesData && Array.isArray(expensesData)) {
          setExpenses(expensesData);
        } else {
          setError("Format inattendu des données des dépenses.");
        }
        
      } catch (err) {
        console.error(err);
        if (err.message.includes("expenses")) {
          setError("Erreur lors du chargement des dépenses.");
        } else if (err.message.includes("companies")) {
          setError("Erreur lors du chargement de l'entreprise.");
        } else {
          setError("Erreur lors du chargement des données du projet.");
        }
      } finally {
        setLoading(false);
      }
    };
  
    loadProjectData();
  }, [projectId]);


  
  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

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
  
  // Affichage des dépenses avec une vérification préalable
  return (

    <div className={styles.projectContainer}>
     <h1>Détails du projet - {project.number}</h1>

<div className={styles.header}>
  <div className={styles.section1}>
    <p>
      <strong>Id :</strong> {project.id}
    </p>
    <p>
      <strong>Numéro :</strong> {project.number}
    </p>
    <p>
      <strong>Nom :</strong> {project.name}
    </p>
  </div>
  <div className={styles.section2}>
    <p>
      <strong>Entreprise :</strong>{" "}
      {company.name || "Entreprise inconnue"}
    </p>
    <p>
      <strong>Adresse :</strong> {company.address_street}
    </p>
    <p>
      <strong>Code postal :</strong> {company.zip_code}
    </p>
    <p>
      <strong>Ville :</strong> {company.address_city} (
      {company.address_country})
    </p>
    <p>
      <strong>Commercial en charge :</strong>{" "}
      {company.business_manager?.name || "Inconnu"}
    </p>
  </div>
</div>

{/* Section Graphique */}
<div className={styles.graphContainer}>
  <h2>Graphique des coûts et revenus</h2>
  <ResponsiveContainer width="100%" height={400}>
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
        <th>Id</th>
        <th>Titre</th>
        <th>Date</th>
        <th>Montant HT</th>
        <th>Montant TTC</th>
        <th>Reste à payer</th>
        <th>Code comptable</th>
        <th>Code comptable nom</th>
        <th>Contrat fournisseur</th>
        <th>Fournisseur</th>
        <th>Entreprise</th>
        <th>Projet</th>
        <th>Public path</th>
      </tr>
    </thead>

    <tbody>
      {expenses.map((expense) => (
        <tr key={expense.id}>
          <td>{expense.id}</td>
          <td>{expense.title}</td>
          <td>{new Date(expense.date).toLocaleDateString()}</td>
          <td>{expense.pre_tax_amount.toFixed(2)} €</td>
          <td>{expense.total_amount.toFixed(2)} €</td>
          <td>{expense.left_to_pay.toFixed(2)} €</td>
          <td>{expense.accounting_code}</td>
          <td>{expense.accounting_code_name}</td>
          <td>{expense.supplier_contract_id}</td>
          <td>{expense.supplier_name}</td>
          <td>{expense.company_id}</td>
          <td>{expense.project_id}</td>
          <td>{expense.public_path}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
</div>
);
}

    