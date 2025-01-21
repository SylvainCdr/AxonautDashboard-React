import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";
import GaugeChart from "react-gauge-chart";
import { db } from "../../firebase/firebase";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function QuotationDetails() {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false); // Vérification de duplication
  const [showDetails, setShowDetails] = useState(false); // Toggle des détails
  const [duplicateQuotationId, setDuplicateQuotationId] = useState(null);

  // Ajoutez `useNavigate` :
const navigate = useNavigate();

 // Vérifie si le devis est déjà dupliqué
 const checkDuplicateQuotation = async () => {
  try {
    const duplicateQuotationQuery = query(
      collection(db, "DuplicateQuotation"),
      where("quotation_id", "==", quotationId)
    );

    const querySnapshot = await getDocs(duplicateQuotationQuery);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      setIsDuplicate(true);
      setDuplicateQuotationId(doc.id);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du devis dupliqué :", error);
  }
};





// Duplique le devis
const duplicateQuotation = async () => {
  try {
    const docRef = await addDoc(collection(db, "DuplicateQuotation"), {
      ...quotation,
      quotation_id: quotationId,
    });
    console.log("Document dupliqué avec succès avec l'ID :", docRef.id);
    setIsDuplicate(true);
    setDuplicateQuotationId(docRef.id);

    // Naviguer automatiquement après duplication
    navigate(`/duplicate-quotation/${docRef.id}`);
  } catch (e) {
    console.error("Erreur lors de la duplication du document :", e);
  }
};

console.log(quotation);

// objet DuplicateQuotation :

// appro_study_finished true
// (booléen)
// comments ""
// (chaîne)
// company_id 6794843
// (chiffre)
// company_name "Terideal"
// (chaîne)
// contract_id 3632746
// (chiffre)
// customer_portal_url "https://axonaut.com/document/1XTY7TFUEZUREG9W"
// (chaîne)
// date "2024-09-23T00:00:00+02:00"
// (chaîne)
// electronic_signature_date null
// (nul)
// expiry_date "2024-10-23T00:00:00+02:00"
// (chaîne)
// global_discount_amount 527
// (chiffre)
// global_discount_amount_with_tax 632.4
// (chiffre)
// global_discount_comments ""
// (chaîne)
// global_discount_unit_is_percent false
// (booléen)
// id 6515256
// (chiffre)
// last_update_date "2024-09-23T08:36:07+02:00"
// (chaîne)
// margin 4510.300000000001
// (chiffre)
// number "Pix4141"
// (chaîne)
// opportunity_id null
// (nul)
// payments_to_display_in_pdf null
// (nul)
// pre_tax_amount 10674.5
// (chiffre)
// project_id 940902
// (chiffre)
// public_path "https://axonaut.com/public/quotation/pdf/7d77e60aa44d881e44b8b9454941fd01e5a04666ebe6d1168952064e7989045e"
// (chaîne)
// quotation_id "6515256"
// (chaîne)
// quotation_lines
// (tableau)
// 0
// (mappage)
// actual_cost 7.5
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Genetec Advantage for 1 Synergis Enterprise Reader-1 year"
// (chaîne)
// final_quantity 8
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 8.86
// (chiffre)
// pre_tax_amount 20.96
// (chiffre)
// price 2
// (chiffre)
// product_code ""
// (chaîne)
// product_id 14257773
// (chiffre)
// product_internal_id null
// (nul)
// product_name "GEN-ADV-RDR-E-1Y"
// (chaîne)
// quantity 11
// (chiffre)
// tax_amount 4.19
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "GEN-ADV-RDR-E-1Y"
// (chaîne)
// total_actual_cost 15
// (chiffre)
// total_amount 25.16
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 1.1
// (chiffre)
// 1
// (mappage)
// actual_cost 855
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Synergis™ Cloud Link with 4GB of RAM, 16GB Flash, <br />second generation, installed with Synergis™ access<br />control firmware, four RS-485 ports, PoE."
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 431.92
// (chiffre)
// pre_tax_amount 1286.92
// (chiffre)
// price 1350.45
// (chiffre)
// product_code "SY-CLOUDLINK-G2"
// (chaîne)
// product_id 9181343
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Synergis™ Cloud Link"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 257.38
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Synergis™ Cloud Link"
// (chaîne)
// total_amount 1544.3
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 855
// (chiffre)
// 2
// (mappage)
// actual_cost 925
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Mercury Intelligent Controller, Linux Based, <br />8In/4Out/2Rd - no reader connections included. Can<br />be used for SaaS, Education package and<br />replacement-Europe only"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 405.37
// (chiffre)
// pre_tax_amount 1099.37
// (chiffre)
// price 1153.65
// (chiffre)
// product_code "SY-LP1502-EURO"
// (chaîne)
// product_id 9181012
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Mercury Intelligent Controller : SY-LP1502-EURO"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 219.87
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Mercury Intelligent Controller"
// (chaîne)
// total_amount 1319.25
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 694
// (chiffre)
// 3
// (mappage)
// actual_cost 535
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Mercury MR52 2-reader interface module Series 3 <br />inputs, 6 relays, PCB only, software connections<br />included)-Europe only"
// (chaîne)
// final_quantity 2
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 851.07
// (chiffre)
// pre_tax_amount 2252.07
// (chiffre)
// price 787.75
// (chiffre)
// product_code "SY-MR52-S3-EURO "
// (chaîne)
// product_id 9181016
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Mercury MR52 2-reader interface module Series 3"
// (chaîne)
// quantity 3
// (chiffre)
// tax_amount 450.41
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Mercury MR52 2-reader interface module Series 3"
// (chaîne)
// total_amount 2702.48
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 467
// (chiffre)
// 4
// (mappage)
// actual_cost 119.39
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Coffret ACMB métal 705x345x116mm Emplacements 1+2 ou 3"
// (chaîne)
// final_quantity 2
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 67.22
// (chiffre)
// pre_tax_amount 189.26
// (chiffre)
// price 198.6
// (chiffre)
// product_code "ACMB3"
// (chaîne)
// product_id 9181227
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Coffret métal pour intégration 3 cartes électronique"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 37.85
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Coffret métal pour intégration 3 cartes électronique"
// (chaîne)
// total_amount 227.11
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 122.04
// (chiffre)
// 5
// (mappage)
// actual_cost 40.46
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Module alimentation chargeur 100-240V AC / 12V DC / 3A"
// (chaîne)
// final_quantity 2
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 22.57
// (chiffre)
// pre_tax_amount 62.32
// (chiffre)
// price 65.4
// (chiffre)
// product_code "PSXM-1203"
// (chaîne)
// product_id 9181231
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Alimentation 12V/3A"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 12.46
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Alimentation 12V/3A"
// (chaîne)
// total_amount 74.79
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 39.75
// (chiffre)
// 6
// (mappage)
// actual_cost 9.61
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "BATTERIE RECHARG VRLA 12V/7 AH-BAC FR UL94 V-0-151X65X94/99MM(*)"
// (chaîne)
// final_quantity 2
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 6.6
// (chiffre)
// pre_tax_amount 16.2
// (chiffre)
// price 17
// (chiffre)
// product_code "FX1207"
// (chaîne)
// product_id 3933287
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Batterie 12V - FX1207"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 3.24
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Batterie 12V - FX1207"
// (chaîne)
// total_amount 19.44
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 9.6
// (chiffre)
// 7
// (mappage)
// actual_cost 169
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Lecteur de badge Architect One STID"
// (chaîne)
// final_quantity 6
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 252.73
// (chiffre)
// pre_tax_amount 777.61
// (chiffre)
// price 136
// (chiffre)
// product_code "LEC-ARC1MF"
// (chaîne)
// product_id 11235245
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Lecteur de badge Architect One STID"
// (chaîne)
// quantity 6
// (chiffre)
// tax_amount 155.52
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Lecteur de badge Architect One STID"
// (chaîne)
// total_amount 933.13
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 87.48
// (chiffre)
// 8
// (mappage)
// actual_cost 18.63
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Bouton poussoir acier inoxydable diam 19mm NO/NF braille"
// (chaîne)
// final_quantity 6
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 33.75
// (chiffre)
// pre_tax_amount 147.57
// (chiffre)
// price 25.81
// (chiffre)
// product_code "SS19P101"
// (chaîne)
// product_id 12981051
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Bouton poussoir - SS19P101"
// (chaîne)
// quantity 6
// (chiffre)
// tax_amount 29.51
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Bouton poussoir - SS19P101"
// (chaîne)
// total_amount 177.09
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 18.97
// (chiffre)
// 9
// (mappage)
// actual_cost 14.62
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Pour plaque 39.5x84.5mm. Avec vis à tête antivandale et outil"
// (chaîne)
// final_quantity 6
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 18.24
// (chiffre)
// pre_tax_amount 105.78
// (chiffre)
// price 18.5
// (chiffre)
// product_code "SSH100"
// (chaîne)
// product_id 13912817
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Boitier saillie - SSH100"
// (chaîne)
// quantity 6
// (chiffre)
// tax_amount 21.16
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Boitier saillie - SSH100"
// (chaîne)
// total_amount 126.93
// (chiffre)
// unit null
// (nul)
// unit_job_costing 14.59
// (chiffre)
// 10
// (mappage)
// actual_cost 12.5
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details ""
// (chaîne)
// final_quantity 6
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 23.37
// (chiffre)
// pre_tax_amount 99.03
// (chiffre)
// price 17.32
// (chiffre)
// product_code "RCP300G"
// (chaîne)
// product_id 9122983
// (chiffre)
// product_internal_id null
// (nul)
// product_name "RCP300G - Déclencheur manuel vert 3 contacts à membrane déformable"
// (chaîne)
// quantity 6
// (chiffre)
// tax_amount 19.81
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "RCP300G - Déclencheur manuel vert 3 contacts à membrane déformable"
// (chaîne)
// total_amount 118.84
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 12.61
// (chiffre)
// 11
// (mappage)
// actual_cost 12
// (chiffre)
// chapter "CONTR&Ocirc;LE D'ACCES"
// (chaîne)
// details "Contact aluminium saillie avec gaine de 3m 4HD-300 Dist de fonctionnement 20mm, Dim: L. 79 x l. 19 x H. 12 mm NFA2P Type 2"
// (chaîne)
// final_quantity 6
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 10.14
// (chiffre)
// pre_tax_amount 82.74
// (chiffre)
// price 14.47
// (chiffre)
// product_code "4HD-300"
// (chaîne)
// product_id 9099943
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Contact aluminium saillie avec gaine de 3m - 4HD-300"
// (chaîne)
// quantity 6
// (chiffre)
// tax_amount 16.55
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Contact aluminium saillie avec gaine de 3m - 4HD-300"
// (chaîne)
// total_amount 99.28
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 12.1
// (chiffre)
// 12
// (mappage)
// actual_cost 329
// (chiffre)
// chapter "INTRUSION"
// (chaîne)
// details "Centrale SPC 8-32 entrées VANDERBILT<br />Garantie 3 ans échange standard"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 269.02
// (chiffre)
// pre_tax_amount 599.88
// (chiffre)
// price 629.5
// (chiffre)
// product_code "SPC4320.320-L1"
// (chaîne)
// product_id 10873010
// (chiffre)
// product_internal_id null
// (nul)
// product_name "SPC4320.320-L1 - Centrale SPC 8-32 entrées VANDERBILT"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 119.98
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "SPC4320.320-L1 - Centrale SPC 8-32 entrées VANDERBILT"
// (chaîne)
// total_amount 719.86
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 330.86
// (chiffre)
// 13
// (mappage)
// actual_cost 9.6
// (chiffre)
// chapter "INTRUSION"
// (chaîne)
// details "BATTERIE RECHARG VRLA 12V/7 AH-BAC FR UL94 V-0-151X65X94/99MM(*)"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 6.6
// (chiffre)
// pre_tax_amount 16.2
// (chiffre)
// price 17
// (chiffre)
// product_code "FX1207"
// (chaîne)
// product_id 3933287
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Batterie 12V - FX1207"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 3.24
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Batterie 12V - FX1207"
// (chaîne)
// total_amount 19.44
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 9.6
// (chiffre)
// 14
// (mappage)
// actual_cost 224
// (chiffre)
// chapter "INTRUSION"
// (chaîne)
// details "Module GSM/GPRS 2G/3G/4G avec antenne VANDERBILT<br />SPCN342.000"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 139.7
// (chiffre)
// pre_tax_amount 366.27
// (chiffre)
// price 384.35
// (chiffre)
// product_code "SPCN342.000"
// (chaîne)
// product_id 10873077
// (chiffre)
// product_internal_id null
// (nul)
// product_name "SPCN342.000 - Module GSM/GPRS 2G/3G/4G avec antenne VANDERBILT"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 73.25
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "SPCN342.000 - Module GSM/GPRS 2G/3G/4G avec antenne VANDERBILT"
// (chaîne)
// total_amount 439.52
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 226.57
// (chiffre)
// 15
// (mappage)
// actual_cost 105.18
// (chiffre)
// chapter "INTRUSION"
// (chaîne)
// details "Clavier LCD SPC VANDERBILT<br />Garantie 3 ans échange standard<br />SPCK420.100"
// (chaîne)
// final_quantity 3
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 237.83
// (chiffre)
// pre_tax_amount 550.04
// (chiffre)
// price 192.4
// (chiffre)
// product_code "SPCK420.100"
// (chaîne)
// product_id 10873112
// (chiffre)
// product_internal_id null
// (nul)
// product_name "SPCK420.100 - Clavier LCD SPC VANDERBILT"
// (chaîne)
// quantity 3
// (chiffre)
// tax_amount 110.01
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "SPCK420.100 - Clavier LCD SPC VANDERBILT"
// (chaîne)
// total_amount 660.05
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 104.07
// (chiffre)
// 16
// (mappage)
// actual_cost 35.63
// (chiffre)
// chapter "INTRUSION"
// (chaîne)
// details "Nouveau design, bornier débrochable"
// (chaîne)
// final_quantity 3
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 55.69
// (chiffre)
// pre_tax_amount 164.38
// (chiffre)
// price 57.5
// (chiffre)
// product_code "DT8012F5"
// (chaîne)
// product_id 13348345
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Détecteur DoubleTech - DT8012F5"
// (chaîne)
// quantity 3
// (chiffre)
// tax_amount 32.88
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Détecteur DoubleTech - DT8012F5"
// (chaîne)
// total_amount 197.26
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 36.23
// (chiffre)
// 17
// (mappage)
// actual_cost 55
// (chiffre)
// chapter "INTRUSION"
// (chaîne)
// details "Pack SI-MAX comprend 1 SI-MAX V3 + batterie 12V 2Ah YUASA"
// (chaîne)
// final_quantity 4
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 63.35
// (chiffre)
// pre_tax_amount 331.63
// (chiffre)
// price 87
// (chiffre)
// product_code "PACKSIMAX-v3 NF"
// (chaîne)
// product_id 8834268
// (chiffre)
// product_internal_id null
// (nul)
// product_name "PACKSIMAX-v3 NF"
// (chaîne)
// quantity 4
// (chiffre)
// tax_amount 66.33
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Pack SI-MAX"
// (chaîne)
// total_amount 397.95
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 67.07
// (chiffre)
// 18
// (mappage)
// actual_cost 200
// (chiffre)
// chapter "PRESTATIONS PIXECURITY"
// (chaîne)
// details "Livrables documentaires"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 266.95
// (chiffre)
// pre_tax_amount 466.95
// (chiffre)
// price 490
// (chiffre)
// product_code "Pix_Liv"
// (chaîne)
// product_id 3634549
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Livrables"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 93.39
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Livrables"
// (chaîne)
// total_amount 560.34
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 200
// (chiffre)
// 19
// (mappage)
// actual_cost 350
// (chiffre)
// chapter "PRESTATIONS PIXECURITY"
// (chaîne)
// details "Mise en service Technicien supérieur pour système d'alarme VANDERBILT"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 593.42
// (chiffre)
// pre_tax_amount 943.42
// (chiffre)
// price 990
// (chiffre)
// product_code "Pix_Mes2"
// (chaîne)
// product_id 2490933
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Mise en service Niveau 2"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 188.68
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Mise en service Niveau 2"
// (chaîne)
// total_amount 1132.11
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 350
// (chiffre)
// 20
// (mappage)
// actual_cost 350
// (chiffre)
// chapter "PRESTATIONS PIXECURITY"
// (chaîne)
// details "Mise en service Ingénieur pour système contrôle d'accès GENETEC"
// (chaîne)
// final_quantity 1
// (chiffre)
// line_discount_amount "0.00"
// (chaîne)
// line_discount_amount_with_tax "0.00"
// (chaîne)
// line_discount_unit_is_percent true
// (booléen)
// margin 745.9
// (chiffre)
// pre_tax_amount 1095.9
// (chiffre)
// price 1150
// (chiffre)
// product_code "Pix_Mes3"
// (chaîne)
// product_id 2490934
// (chiffre)
// product_internal_id null
// (nul)
// product_name "Mise en service Niveau 3"
// (chaîne)
// quantity 1
// (chiffre)
// tax_amount 219.18
// (chiffre)
// tax_rates
// (tableau)
// 0
// (mappage)
// name "Taux normal"
// (chaîne)
// rate 20
// (chiffre)
// title "Mise en service Niveau 3"
// (chaîne)
// total_amount 1315.07
// (chiffre)
// unit ""
// (chaîne)
// unit_job_costing 350
// (chiffre)
// sent_date null
// (nul)
// status "accepted"
// (chaîne)
// tax_amount 2134.9
// (chiffre)
// title "Pix4141 TERIDEAL SEGEX ENERGIES - Commande CF3320026700-R00270 prestation Halle CESAIRE - CLAMART"
// (chaîne)
// total_amount 12809.4
// (chiffre)
// user_id 147097 


// fonction pour verifier si le devis est dupliqué et comporte dans DuplicateQuotation de firebase appro_study_finished a true, si oui alors on retourne une jauge avec la marge réelle du porjet :



 






  useEffect(() => {
    const loadQuotationData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotationById(quotationId);
        const companyData = await fetchCompanyById(data.company_id);

        setQuotation(data);
        setCompany(companyData);
        await checkDuplicateQuotation(); // Vérifie la duplication
      } catch (err) {
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);

  console.log(quotation);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

  const totalPixProductCode = quotation.quotation_lines
    .filter((line) => line.product_code.startsWith("Pix_"))
    .reduce((acc, line) => acc + line.unit_job_costing, 0);

  return (
    <div className={styles.quotationContainer}>
      <h1>Détails du devis - {quotation.number}</h1>

      <div className={styles.header}>
        <div className={styles.section1}>
          <p>
            <strong>Numéro :</strong> {quotation.number}
          </p>

          <p>
            <strong>Titre :</strong> {quotation.title}
          </p>
          <p>
            <strong>Nom de l'entreprise :</strong> {quotation.company_name}
          </p>
          <p>
            <strong>Date :</strong>{" "}
            {new Date(quotation.date).toLocaleDateString()}
          </p>

          <p>
            <strong>Commercial :</strong>{" "}
            {company.business_manager?.name || "Inconnu"}
          </p>
          <p>
            <strong>Statut :</strong>{" "}
            <span style={{ color: statusColor(quotation.status) }}>
              {quotation.status}
            </span>
          </p>
          <p>
            <strong>Commentaire(s):</strong> {quotation.comments}
          </p>

          <p><strong> Remise :</strong> {quotation.global_discount_amount} €</p>
        </div>
        <div className={styles.section2}>
          <h3>
            <strong>Montant total HT:</strong> {quotation.pre_tax_amount}€
          </h3>
          <h3>
            <strong>Marge total :</strong> {quotation.margin.toFixed(2)} €
          </h3>
          <h3>
            {" "}
            <strong>Marge (%) </strong>
          </h3>
          <GaugeChart
            id="margin-gauge"
            nrOfLevels={5}
            percent={(quotation.margin / quotation.pre_tax_amount).toFixed(3)}
            colors={["#f78800", "#109f00"]}
            textColor="#000"
            needleColor="#4520ff"
          />
        </div>
      </div>

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
                <th>Prix unitaire HT</th>
                <th>Montant total HT</th>
                <th>Coût d'achat unit</th>
                <th>Marge total</th>
                <th>Marge en %</th>
              </tr>
            </thead>
            <tbody>
              {quotation.quotation_lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.product_code}</td>
                  <td>{line.product_name}</td>
                  <td>{line.quantity}</td>
                  <td>{line.price} €</td>
                  <td>{line.pre_tax_amount} €</td>
                  <td>{line.unit_job_costing} €</td>
                  <td>{(line.margin.toFixed(1))} %</td>
                  <td>
                    {((line.margin / line.pre_tax_amount) * 100).toFixed(1)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.totals}>
          <p>
            <strong>Montant total HT :</strong> {quotation.pre_tax_amount} €
          </p>
         
          <p>
            <strong>Remise HT :</strong>  {quotation.global_discount_amount} €
          </p>
      
          <p>
            <strong>Marge totale :</strong> {quotation.margin.toFixed(2)} €
          </p>
          <p>
            <strong>Marge % :</strong>{" "}
            {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(2)} %
          </p>

          <p>
            <strong>Cout total des prestations :</strong> {totalPixProductCode}{" "}
            €
          </p>
        </div>
      </div>

      <div className={styles.footer}>
        <a
          href={quotation.public_path}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans Axonaut
        </a>
        {/* <a
          href={quotation.customer_portal_url}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans le portail client
        </a> */}
        {!isDuplicate ? (
          <button onClick={duplicateQuotation} className={styles.button}>
            Dupliquer le devis
          </button>
        ) : (
          <button
            onClick={() => navigate(`/duplicate-quotation/${duplicateQuotationId}`)}
            className={styles.button}
          >
            Voir le devis dupliqué
          </button>
        )}
      </div>
    </div>
  );
}
