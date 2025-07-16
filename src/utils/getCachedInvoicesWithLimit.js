// services/invoicesCache.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { fetchInvoiceById } from "../services/api/invoices";

// 🔁 Fonction utilitaire pour récupérer les infos factures, avec cache Firestore
export async function getCachedInvoicesWithLimit(invoiceIds, limit = 20) {
  const results = {};
  let apiCalls = 0;

  const snapshots = await Promise.all(
    invoiceIds.map((id) => getDoc(doc(db, "cachedInvoices", id.toString())))
  );

  for (let i = 0; i < invoiceIds.length; i++) {
    const invoiceId = invoiceIds[i];
    const snap = snapshots[i];
    const invoiceKey = invoiceId.toString();

    if (snap.exists()) {
      results[invoiceKey] = snap.data();
      continue;
    }

    if (apiCalls >= limit) {
      console.warn(`Limite d'appels API atteinte (max ${limit})`);
      continue;
    }

    try {
      const invoice = await fetchInvoiceById(invoiceId);
      const cachedData = {
        id: invoice.id,
        preTaxAmount: invoice.pre_tax_amount ?? null,
        taxAmount: invoice.tax_amount ?? null,
        totalAmount: (invoice.pre_tax_amount ?? 0) + (invoice.tax_amount ?? 0),
        date: invoice.date,
        publicPath: invoice.public_path ?? null,
        cachedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "cachedInvoices", invoiceKey), cachedData);
      results[invoiceKey] = cachedData;
      apiCalls++;
    } catch (err) {
      console.error(`Erreur API pour la facture ${invoiceId} :`, err);
    }
  }

  return results;
}
