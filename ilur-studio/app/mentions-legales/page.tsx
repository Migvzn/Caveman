import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };

// [À COMPLÉTER] : remplace les informations entre crochets par celles de ta société.
export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated="OCTOBRE 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site ilur.studio est édité par [Raison sociale], [forme juridique] au capital de [montant] €, immatriculée au RCS de [ville] sous le numéro [SIREN], dont
          le siège social est situé [adresse complète].
        </p>
        <p>Directeur de la publication : [Nom Prénom]. Contact : [adresse e-mail].</p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>Le site est hébergé par [Hébergeur, ex. Vercel Inc.], [adresse de l&apos;hébergeur].</p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus du site (logo ILUR, lettrage, photographies, textes, visuels des produits) est la propriété exclusive d&apos;ILUR.STUDIO. Toute
          reproduction, même partielle, sans autorisation écrite est interdite.
        </p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>
          Les adresses e-mail collectées via la liste d&apos;accès anticipé et la newsletter servent uniquement à t&apos;informer des drops ILUR. Tu peux te désinscrire
          à tout moment via le lien présent dans chaque e-mail, ou en écrivant à [adresse e-mail]. Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de
          rectification et de suppression de tes données.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Le site n&apos;utilise que le stockage local de ton navigateur pour conserver ton panier. Aucun cookie publicitaire n&apos;est déposé.</p>
      </section>
    </LegalPage>
  );
}
