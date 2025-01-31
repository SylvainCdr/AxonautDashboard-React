import { BarLoader, GridLoader } from "react-spinners";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProjectById } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchExpensesByProject } from "../../services/api/expenses";
import { fetchSupplierContractsByProjectTitle } from "../../services/api/contracts";
import styles from "./style.module.scss";
import {
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
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
  const [loadingExpenses, setLoadingExpenses] = useState(false); // État de chargement des dépenses
  const [loadingContracts, setLoadingContracts] = useState(false); // Nouvel état pour les Supplier Contracts
  const [supplierContracts, setSupplierContracts] = useState([]); // Nouvel état pour les Supplier Contracts

  const toggleExpense = (expenseId) => {
    setExpandedExpenses((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };

  const [showExpenses, setShowExpenses] = useState(false);
  const [showSupplierContracts, setShowSupplierContracts] = useState(false);

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

  console.log("project", project);
  // console.log ("company", company);

  useEffect(() => {
    const loadData = async () => {
      if (!project.name || !project.estimated_start) {
        console.error(
          "Le nom du projet ou la date de début estimée est indéfini."
        );
        return;
      }

      console.log("Nom du projet utilisé pour la recherche :", project.name);
      console.log("Date de début estimée :", project.estimated_start);

      try {
        setLoadingContracts(true); // Début du chargement
        setLoadingExpenses(true); // Début du chargement

        // Charger les contrats fournisseurs
        try {
          const supplierContractsData =
            await fetchSupplierContractsByProjectTitle(
              project.name,
              project.estimated_start
            );

          setSupplierContracts(supplierContractsData);
        } catch (err) {
          console.warn("Aucun contrat fournisseur trouvé :", err.message);
          setSupplierContracts([]); // Aucun contrat trouvé
        }

        // Charger les dépenses
        const expensesData = await fetchExpensesByProject(
          project.estimated_start,
          project.estimated_end,
          projectId
        );

        console.log("Dépenses chargées :", expensesData);
        setExpenses(expensesData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoadingContracts(false); // Fin du chargement
        setLoadingExpenses(false); // Fin du chargement
      }
    };

    loadData();
  }, [project.name, project.estimated_start, project.estimated_end, projectId]);

  console.log("supplierContracts :", supplierContracts);

  // Préparation des données pour le graphique
  const difference = project.actual_revenue - project.actual_expenses_cost || 0;

  // Collecter tous les IDs des dépenses associées aux supplierContracts
  const linkedExpenseIds = new Set(
    supplierContracts.flatMap((contract) =>
      contract.expenses.map((expense) => expense.id)
    )
  );

  // Filtrer les contrats non liés pour calculer les dépenses à venir
  const unlinkedContracts = supplierContracts.filter(
    (contract) =>
      !contract.expenses.some((expense) => linkedExpenseIds.has(expense.id))
  );

  // Calcul des montants pour les dépenses à venir
  const supplierContractAmount = unlinkedContracts.reduce(
    (acc, contract) => acc + contract.pre_tax_amount,
    0
  );

  const chartData = [
    {
      name: "Total",
      Commande: project.estimated_revenue,
      Facturation: project.actual_revenue,
      "Dépenses/Commandes": project.actual_expenses_cost, // Dépenses réelles
      "Commandes à venir": supplierContractAmount, // Commandes à venir
      "Marge Nette Actuelle": difference,
    },
  ];

  const gaugeStyle = {
    width: "250px",
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={15} />
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
          <p>
            <strong>Date de début estimé : </strong>
            {new Date(project.estimated_start).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de fin estimé : </strong>
            {new Date(project.estimated_end).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de début réelle : </strong>
            {new Date(project.actual_start).toLocaleDateString()}
          </p>

          <p>
            <strong>Montant total HT:</strong>{" "}
            {project.actual_revenue
              ? `${project.actual_revenue.toFixed(2)} €`
              : "Données insuffisantes"}
          </p>
          <p>
            <strong>Total des dépenses :</strong>{" "}
            {project.actual_expenses_cost
              ? `${project.actual_expenses_cost.toFixed(2)} €`
              : "Données insuffisantes"}
          </p>
        </div>
        <div className={styles.section2}>
          <p>
            <strong>Marge nette :</strong>{" "}
            {project.actual_revenue && project.actual_expenses_cost
              ? `${(
                  project.actual_revenue - project.actual_expenses_cost
                ).toFixed(2)} €`
              : "Données insuffisantes"}
          </p>
          <p>
            <strong>Marge (%) </strong>
          </p>
          <div className={styles.projectGauge}>
            {project.actual_revenue && project.actual_expenses_cost ? (
              <GaugeChart
                id="margin-gauge"
                nrOfLevels={5}
                percent={
                  project.actual_revenue
                    ? (
                        (project.actual_revenue -
                          project.actual_expenses_cost) /
                        project.actual_revenue
                      ).toFixed(3)
                    : 0
                }
                arcsLength={[0.15, 0.13, 0.27, 0.45]}
                arcWidth={0.3}
                colors={[" #C60F7B", "#FFBC42", "#91F5AD", "#009fe3"]}
                textColor="#000"
                needleColor="#6428fd5c"
                arcPadding={0.02}
                style={gaugeStyle}
              />
            ) : (
              /* 
    --col1: #009fe3;
    --col2: #C60F7B;
    --col3: #FFBC42;
    --col4:#F8F0FB;
    --col5: #001427;
    --col6: #91F5AD;
    --col7: #E06C9F
  
  }  */
              <p className={styles.noDataMessage}>
                Pas assez de données pour afficher la jauge.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* /* Section Graphique */}
      <div className={styles.graphContainer}>
        <h2>Graphique des coûts et revenus</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Commande" fill="#009fe3" name="Commande HT" />
            <Bar dataKey="Facturation" fill="#FFBC42" name="Facturé" />
            <Bar
              dataKey="Dépenses/Commandes"
              stackId="expenses"
              fill="#C60F7B"
              name="Dépenses payées"
            />
            <Bar
              dataKey="Commandes à venir"
              stackId="expenses"
              fill="#E06C9F"
              name="Dépenses à venir"
            />
            <Bar
              dataKey="Marge Nette Actuelle"
              fill="#91F5AD"
              name="Marge Nette"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section des dépenses */}
      <div className={styles.expenses}>
        <h1>Dépenses</h1>
        {/* Bouton de toggle pour afficher/masquer les dépenses */}
        <button
          className={styles.toggleButton}
          onClick={() => setShowExpenses(!showExpenses)}
        >
          {showExpenses ? "Masquer les dépenses" : "Afficher les dépenses"}
        </button>

        {showExpenses && ( // Affichage conditionnel des dépenses
          <>
            {loadingExpenses ? ( // Affichage du loader pour les dépenses
              <div className={styles.loaderContainer}>
                <BarLoader
                  color="#4520ff"
                  loading={loadingExpenses}
                  width={200}
                />
                <p>Chargement des dépenses...</p>
              </div>
            ) : expenses.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Date</th>
                    <th>Montant HT</th>
                    <th>Reste à payer TTC</th>
                    {/* <th>Nom comptable</th> */}
                    <th>Fournisseur</th>
                    {/* <th>Projet</th> */}
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <React.Fragment key={expense.id}>
                      <tr onClick={() => toggleExpense(expense.id)}>
                        <td>{expense.id}</td>
                        <td>
                          <span>+</span>
                          {expense.title}
                        </td>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>{expense.pre_tax_amount.toFixed(2)} €</td>
                        <td>{expense.left_to_pay.toFixed(2)} €</td>
                        {/* <td>{expense.accounting_code_name}</td> */}
                        <td>{expense.supplier_name}</td>
                        {/* <td>{expense.project_id}</td> */}
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
                      {expandedExpenses[expense.id] && (
                        <tr>
                          <td colSpan="9">
                            <table className={styles.expenseDetails}>
                              <thead>
                                <tr>
                                  <th>Article</th>
                                  <th>Quantité</th>
                                  <th>Total HT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expense.expense_lines.map((line, index) => (
                                  <tr key={index}>
                                    <td>{line.title}</td>
                                    <td>{line.quantity}</td>
                                    <td>
                                      {line.total_pre_tax_amount.toFixed(2)} €
                                    </td>
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
            ) : (
              <p>Aucune dépense trouvée.</p>
            )}
          </>
        )}
      </div>

      {/* Section des contrats fournisseurs */}
      <div className={styles.supplierContracts}>
        <h1>Commandes fournisseurs</h1>
        <button
          className={styles.toggleButton}
          onClick={() => setShowSupplierContracts(!showSupplierContracts)}
        >
          {showSupplierContracts
            ? "Masquer les dépenses"
            : "Afficher les dépenses"}
        </button>

        {showSupplierContracts && // Affichage conditionnel des contrats fournisseurs
          (loadingContracts ? ( // Affichage du loader pour les contrats fournisseurs
            <div className={styles.loaderContainer}>
              <BarLoader
                color="#4520ff"
                loading={loadingContracts}
                width={200}
              />
              <p>Chargement des commandes fournisseurs...</p>
            </div>
          ) : supplierContracts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date de début</th>
                  <th>Montant HT</th>
                  <th>Montant TTC</th>
                  <th>Fournisseur</th>
                  <th>Commentaire</th>
                  <th>expense ID</th>
                </tr>
              </thead>
              <tbody>
                {supplierContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    style={{
                      backgroundColor: contract.expenses.some((expense) =>
                        linkedExpenseIds.has(expense.id)
                      )
                        ? "#F8F0FB" // Surlignage en vert
                        : "white", // Couleur par défaut
                    }}
                  >
                    <td>{contract.title}</td>
                    <td>
                      {new Date(contract.start_date).toLocaleDateString()}
                    </td>
                    <td>{contract.pre_tax_amount.toFixed(2)} €</td>
                    <td>{contract.total_amount.toFixed(2)} €</td>
                    <td>{contract.supplier.name}</td>
                    <td>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: contract.comments
                            ? contract.comments.slice(0, 90) +
                              (contract.comments.length > 90 ? "..." : "")
                            : "Aucun commentaire",
                        }}
                      ></div>
                    </td>
                    <td>
                      {contract.expenses.map((expense) => (
                        <span key={expense.id}>{expense.id}, </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucune commande fournisseur trouvée.</p>
          ))}
      </div>
    </div>
  );
}
