// src/components/BillingPlanModal.js
import React, { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchContractById } from "../../services/api/contracts";
import { useParams } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { GridLoader } from "react-spinners";

export default function BillingPlan({ onClose }) {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = auth.currentUser;

  const navigate = useNavigate();

  const [steps, setSteps] = useState([
    {
      amount: "",
      date: "",
      stepsComment: "",
      revision: "",
      invoiced: false, // Ajout de la propriété invoiced
    },
  ]);

  const [mainComment, setMainComment] = useState("");
  const [generating, setGenerating] = useState(false);
  const [existingPlan, setExistingPlan] = useState(null);
  const [isEditable, setIsEditable] = useState(true); // par défaut editable
  const [deliveredLines, setDeliveredLines] = useState([]);
  const [deliveryInfoLines, setDeliveryInfoLines] = useState([]);
  const [showDetails, setShowDetails] = useState(false); // État pour contrôler l'affichage des détails

  useEffect(() => {
    if (existingPlan) {
      setIsEditable(false); // devient non éditable si un plan existe
    }
  }, [existingPlan]);

  // Récupère les lignes livrées au chargement
  const fetchDeliveredLines = async () => {
    const docRef = doc(db, "addInfosQuotation", quotationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const lines = data.lines || {};

      const deliveredData = {};
      const deliveryInfoData = {};

      Object.entries(lines).forEach(([lineId, lineData]) => {
        deliveredData[lineId] = lineData.delivered;
        deliveryInfoData[lineId] = lineData.deliveryInfo;
      });

      setDeliveredLines(deliveredData);
      setDeliveryInfoLines(deliveryInfoData);
    }
  };

  useEffect(() => {
    fetchDeliveredLines();
  }, [quotationId]);

  useEffect(() => {
    async function loadQuotationData() {
      try {
        setLoading(true);
        const data = await fetchQuotationById(quotationId);
        setQuotation(data);
        

        const planRef = doc(db, "billingPlans", data.id.toString());
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
          setExistingPlan(planSnap.data());
          setSteps(planSnap.data().steps || []);
          setMainComment(planSnap.data().mainComment || "");
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    }
    loadQuotationData();
  }, [quotationId]);

  const addStep = () => {
    setSteps([...steps, { amount: "", date: "", stepsComment: "" }]);
  };

  const updateStep = (index, key, value) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps];
      newSteps[index] = {
        ...newSteps[index],
        [key]: value,
      };
      return newSteps;
    });
  };

  const removeStep = (index) => {
    const updatedSteps = [...steps];
    updatedSteps.splice(index, 1);
    setSteps(updatedSteps);
  };

  const handleManualBillingPlanSave = async (steps, mainComment) => {
    setGenerating(true);
    try {
      const planRef = doc(db, "billingPlans", quotation.id.toString());

      // On vérifie si une révision est cochée
      const isRevisionChecked = steps.some(
        (step) => !!step.revision && parseFloat(step.revision) > 0
      );

      const totalStepAmount = steps.reduce(
        (sum, step) =>
          sum +
          parseFloat(step.amount || 0) +
          (step.revision ? parseFloat(step.revision || 0) : 0),
        0
      );

      // Si révision cochée, total doit être strictement supérieur
      if (isRevisionChecked && totalStepAmount <= quotation.total_amount) {
        alert(
          `Le total à facturer (${totalStepAmount.toFixed(
            2
          )} €) doit être supérieur au montant TTC du devis (${
            quotation.total_amount
          } €) si une révision est cochée.`
        );
        setGenerating(false);
        return;
      }

      const billingPlan = {
        projectId: quotation.project_id,
        quotationId: quotation.id,
        projectTitle: quotation.title || "Sans titre",
        createdAt: existingPlan ? existingPlan.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        generatedBy: user?.email || "inconnu",
        status: existingPlan ? existingPlan.status : "brouillon",
        mainComment: mainComment || "",
        steps: steps.map((step) => ({
          amount: parseFloat(step.amount),
          date: new Date(step.date).toISOString(),
          stepsComment: step.stepsComment || "",
          revision: step.revision ? parseFloat(step.revision || 0) : null,
          invoiced: step.invoiced || false, // Ajout de la propriété invoiced
        })),

        quotation: {
          id: quotation.id,
          pre_tax_amount: quotation.pre_tax_amount || 0,
          tax_amount: quotation.tax_amount || 0,
          total_amount: quotation.total_amount || 0,
          status: quotation.status || "inconnu",
          date: quotation.date || new Date().toISOString(),
        },
      };

      await setDoc(planRef, billingPlan); // setDoc met à jour ou crée
      alert(existingPlan ? "Plan mis à jour !" : "Plan enregistré !");
      navigate("/billing");
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement plan :", err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = steps.every((step) => step.amount && step.date);
    if (!valid) return alert("Veuillez remplir tous les champs.");
    handleManualBillingPlanSave(steps, mainComment);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#C60F7B" loading={loading} size={15} />
        <p>Chargement...</p>
      </div>
    );
  }
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div className={styles.billingPlanContainer}>
      <div className={styles.billingPlan}>
        <h1>
          {existingPlan
            ? "Modifier le plan de facturation"
            : "Créer un plan de facturation"}
        </h1>

        <div className={styles.billingPlanHeader}>
          {quotation && (
            <>
              <div className={styles.headerGrid}>
                <div className={styles.headerLeft}>
                  <a
                    href={`/quotations/${quotation.id}/project/${quotation.project_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <h2>
                      <i className="fa-solid fa-folder"></i>{" "}
                      {decodeHtmlEntities(quotation.title)}
                    </h2>
                  </a>

                  <p>
                    Total des étapes :
                    <strong>
                      {" "}
                      {steps
                        .reduce(
                          (sum, s) =>
                            sum +
                            parseFloat(s.amount || 0) +
                            (s.revision ? parseFloat(s.revision || 0) : 0),
                          0
                        )
                        .toFixed(2)}{" "}
                      €
                    </strong>
                  </p>

                  <p>
                    Établi / MAJ par :{" "}
                    <strong>{existingPlan?.generatedBy}</strong>
                  </p>
                </div>

                <div className={styles.headerRight}>
                  <p>
                    Montant HT : <strong>{quotation.pre_tax_amount} €</strong>
                  </p>
                  <p>
                    Montant TVA : <strong>{quotation.tax_amount} €</strong>
                  </p>
                  <p>
                    Montant TTC : <strong>{quotation.total_amount} €</strong>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <div className={styles.quotationLines}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={styles.toggleButton}
          >
            <i className="fa-solid fa-bars"></i>
            {showDetails
              ? "  Cacher les détails du devis"
              : "  Voir les détails du devis"}
          </button>

          {showDetails && (
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Désignation</th>
                  <th>Quantité</th>
                  <th>Reçu</th>
                  <th>Délai livraison</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  quotation.quotation_lines.reduce((groups, line) => {
                    const chapter = line.chapter || "Autres";
                    if (!groups[chapter]) groups[chapter] = [];
                    groups[chapter].push(line);
                    return groups;
                  }, {})
                ).map(([chapter, lines], chapterIndex) => (
                  <React.Fragment key={chapterIndex}>
                    <tr>
                      <td colSpan="11" className={styles.chapterRow}>
                        {decodeHtmlEntities(chapter)}
                      </td>
                    </tr>
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td>{line?.product_code || ""}</td>
                        <td>{line.product_name}</td>
                        <td>{line.quantity}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={deliveredLines[line.id] || false}
                            disabled
                          />
                        </td>
                        <td>{deliveryInfoLines[index] || ""}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

     <form onSubmit={handleSubmit}>
  <label>
    Commentaire principal
    <input
      type="text"
      id="mainComment"
      value={mainComment}
      onChange={(e) => setMainComment(e.target.value)}
      disabled={!isEditable}
    />
  </label>

  <table className={styles.stepsTable}>
    <thead>
      <tr>
        <th>#</th>
        <th>Montant (€)</th>
        <th>Date</th>
        <th>Commentaire</th>
        <th>Révision ?</th>
        <th>Montant révision (€)</th>
        <th>Total (€)</th>
        <th> Statut</th>
        {isEditable && <th>Action</th>}
      </tr>
    </thead>
    <tbody>
      {steps.map((step, index) => (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>
            <input
              type="number"
              value={step.amount}
              onChange={(e) => updateStep(index, "amount", e.target.value)}
              disabled={!isEditable}
              placeholder={
                isEditable
                  ? `Reste : ${(
                      quotation.total_amount -
                      steps
                        .slice(0, index)
                        .reduce(
                          (sum, s) =>
                            sum +
                            parseFloat(s.amount || 0) +
                            (s.revision
                              ? parseFloat(s.revision || 0)
                              : 0),
                          0
                        )
                    ).toFixed(2)} €`
                  : ""
              }
            />
          </td>
          <td>
            <input
              type="date"
              value={step.date ? step.date.substring(0, 10) : ""}
              onChange={(e) => updateStep(index, "date", e.target.value)}
              required
              disabled={!isEditable}
            />
          </td>
          <td>
            <input
              type="text"
              value={step.stepsComment}
              onChange={(e) =>
                updateStep(index, "stepsComment", e.target.value)
              }
              disabled={!isEditable}
            />
          </td>
          <td>
            <input
              type="checkbox"
              checked={!!step.revision}
              onChange={(e) =>
                updateStep(index, "revision", e.target.checked ? "0" : "")
              }
              disabled={!isEditable}
            />
          </td>
          <td>
            {step.revision && (
              <input
                type="number"
                value={step.revision}
                onChange={(e) =>
                  updateStep(index, "revision", e.target.value)
                }
                disabled={!isEditable}
              />
            )}
          </td>
          <td>
            {(
              parseFloat(step.amount || 0) +
              (step.revision ? parseFloat(step.revision || 0) : 0)
            ).toFixed(2)}
          </td>
          {isEditable && (
            <td>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className={styles.removeStepBtn}
                >
                  Supprimer
                </button>
              )}
            </td>
          
          )}
            <td>
             
  
              {step.invoiced ? "Facturé" : "Non facturé"}
            </td>
        </tr>
      ))}
    </tbody>
  </table>

  {isEditable && (
    <button type="button" onClick={addStep}>
      Ajouter un palier
    </button>
  )}

  <div className={styles.actions}>
    {existingPlan && !isEditable && (
      <button onClick={() => setIsEditable(true)}>Modifier</button>
    )}
    {isEditable && (
      <button type="submit" disabled={generating}>
        {generating ? "Enregistrement..." : "Enregistrer"}
      </button>
    )}
    <button
      type="button"
      onClick={() => navigate(-1)}
      disabled={generating}
    >
      Annuler
    </button>
  </div>
</form>

      </div>
    </div>
  );
}
