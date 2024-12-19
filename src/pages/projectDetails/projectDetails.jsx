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

  // useEffect(() => {
  //   const loadProjectData = async () => {
  //     try {
  //       setLoading(true);
  //       const projectData = await fetchProjectById(projectId);
  //       const companyData = await fetchCompanyById(projectData.company_id);
  //       const expensesData = await fetchExpensesByProject(projectId);

  //       console.log(expensesData); // Log des données des dépenses pour vérifier

  //       setProject(projectData);
  //       setCompany(companyData);
  //       // Vérification si expensesData est un tableau
  //       if (expensesData && Array.isArray(expensesData)) {
  //         setExpenses(expensesData);
  //       } else {
  //         setError("Format inattendu des données des dépenses.");
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       if (err.message.includes("expenses")) {
  //         setError("Erreur lors du chargement des dépenses.");
  //       } else if (err.message.includes("companies")) {
  //         setError("Erreur lors du chargement de l'entreprise.");
  //       } else {
  //         setError("Erreur lors du chargement des données du projet.");
  //       }
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadProjectData();
  // }, [projectId]);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjectById(projectId);
        const companyData = await fetchCompanyById(projectData.company_id);
        const expensesData = await fetchExpensesByProject(projectId);
  
        // Filtrer les dépenses par projectId
        const filteredExpenses = expensesData.filter(
          (expense) => expense.project_id === parseInt(projectId, 10)
        );
  
        setProject(projectData);
        setCompany(companyData);
        setExpenses(filteredExpenses);
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

        {/* [
  {
    "id": 55,
    "title": "foo",
    "supplier": {
      "id": 55,
      "company_id": 55,
      "name": "foo",
      "prefered_tax_rate": "20%",
      "thirdparty_code": "401000",
      "custom_fields": {
        "myCustomField": 1
      },
      "categories": [
        "B2B"
      ]
    },
    "start_date": "2022-05-28T18:05:35+02:00",
    "end_date": "2022-05-28T18:05:35+02:00",
    "frequency_in_months": 1,
    "comments": "string",
    "pre_tax_amount": 55.5,
    "total_amount": 65.5,
    "expenses": [
      {
        "id": 55,
        "title": "expense name",
        "date": "2022-05-28T18:05:35+02:00",
        "number": "expense name",
        "creation_date": "2022-05-28T18:05:35+02:00",
        "last_update_date": "2022-05-28T18:05:35+02:00",
        "paid_date": "2022-05-28T18:05:35+02:00",
        "expected_payment_date": "2022-05-28T18:05:35+02:00",
        "pre_tax_amount": 50,
        "tax_amount": 50,
        "total_amount": 50,
        "left_to_pay": 50,
        "currency": "EUR",
        "accounting_code": "7015C",
        "accounting_code_name": "code name",
        "supplier_contract_id": 55,
        "supplier_id": 55,
        "supplier_name": "My supplier",
        "company_id": 123,
        "project_id": 1,
        "workforce_id": 55,
        "payslip_id": 3,
        "public_path": "https://axonaut.com/public/expense/f45sdf5qs5",
        "expense_lines": [
          {
            "title": "line name",
            "quantity": 2,
            "total_pre_tax_amount": 50,
            "accounting_code": "7015D",
            "product_id": 15
          }
        ],
        "tax_rates": [
          {
            "id": 55,
            "name": "20.0%",
            "tax_rate": 20,
            "accounting_code": "44571",
            "amount": 10
          }
        ]
      }
    ]
  }
] */}

        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Titre</th>
              <th>Date</th>
              <th>Montant HT</th>
              <th>Montant TTC</th>
              <th>Reste à payer</th>
              <th> Nom comptable</th>
              <th>Contrat fournisseur</th>
              <th>Fournisseur</th>
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
                <td>{expense.accounting_code_name}</td>
                <td>{expense.supplier_contract_id}</td>
                <td>{expense.supplier_name}</td>
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
