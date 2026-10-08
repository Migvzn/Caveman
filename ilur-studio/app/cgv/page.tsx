import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { formatPrice, site } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions générales de vente" };

// [À COMPLÉTER] : à faire relire et adapter à ta situation (statut, transporteur, pays livrés).
export default function CGV() {
  return (
    <LegalPage title="Conditions générales de vente" updated="OCTOBRE 2026">
      <section>
        <h2>1. Objet</h2>
        <p>Les présentes conditions régissent les ventes réalisées sur le site ilur.studio par [Raison sociale] auprès de clients particuliers.</p>
      </section>
      <section>
        <h2>2. Produits et drops</h2>
        <p>
          Les pièces ILUR sont produites en séries limitées. Les commandes sont honorées dans la limite des stocks disponibles au moment du paiement. Une pièce
          épuisée n&apos;est pas réassortie.
        </p>
      </section>
      <section>
        <h2>3. Prix</h2>
        <p>Les prix sont indiqués en euros toutes taxes comprises, hors frais de livraison. La livraison est offerte en France métropolitaine dès {formatPrice(site.freeShippingFrom)} d&apos;achat.</p>
      </section>
      <section>
        <h2>4. Commande et paiement</h2>
        <p>La commande est ferme après confirmation du paiement. Le paiement s&apos;effectue par carte bancaire via [prestataire de paiement]. Aucune donnée bancaire n&apos;est stockée par ILUR.STUDIO.</p>
      </section>
      <section>
        <h2>5. Livraison</h2>
        <p>Les commandes sont expédiées sous 48 h ouvrées. Délai indicatif : 2 à 4 jours ouvrés en France métropolitaine. [Pays et délais internationaux à compléter.]</p>
      </section>
      <section>
        <h2>6. Droit de rétractation et retours</h2>
        <p>
          Tu disposes de 14 jours à compter de la réception pour retourner un article non porté, non lavé, avec ses étiquettes. Le remboursement intervient sous 14
          jours après réception du retour. Les frais de retour sont à ta charge sauf article défectueux.
        </p>
      </section>
      <section>
        <h2>7. Service client</h2>
        <p>Pour toute question : [adresse e-mail]. Médiateur de la consommation : [nom et coordonnées du médiateur].</p>
      </section>
    </LegalPage>
  );
}
