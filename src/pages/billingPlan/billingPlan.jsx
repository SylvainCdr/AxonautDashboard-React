// src/components/BillingPlanModal.js
import React, { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { fetchQuotationById } from "../../services/api/quotations";
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
      revision: false,
      revision: "",
    },
  ]);

  const [mainComment, setMainComment] = useState("");
  const [generating, setGenerating] = useState(false);

  const [existingPlan, setExistingPlan] = useState(null);
  const [isEditable, setIsEditable] = useState(true); // par défaut editable

  const [deliveredLines, setDeliveredLines] = useState([]);
  const [deliveryInfoLines, setDeliveryInfoLines] = useState([]);
  const [showDetails, setShowDetails] = useState(false); // État pour contrôler l'affichage des détails
  const [totalPixProductCode, setTotalPixProductCode] = useState(0);

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
  const hasDeliveryData =
    Object.values(deliveredLines).some((val) => val === true) ||
    Object.values(deliveryInfoLines).some((val) => val && val.trim() !== "");

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

  const updateStep = (index, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[index][field] = value;
    setSteps(updatedSteps);
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

      const totalStepAmount = steps.reduce(
        (sum, step) =>
          sum +
          parseFloat(step.amount || 0) +
          (step.revision ? parseFloat(step.revision || 0) : 0),
        0
      );

      if (totalStepAmount <= quotation.total_amount) {
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

        {quotation && (
          <>
            <h2>
              <i className="fa-solid fa-folder"></i>{" "}
              {decodeHtmlEntities(quotation.title)}
            </h2>
            <p>Montant total HT du devis : {quotation.pre_tax_amount} €</p>
            <p>Montant total TTC du devis : {quotation.total_amount} €</p>
            <p>Montant total de la TVA : {quotation.tax_amount} €</p>

                  <p>
            Total des étapes :{" "}
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
          </p>

            <div className={styles.quotationLines}>
              <button
                onClick={() => setShowDetails(!showDetails)} // Toggle visibility on click
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
                      <th>Reçu </th>
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
                            {/* <td>{line.price} €</td>
                            <td>{line.pre_tax_amount} €</td>
                            <td>{line.unit_job_costing} €</td>
                            <td>
                              {(line.unit_job_costing * line.quantity).toFixed(
                                2
                              )}{" "}
                              €
                            </td>
                            <td>{line.margin.toFixed(1)} €</td>
                            <td>
                              {(
                                (line.margin / line.pre_tax_amount) *
                                100
                              ).toFixed(1)}{" "}
                              %
                            </td> */}
                            <td>
                              <input
                                type="checkbox"
                                checked={deliveredLines[line.id] || false}
                                disabled
                                onChange={async (e) => {
                                  const newDelivered = e.target.checked;
                                  const newDeliveryInfo =
                                    deliveryInfoLines[index] || "";
                                  // ici tu pourrais ajouter une logique de mise à jour si besoin
                                }}
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
          </>
        )}

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

         {steps.map((step, index) => (
  <div key={index} className={styles.step}>
    <h3>Étape {index + 1}</h3>
    
    <label>
      Montant (€)
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
              (s.revision ? parseFloat(s.revisionAmount || 0) : 0),
            0
          )
      ).toFixed(2)} €`
    : ""
}

      />
    </label>

    <label>
      Date
      <input
        type="date"
        value={step.date}
        onChange={(e) => updateStep(index, "date", e.target.value)}
        disabled={!isEditable}
      />
    </label>

    <label>
      Commentaire
      <input
        type="text"
        value={step.stepsComment}
        onChange={(e) => updateStep(index, "stepsComment", e.target.value)}
        disabled={!isEditable}
      />
    </label>

    <label>
      Révision
      <input
        type="checkbox"
        checked={!!step.revision}
        onChange={(e) =>
          updateStep(index, "revision", e.target.checked ? "0" : "")
        }
        disabled={!isEditable}
      />
    </label>

    {step.revision && (
      <label>
        Montant révision (€)
        <input
          type="number"
          value={step.revision}
          onChange={(e) => updateStep(index, "revision", e.target.value)}
          disabled={!isEditable}
        />
      </label>
    )}

    {isEditable && steps.length > 1 && (
      <button
        type="button"
        onClick={() => removeStep(index)}
        className={styles.removeStepBtn}
      >
        Supprimer cette étape
      </button>
    )}

    <hr />
  </div>
))}


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
              <div className={styles.actions}>
                <button type="submit" disabled={generating}>
                  {generating ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
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
