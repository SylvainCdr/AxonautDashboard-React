import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProjectById } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchQuotationByProjectId } from "../../services/api/quotations";
import styles from "./style.module.scss";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectById(projectId);
        const companyData = await fetchCompanyById(data.company_id);
        
        setProject(data);
        setCompany(companyData);
      } catch (err) {
        setError("Impossible de charger les données du projet.");
      } finally {
        setLoading(false);
      }
    };
    loadProjectData();
  }, [projectId]);

  if (loading) return <div className={styles.loader}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  // Préparation des données pour le graphique
  const difference = project.estimated_revenue - project.actual_expenses_cost || 0;

  const chartData = [
    { name: "Revenu estimé", estimatedRevenue: project.estimated_revenue },
    { name: "Revenu actuel", actualRevenue: project.actual_revenue },
    {
      name: "Dépenses actuelles",
      actualExpenses: project.actual_expenses_cost,
    },
    // {
    //   name: "Produits consommés",
    //   consumeProducts: project.actual_consume_products_cost,
    // },
    { name: "Différence (Revenu - Dépenses)", difference },
  ];




  return (
    <div className={styles.projectContainer}>
      <h1>Détails du projet</h1>

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
            <Bar dataKey="estimatedRevenue" fill="#4682B4" /> {/* Bleu */}
            <Bar dataKey="actualRevenue" fill="#2E8B57" /> {/* Vert */}
            <Bar dataKey="actualExpenses" fill="#FF69B4" /> {/* Rose */}
            <Bar dataKey="consumeProducts" fill="#FF69B4" /> {/* Rose */}
            <Bar dataKey="difference" fill="#FFD700" /> {/* Or */}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
