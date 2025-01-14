// POST
// /api/v2/expenses
// Create an Expense
// Parameters

// No parameters
// Request body

// The new Expense.

// {
//   "supplier_id": 55,
//   "workforce_id": 55,
//   "supplier_thirdparty_code": "7015C",
//   "title": "expense name",
//   "project_id": 1,
//   "date": "2022-05-28T18:05:35+02:00",
//   "pre_tax_amount": 50,
//   "taxes": [
//     {
//       "tax_rate": 20,
//       "accounting_code": "44571",
//       "amount": 10
//     }
//   ]
// }

// const createExpenseReport = async (expense) => {
//   const options = {
//     hostname: "axonaut.com",
//     path: "/api/v2/expenses",
//     method: "POST",
//     headers: {
//       userApiKey: process.env.AXONAUT_API_KEY,
//       "Content-Type": "application/json",
//       Accept: "application/json",
//     },
//   };

//   try {
//     const response = await new Promise((resolve, reject) => {
//       const req = https.request(options, (res) => {
//         let data = "";
//         res.on("data", (chunk) => {
//           data += chunk;
//         });
//         res.on("end", () => {
//           if (res.statusCode >= 200 && res.statusCode < 300) {
//             resolve(JSON.parse(data));
//           } else {
//             reject(
//               new Error(`HTTP Error: ${res.statusCode} - ${res.statusMessage}`)
//             );
//           }
//         });
//       });

//       req.on("error", reject);
//       req.write(JSON.stringify(expense));
//       req.end();
//     });

//     return response;
//   }
//   catch (error) {
//     console.error("Erreur lors de la création du rapport de dépense :", error.message);
//     throw error;
//   }
// }

import styles from "./style.module.scss";
import { useState, useEffect } from "react";
import { postExpenseReport } from "../../services/api/expenses";
import { fetchWorkforces } from "../../services/api/employees";


// fonction qui permet de poster une note de frais

export default function ExpenseReport() {
  const [workforces, setWorkforces] = useState([]);
  
  useEffect(() => {
    fetchWorkforces().then(setWorkforces);
  }
  , []);

  console.log (workforces);





  const [formData, setFormData] = useState({
    supplier_id: "",
    workforce_id: "",
    supplier_thirdparty_code: "",
    title: "",
    project_id: "",
    date: "",
    pre_tax_amount: "",
    tax_rate: "",
    accounting_code: "",
    tax_amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const expense = {
      ...formData,
      pre_tax_amount: parseFloat(formData.pre_tax_amount),
      taxes: [
        {
          tax_rate: parseFloat(formData.tax_rate),
          accounting_code: formData.accounting_code,
          amount: parseFloat(formData.tax_amount),
        },
      ],
    };

    try {
      await postExpenseReport(expense);
      setSuccessMessage("Note de frais créée avec succès.");
      setFormData({
        supplier_id: "",
        workforce_id: "",
        supplier_thirdparty_code: "",
        title: "",
        project_id: "",
        date: "",
        pre_tax_amount: "",
        tax_rate: "",
        accounting_code: "",
        tax_amount: "",
      });
    } catch (error) {
      setErrorMessage("Erreur lors de la création de la note de frais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.expenseReportContainer}>
      <h1>Créer une Note de Frais</h1>
      {successMessage && <p className={styles.success}>{successMessage}</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <form onSubmit={handleSubmit} className={styles.expenseForm}>
        <label>
          ID du Fournisseur:
          <input
            type="text"
            name="supplier_id"
            value={formData.supplier_id}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Code Tiers:
          <input
            type="text"
            name="supplier_thirdparty_code"
            value={formData.supplier_thirdparty_code}
            onChange={handleChange}
          />
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
          ID du Projet:
          <input
            type="text"
            name="project_id"
            value={formData.project_id}
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
          Code Comptable:
          <input
            type="text"
            name="accounting_code"
            value={formData.accounting_code}
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
      

        <button type="submit" disabled={loading}>
          {loading ? "En cours..." : "Créer la Note de Frais"}
        </button>
      </form>
    </div>
  );
}
