import styles from "./style.module.scss";
import { useState, useEffect } from "react";
import { fetchWorkforces } from "../../services/api/employees";
import { postExpenseReport } from "../../services/api/expenses";
import { fetchSuppliers } from "../../services/api/companies";

export default function ExpenseReport() {
  const [workforces, setWorkforces] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    workforce_id: "",
    title: "",
    date: "", // ISO 8601 attendu
    pre_tax_amount: "",
    tax_rate: "", // Simple valeur pour le taux de taxe
    tax_amount: "", // Simple valeur pour le montant de la taxe
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formatDateRFC3339 = (date) => {
    const isoDate = new Date(date).toISOString();
    // Supprime les millisecondes pour correspondre au format attendu
    return isoDate.replace(/\.\d{3}Z$/, "Z");
  };

  // Exemple :
  const dateRFC3339 = formatDateRFC3339("2025-01-14T00:00:00.000Z");
  console.log(dateRFC3339); // Résultat : "2025-01-14T00:00:00Z"

  const cleanPayload = (formData) => {
    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      throw new Error(
        "Le champ 'date' doit être une date valide au format RFC 3339."
      );
    }

    const formatDateRFC3339 = (date) => {
      const isoDate = new Date(date).toISOString();
      return isoDate.replace(/\.\d{3}Z$/, "Z"); // Supprimer les millisecondes
    };

    const taxes =
      formData.tax_rate && formData.tax_amount
        ? [
            {
              tax_rate: parseFloat(formData.tax_rate),
              amount: parseFloat(formData.tax_amount),
            },
          ]
        : [];

    return {
      supplier_id: parseInt(formData.supplier_id, 10),
      workforce_id: formData.workforce_id
        ? parseInt(formData.workforce_id, 10)
        : undefined,
      title: formData.title.trim(),
      date: formatDateRFC3339(formData.date),
      pre_tax_amount: parseFloat(formData.pre_tax_amount),
      taxes,
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");



    try {
      const payload = cleanPayload(formData);
      console.log("Payload envoyé :", JSON.stringify(payload, null, 2)); // Vérifiez les données envoyées

      const response = await postExpenseReport(payload);
      setSuccessMessage("Note de frais créée avec succès.");
      console.log("Réponse API :", response);

      setFormData({
        supplier_id: "",
        workforce_id: "",
        title: "",
        date: "",
        pre_tax_amount: "",
        tax_rate: "",
        tax_amount: "",
      });
    } catch (error) {
      setErrorMessage(error.message);
      console.error("Erreur :", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchWorkforcesData = async () => {
      try {
        const data = await fetchWorkforces();
        setWorkforces(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des employés :", error);
      }
    };

    const fetchSuppliersData = async () => {
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des fournisseurs :", error);
      }
    }

    fetchWorkforcesData();
    fetchSuppliersData();
  }
  , []);


  return (
    <div className={styles.expenseReportContainer}>
      <h1>Créer une Note de Frais</h1>
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <form onSubmit={handleSubmit} className={styles.expenseForm}>
        <label>
         Fournisseur (ex: 561399, 4704641):
          {/* <input
            type="text"
            name="supplier_id"
            value={formData.supplier_id}
            onChange={handleChange}
            required
          /> */}
          <select
            name="supplier_id"
            value={formData.supplier_id}
            onChange={handleChange}
          >
            <option value="">Sélectionner un fournisseur</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Titre:
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Date:
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Montant HT:
          <input
            type="number"
            step="0.01"
            name="pre_tax_amount"
            value={formData.pre_tax_amount}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Taux de Taxe:
          <input
            type="number"
            step="0.01"
            name="tax_rate"
            value={formData.tax_rate}
            onChange={handleChange}
          />
        </label>

        <label>
          Montant de Taxe:
          <input
            type="number"
            step="0.01"
            name="tax_amount"
            value={formData.tax_amount}
            onChange={handleChange}
          />
        </label>
        <label>
          Employé:
          <select
            name="workforce_id"
            value={formData.workforce_id}
            onChange={handleChange}
          >
            <option value="">Sélectionner un employé</option>
            {workforces.map((workforce) => (
              <option key={workforce.id} value={workforce.id}>
                {workforce.firstname} {workforce.lastname}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "En cours..." : "Créer la Note de Frais"}
        </button>
      </form>
    </div>
  );
}
