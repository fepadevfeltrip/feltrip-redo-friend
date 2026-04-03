import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Building, Stamp, Calculator, Globe, FileCheck } from "lucide-react";

interface GuideSection {
  id: string;
  icon: typeof FileText;
  title: string;
  content: string;
}

interface GuideContent {
  title: string;
  intro: string;
  sections: GuideSection[];
  countriesWithTreaties: {
    latinAmerica: string[];
    europe: string[];
    asiaOther: string[];
  };
  treatiesTitle: string;
  treatiesIntro: string;
  treatiesBenefits: string;
}

const guideContent: Record<string, GuideContent> = {
  pt: {
    title: "Realidade Contábil para Estrangeiros no Brasil",
    intro: "Esse texto traz um breve resumo da realidade contábil financeira, mas é sempre melhor contratar um profissional.",
    sections: [
      {
        id: "residency",
        icon: FileText,
        title: "Residência Fiscal e CPF",
        content: `Estrangeiros que chegam ao Brasil para estadias superiores a três meses geralmente se tornam residentes fiscais após 183 dias consecutivos ou não em um período de 12 meses, sujeitando-se às regras plenas de tributação como pessoas físicas residentes. Isso exige obtenção imediata do CPF, essencial para qualquer transação financeira, abertura de contas bancárias ou declaração fiscal.

Importante: Ter CPF não significa que você é residente fiscal. Se você possui CPF mas não é residente fiscal (ou seja, não permaneceu 183 dias no Brasil), você NÃO precisa pagar imposto de renda no Brasil. O CPF é apenas um número de identificação para transações; a obrigação tributária só surge quando você se torna residente fiscal.

O CPF para residentes estrangeiros requer documentos como protocolo de autorização de residência, CRNM ou refúgio, e não mais aceita simples identidades estrangeiras a partir de 2026 sem padrões elevados de segurança. Documentos originais em idioma estrangeiro precisam de tradução juramentada por tradutor público habilitado para validade legal em órgãos como Receita Federal.

Estrangeiros que permanecem mais de 183 dias no Brasil, consecutivos ou não, em um período de 12 meses, tornam-se residentes fiscais pela Receita Federal, sujeitando-se à tributação sobre renda mundial a partir dessa data.`
      },
      {
        id: "cartorio",
        icon: Stamp,
        title: "Cartórios no Brasil",
        content: `Cartórios são como aqueles tios excêntricos da família: indispensáveis para qualquer papelada oficial, cobram uma taxa justa (ou nem tanto) e você sempre sai de lá com um carimbo mágico que transforma seu documento em "oficialíssimo". São instituições autônomas, geridas por tabeliões concursados, que monopolizam atos como registros de nascimento, casamento, compra de imóvel, procurações e apostilas de Haia.

O "Ritual Brasileiro" vs. o Resto do Mundo: No Brasil, ir ao cartório é um evento social: você agenda (se der sorte), leva originais, espera na fila com um cafezinho, o tabelião examina tudo com lupa de detetive, digitaliza no sistema CNJ e cola a apostila como se fosse um selo de unicórnio. É presencial ou e-Apostila, mas sempre com análise humana para evitar fraudes.

Em países como Suíça, EUA ou Alemanha, é mais "Netflix e relax": apostilas saem em prefeituras, correios ou online sem tabelião, com QR codes autoexplicativos e zero drama. Na França ou Itália, um carimbo consular basta; no Brasil, sem cartório, seu diploma vira guardanapo.`
      },
      {
        id: "apostille",
        icon: Globe,
        title: "Apostila de Haia",
        content: `O Acordo de Haia permite que documentos públicos estrangeiros sejam apostilados em seu país de origem, dispensando legalização consular para uso no Brasil em 2026, simplificando processos como imigração e cadastros fiscais. Essa apostila deve acompanhar traduções juramentadas quando aplicável, garantindo autenticidade direta em repartições públicas brasileiras.`
      },
      {
        id: "taxes",
        icon: Calculator,
        title: "Imposto de Renda e Juros",
        content: `Residentes fiscais declaram IRPF anualmente sobre renda mundial, com tabela progressiva de 2026 isentando rendas até R$ 5.000 mensais e alíquotas máximas ajustadas para altas rendas. Juros de investimentos em renda fixa seguem tabela regressiva (22,5% a 15% conforme prazo), enquanto JCP tem IRRF de 17,5% a partir de 2026, impactando retornos líquidos para estrangeiros residentes.

Residentes declaram bens, rendas globais e investimentos no IRPF anual, com tabela progressiva de 2026 (0% até R$ 5.000/mês, até 27,5% em faixas altas) e tributação regressiva sobre juros (22,5%-15%). Declaração de Saída Definitiva é dispensada para quem não era residente, mas multas por omissão aplicam-se rigorosamente.`
      },
      {
        id: "translations",
        icon: FileCheck,
        title: "Traduções Juramentadas",
        content: `Documentos legais estrangeiros exigem tradução juramentada no Brasil sempre que destinados a órgãos públicos, judiciais ou administrativos para garantir validade legal. Essa exigência aplica-se principalmente a certidões de nascimento, casamento, óbito e antecedentes criminais, usadas em imigração, cidadania ou registros cartorários.

Documentos Pessoais e Civis: Certidões de registro civil (nascimento, casamento, óbito) necessitam de tradução juramentada para processos migratórios, naturalização ou família na Polícia Federal e cartórios.

Documentos Jurídicos e Financeiros: Contratos, procurações, sentenças judiciais e testamentos requerem tradução para tribunais, heranças ou transações financeiras, sob pena de rejeição judicial.

Áreas de Aplicação: Órgãos como Receita Federal (CPF, IRPF), Polícia Federal (vistos), universidades (diplomas) e cartórios demandam tradução por tradutor público juramentado, precedida de apostila de Haia. Traduções comuns ou automáticas não valem legalmente nesses casos.`
      }
    ],
    treatiesTitle: "Acordos para Evitar Dupla Tributação",
    treatiesIntro: "Em 2026, o Brasil mantém cerca de 37 acordos internacionais para evitar a dupla tributação (ADTs), protegendo estrangeiros residentes de pagar IR sobre a mesma renda em dois países, com compensação ou isenção conforme o tratado específico.",
    treatiesBenefits: "Estrangeiros residentes fiscais no Brasil usam esses ADTs para abater impostos pagos no país de origem contra o IRPF brasileiro, evitando bitributação em investimentos ou remessas. Sem acordo, aplica-se retenção de 25% na fonte para não residentes, mas tratados reduzem para 10-15% em dividendos e juros.",
    countriesWithTreaties: {
      latinAmerica: ["Argentina", "Chile", "Equador", "México", "Peru", "Uruguai", "Venezuela"],
      europe: ["Alemanha", "Áustria", "Dinamarca", "Espanha", "França", "Itália", "Noruega", "Países Baixos", "Portugal", "República Tcheca", "Eslováquia", "Suécia", "Suíça", "Reino Unido"],
      asiaOther: ["China", "Coreia do Sul", "Emirados Árabes Unidos", "Índia", "Israel", "Japão", "Singapura", "Turquia", "Trinidad e Tobago"]
    }
  },
  en: {
    title: "Accounting Reality for Foreign Residents in Brazil",
    intro: "This text provides a brief summary of the financial accounting reality, but it's always better to hire a professional.",
    sections: [
      {
        id: "residency",
        icon: FileText,
        title: "Tax Residency and CPF",
        content: `Foreigners arriving in Brazil for stays longer than three months generally become tax residents after 183 consecutive or non-consecutive days within a 12-month period, becoming subject to full taxation rules as resident individuals. This requires immediate obtention of the CPF, essential for any financial transaction, opening bank accounts, or tax filing.

Important: Having a CPF does not mean you are a tax resident. If you have a CPF but are not a tax resident (i.e., you haven't stayed 183 days in Brazil), you do NOT need to pay income tax in Brazil. The CPF is just an identification number for transactions; the tax obligation only arises when you become a tax resident.

The CPF for foreign residents requires documents such as residence authorization protocol, CRNM or refugee status, and no longer accepts simple foreign IDs from 2026 without high security standards. Original documents in foreign languages need sworn translation by a licensed public translator for legal validity at agencies like the Federal Revenue.

Foreign residents who stay more than 183 days in Brazil, consecutive or not, within a 12-month period, become tax residents by the Federal Revenue, subject to taxation on worldwide income from that date.`
      },
      {
        id: "cartorio",
        icon: Stamp,
        title: "Notary Offices in Brazil",
        content: `Notary offices (Cartórios) are like those eccentric family uncles: indispensable for any official paperwork, they charge a fair fee (or not so fair) and you always leave with a magic stamp that transforms your document into "super official". They are autonomous institutions, managed by licensed notaries, that monopolize acts such as birth, marriage, property purchase, powers of attorney, and Hague apostilles.

The "Brazilian Ritual" vs. the Rest of the World: In Brazil, going to the notary is a social event: you schedule (if you're lucky), bring originals, wait in line with a coffee, the notary examines everything with a detective's magnifying glass, digitizes it in the CNJ system, and attaches the apostille like it's a unicorn seal. It's in-person or e-Apostille, but always with human analysis to prevent fraud.

In countries like Switzerland, USA, or Germany, it's more "Netflix and chill": apostilles come from city halls, post offices, or online without a notary, with self-explanatory QR codes and zero drama. In France or Italy, a consular stamp suffices; in Brazil, without a notary, your diploma becomes a napkin.`
      },
      {
        id: "apostille",
        icon: Globe,
        title: "Hague Apostille",
        content: `The Hague Convention allows foreign public documents to be apostilled in their country of origin, waiving consular legalization for use in Brazil in 2026, simplifying processes like immigration and tax registrations. This apostille must accompany sworn translations when applicable, ensuring direct authenticity in Brazilian public agencies.`
      },
      {
        id: "taxes",
        icon: Calculator,
        title: "Income Tax and Interest",
        content: `Tax residents file annual IRPF on worldwide income, with the 2026 progressive table exempting incomes up to R$ 5,000 monthly and maximum rates adjusted for high incomes. Interest from fixed-income investments follows a regressive table (22.5% to 15% depending on term), while JCP has 17.5% withholding from 2026, impacting net returns for foreign residents.

Residents declare assets, global income, and investments in the annual IRPF, with the 2026 progressive table (0% up to R$ 5,000/month, up to 27.5% in high brackets) and regressive taxation on interest (22.5%-15%). Definitive Departure Declaration is waived for non-residents, but penalties for omission apply rigorously.`
      },
      {
        id: "translations",
        icon: FileCheck,
        title: "Sworn Translations",
        content: `Foreign legal documents require sworn translation in Brazil whenever intended for public, judicial, or administrative agencies to ensure legal validity. This requirement applies mainly to birth, marriage, death certificates and criminal records, used in immigration, citizenship, or notary registrations.

Personal and Civil Documents: Civil registry certificates (birth, marriage, death) need sworn translation for immigration, naturalization, or family processes at the Federal Police and notaries.

Legal and Financial Documents: Contracts, powers of attorney, court judgments, and wills require translation for courts, inheritances, or financial transactions, under penalty of judicial rejection.

Areas of Application: Agencies like Federal Revenue (CPF, IRPF), Federal Police (visas), universities (diplomas), and notaries require translation by a sworn public translator, preceded by Hague apostille. Common or automatic translations are not legally valid in these cases.`
      }
    ],
    treatiesTitle: "Double Taxation Avoidance Treaties",
    treatiesIntro: "In 2026, Brazil maintains about 37 international agreements to avoid double taxation (DTAs), protecting foreign residents from paying income tax on the same income in two countries, with compensation or exemption according to the specific treaty.",
    treatiesBenefits: "Tax-resident foreigners in Brazil use these DTAs to offset taxes paid in their country of origin against Brazilian IRPF, avoiding double taxation on investments or remittances. Without an agreement, 25% withholding at source applies for non-residents, but treaties reduce this to 10-15% on dividends and interest.",
    countriesWithTreaties: {
      latinAmerica: ["Argentina", "Chile", "Ecuador", "Mexico", "Peru", "Uruguay", "Venezuela"],
      europe: ["Germany", "Austria", "Denmark", "Spain", "France", "Italy", "Norway", "Netherlands", "Portugal", "Czech Republic", "Slovakia", "Sweden", "Switzerland", "United Kingdom"],
      asiaOther: ["China", "South Korea", "United Arab Emirates", "India", "Israel", "Japan", "Singapore", "Turkey", "Trinidad and Tobago"]
    }
  },
  es: {
    title: "Realidad Contable para Expatriados en Brasil",
    intro: "Este texto ofrece un breve resumen de la realidad contable financiera, pero siempre es mejor contratar a un profesional.",
    sections: [
      {
        id: "residency",
        icon: FileText,
        title: "Residencia Fiscal y CPF",
        content: `Los extranjeros que llegan a Brasil para estancias superiores a tres meses generalmente se convierten en residentes fiscales después de 183 días consecutivos o no en un período de 12 meses, quedando sujetos a las reglas completas de tributación como personas físicas residentes. Esto requiere la obtención inmediata del CPF, esencial para cualquier transacción financiera, apertura de cuentas bancarias o declaración fiscal.

Importante: Tener CPF no significa que usted es residente fiscal. Si tiene CPF pero no es residente fiscal (es decir, no ha permanecido 183 días en Brasil), NO necesita pagar impuesto sobre la renta en Brasil. El CPF es solo un número de identificación para transacciones; la obligación tributaria solo surge cuando se convierte en residente fiscal.

El CPF para residentes extranjeros requiere documentos como protocolo de autorización de residencia, CRNM o refugio, y ya no acepta simples identidades extranjeras a partir de 2026 sin estándares elevados de seguridad. Los documentos originales en idioma extranjero necesitan traducción jurada por traductor público habilitado para validez legal en órganos como la Receita Federal.

Los expatriados que permanecen más de 183 días en Brasil, consecutivos o no, en un período de 12 meses, se convierten en residentes fiscales por la Receita Federal, quedando sujetos a tributación sobre renta mundial desde esa fecha.`
      },
      {
        id: "cartorio",
        icon: Stamp,
        title: "Notarías en Brasil",
        content: `Las notarías (Cartórios) son como esos tíos excéntricos de la familia: indispensables para cualquier papeleo oficial, cobran una tasa justa (o no tanto) y siempre sales de allí con un sello mágico que transforma tu documento en "oficialísimo". Son instituciones autónomas, gestionadas por notarios concursados, que monopolizan actos como registros de nacimiento, matrimonio, compra de inmuebles, poderes y apostillas de La Haya.

El "Ritual Brasileño" vs. el Resto del Mundo: En Brasil, ir a la notaría es un evento social: agendas (si tienes suerte), llevas originales, esperas en la fila con un cafecito, el notario examina todo con lupa de detective, digitaliza en el sistema CNJ y pega la apostilla como si fuera un sello de unicornio. Es presencial o e-Apostilla, pero siempre con análisis humano para evitar fraudes.

En países como Suiza, EE.UU. o Alemania, es más "Netflix y relax": las apostillas salen de ayuntamientos, correos u online sin notario, con códigos QR autoexplicativos y cero drama. En Francia o Italia, un sello consular basta; en Brasil, sin notaría, tu diploma se convierte en servilleta.`
      },
      {
        id: "apostille",
        icon: Globe,
        title: "Apostilla de La Haya",
        content: `El Convenio de La Haya permite que los documentos públicos extranjeros sean apostillados en su país de origen, dispensando la legalización consular para uso en Brasil en 2026, simplificando procesos como inmigración y registros fiscales. Esta apostilla debe acompañar traducciones juradas cuando aplique, garantizando autenticidad directa en reparticiones públicas brasileñas.`
      },
      {
        id: "taxes",
        icon: Calculator,
        title: "Impuesto sobre la Renta e Intereses",
        content: `Los residentes fiscales declaran IRPF anualmente sobre renta mundial, con tabla progresiva de 2026 exentando rentas hasta R$ 5.000 mensuales y alícuotas máximas ajustadas para altas rentas. Los intereses de inversiones en renta fija siguen tabla regresiva (22,5% a 15% según plazo), mientras que JCP tiene retención de 17,5% desde 2026, impactando rendimientos netos para expatriados.

Los residentes declaran bienes, rentas globales e inversiones en el IRPF anual, con tabla progresiva de 2026 (0% hasta R$ 5.000/mes, hasta 27,5% en franjas altas) y tributación regresiva sobre intereses (22,5%-15%). La Declaración de Salida Definitiva se dispensa para quienes no eran residentes, pero las multas por omisión se aplican rigurosamente.`
      },
      {
        id: "translations",
        icon: FileCheck,
        title: "Traducciones Juradas",
        content: `Los documentos legales extranjeros exigen traducción jurada en Brasil siempre que estén destinados a órganos públicos, judiciales o administrativos para garantizar validez legal. Esta exigencia se aplica principalmente a actas de nacimiento, matrimonio, defunción y antecedentes penales, utilizados en inmigración, ciudadanía o registros notariales.

Documentos Personales y Civiles: Los certificados de registro civil (nacimiento, matrimonio, defunción) necesitan traducción jurada para procesos migratorios, naturalización o familia en la Policía Federal y notarías.

Documentos Jurídicos y Financieros: Contratos, poderes, sentencias judiciales y testamentos requieren traducción para tribunales, herencias o transacciones financieras, bajo pena de rechazo judicial.

Áreas de Aplicación: Órganos como Receita Federal (CPF, IRPF), Policía Federal (visas), universidades (diplomas) y notarías demandan traducción por traductor público juramentado, precedida de apostilla de La Haya. Las traducciones comunes o automáticas no tienen validez legal en estos casos.`
      }
    ],
    treatiesTitle: "Acuerdos para Evitar Doble Tributación",
    treatiesIntro: "En 2026, Brasil mantiene alrededor de 37 acuerdos internacionales para evitar la doble tributación (ADTs), protegiendo a los expatriados de pagar impuesto sobre la renta sobre la misma renta en dos países, con compensación o exención según el tratado específico.",
    treatiesBenefits: "Los expatriados residentes fiscales en Brasil utilizan estos ADTs para descontar impuestos pagados en el país de origen contra el IRPF brasileño, evitando doble tributación en inversiones o remesas. Sin acuerdo, se aplica retención del 25% en la fuente para no residentes, pero los tratados reducen a 10-15% en dividendos e intereses.",
    countriesWithTreaties: {
      latinAmerica: ["Argentina", "Chile", "Ecuador", "México", "Perú", "Uruguay", "Venezuela"],
      europe: ["Alemania", "Austria", "Dinamarca", "España", "Francia", "Italia", "Noruega", "Países Bajos", "Portugal", "República Checa", "Eslovaquia", "Suecia", "Suiza", "Reino Unido"],
      asiaOther: ["China", "Corea del Sur", "Emiratos Árabes Unidos", "India", "Israel", "Japón", "Singapur", "Turquía", "Trinidad y Tobago"]
    }
  },
  fr: {
    title: "Réalité Comptable pour les Expatriés au Brésil",
    intro: "Ce texte donne un bref résumé de la réalité comptable et financière, mais il est toujours préférable d'engager un professionnel.",
    sections: [
      {
        id: "residency",
        icon: FileText,
        title: "Résidence Fiscale et CPF",
        content: `Les étrangers arrivant au Brésil pour des séjours supérieurs à trois mois deviennent généralement résidents fiscaux après 183 jours consécutifs ou non sur une période de 12 mois, soumis aux règles complètes d'imposition des personnes physiques résidentes. Cela nécessite l'obtention immédiate du CPF, essentiel pour toute transaction financière, ouverture de compte bancaire ou déclaration fiscale.

Important : Avoir un CPF ne signifie pas que vous êtes résident fiscal. Si vous avez un CPF mais n'êtes pas résident fiscal (c'est-à-dire que vous n'êtes pas resté 183 jours au Brésil), vous n'avez PAS à payer d'impôt sur le revenu au Brésil. Le CPF n'est qu'un numéro d'identification pour les transactions ; l'obligation fiscale ne naît que lorsque vous devenez résident fiscal.

Le CPF pour les résidents étrangers nécessite des documents tels que le protocole d'autorisation de résidence, CRNM ou statut de réfugié, et n'accepte plus les simples cartes d'identité étrangères à partir de 2026 sans normes de sécurité élevées. Les documents originaux en langue étrangère nécessitent une traduction assermentée par un traducteur public agréé pour validité légale auprès d'organismes comme le Fisc Fédéral.

Les expatriés qui restent plus de 183 jours au Brésil, consécutifs ou non, sur une période de 12 mois, deviennent résidents fiscaux auprès du Fisc Fédéral, soumis à l'imposition sur le revenu mondial à partir de cette date.`
      },
      {
        id: "cartorio",
        icon: Stamp,
        title: "Études Notariales au Brésil",
        content: `Les études notariales (Cartórios) sont comme ces oncles excentriques de la famille : indispensables pour toute paperasse officielle, ils facturent des frais justes (ou pas) et vous sortez toujours avec un tampon magique qui transforme votre document en "super officiel". Ce sont des institutions autonomes, gérées par des notaires assermentés, qui monopolisent les actes tels que les enregistrements de naissance, mariage, achat immobilier, procurations et apostilles de La Haye.

Le "Rituel Brésilien" vs. le Reste du Monde : Au Brésil, aller chez le notaire est un événement social : vous prenez rendez-vous (si vous avez de la chance), apportez les originaux, attendez dans la file avec un petit café, le notaire examine tout avec une loupe de détective, numérise dans le système CNJ et colle l'apostille comme un sceau de licorne. C'est en personne ou e-Apostille, mais toujours avec analyse humaine pour éviter la fraude.

Dans des pays comme la Suisse, les USA ou l'Allemagne, c'est plus "Netflix et chill" : les apostilles sortent des mairies, bureaux de poste ou en ligne sans notaire, avec des QR codes auto-explicatifs et zéro drame. En France ou en Italie, un tampon consulaire suffit ; au Brésil, sans notaire, votre diplôme devient une serviette.`
      },
      {
        id: "apostille",
        icon: Globe,
        title: "Apostille de La Haye",
        content: `La Convention de La Haye permet que les documents publics étrangers soient apostillés dans leur pays d'origine, dispensant de la légalisation consulaire pour utilisation au Brésil en 2026, simplifiant les processus comme l'immigration et les inscriptions fiscales. Cette apostille doit accompagner les traductions assermentées le cas échéant, garantissant l'authenticité directe auprès des administrations publiques brésiliennes.`
      },
      {
        id: "taxes",
        icon: Calculator,
        title: "Impôt sur le Revenu et Intérêts",
        content: `Les résidents fiscaux déclarent l'IRPF annuellement sur le revenu mondial, avec le barème progressif de 2026 exonérant les revenus jusqu'à R$ 5.000 mensuels et des taux maximaux ajustés pour les hauts revenus. Les intérêts des investissements à revenu fixe suivent un barème régressif (22,5% à 15% selon la durée), tandis que le JCP a une retenue de 17,5% à partir de 2026, impactant les rendements nets pour les expatriés.

Les résidents déclarent biens, revenus mondiaux et investissements dans l'IRPF annuel, avec le barème progressif de 2026 (0% jusqu'à R$ 5.000/mois, jusqu'à 27,5% dans les tranches élevées) et imposition régressive sur les intérêts (22,5%-15%). La Déclaration de Départ Définitif est dispensée pour les non-résidents, mais les pénalités pour omission s'appliquent rigoureusement.`
      },
      {
        id: "translations",
        icon: FileCheck,
        title: "Traductions Assermentées",
        content: `Les documents juridiques étrangers exigent une traduction assermentée au Brésil dès qu'ils sont destinés aux organismes publics, judiciaires ou administratifs pour garantir la validité légale. Cette exigence s'applique principalement aux actes de naissance, mariage, décès et casiers judiciaires, utilisés pour l'immigration, la citoyenneté ou les enregistrements notariaux.

Documents Personnels et Civils : Les certificats d'état civil (naissance, mariage, décès) nécessitent une traduction assermentée pour les processus migratoires, naturalisation ou famille auprès de la Police Fédérale et des notaires.

Documents Juridiques et Financiers : Contrats, procurations, jugements et testaments nécessitent une traduction pour les tribunaux, héritages ou transactions financières, sous peine de rejet judiciaire.

Domaines d'Application : Des organismes comme le Fisc Fédéral (CPF, IRPF), la Police Fédérale (visas), les universités (diplômes) et les notaires exigent une traduction par traducteur public assermenté, précédée d'une apostille de La Haye. Les traductions courantes ou automatiques ne sont pas légalement valables dans ces cas.`
      }
    ],
    treatiesTitle: "Conventions de Non Double Imposition",
    treatiesIntro: "En 2026, le Brésil maintient environ 37 accords internationaux pour éviter la double imposition (ADTs), protégeant les expatriés de payer l'impôt sur le revenu sur le même revenu dans deux pays, avec compensation ou exonération selon le traité spécifique.",
    treatiesBenefits: "Les expatriés résidents fiscaux au Brésil utilisent ces ADTs pour déduire les impôts payés dans leur pays d'origine contre l'IRPF brésilien, évitant la double imposition sur les investissements ou transferts. Sans accord, une retenue de 25% à la source s'applique pour les non-résidents, mais les traités réduisent à 10-15% sur les dividendes et intérêts.",
    countriesWithTreaties: {
      latinAmerica: ["Argentine", "Chili", "Équateur", "Mexique", "Pérou", "Uruguay", "Venezuela"],
      europe: ["Allemagne", "Autriche", "Danemark", "Espagne", "France", "Italie", "Norvège", "Pays-Bas", "Portugal", "République Tchèque", "Slovaquie", "Suède", "Suisse", "Royaume-Uni"],
      asiaOther: ["Chine", "Corée du Sud", "Émirats Arabes Unis", "Inde", "Israël", "Japon", "Singapour", "Turquie", "Trinité-et-Tobago"]
    }
  },
  zh: {
    title: "巴西外籍人士会计实务指南",
    intro: "本文提供财务会计实务的简要概述，但建议聘请专业人士。",
    sections: [
      {
        id: "residency",
        icon: FileText,
        title: "税务居民身份与CPF",
        content: `抵达巴西停留超过三个月的外国人，通常在12个月内累计或连续居住183天后成为税务居民，适用完整的个人所得税规则。这需要立即获取CPF，这对于任何金融交易、开设银行账户或税务申报都是必不可少的。

重要提示：拥有CPF并不意味着您是税务居民。如果您有CPF但不是税务居民（即在巴西停留未满183天），您无需在巴西缴纳所得税。CPF只是用于交易的身份识别号码；只有当您成为税务居民时，纳税义务才会产生。

外国居民的CPF需要提供居留授权协议、CRNM或难民身份等文件，自2026年起不再接受没有高安全标准的简单外国身份证件。外语原始文件需要由持证公共翻译进行宣誓翻译，才能在联邦税务局等机构具有法律效力。

在12个月内在巴西停留超过183天（连续或累计）的外籍人士将成为联邦税务局认定的税务居民，从该日期起需就全球收入纳税。`
      },
      {
        id: "cartorio",
        icon: Stamp,
        title: "巴西公证处",
        content: `公证处（Cartórios）就像家里那些古怪的叔叔：任何官方文书都离不开他们，收费合理（也许不那么合理），你总是带着一个神奇的印章离开，把你的文件变成"超级官方"。它们是自治机构，由通过考试的公证员管理，垄断出生登记、结婚登记、房产购买、授权书和海牙认证等行为。

"巴西仪式"vs世界其他地方：在巴西，去公证处是一个社交活动：你预约（如果幸运的话），带上原件，排队喝杯咖啡，公证员像侦探一样用放大镜检查一切，在CNJ系统中数字化，然后像贴独角兽印章一样贴上认证。可以现场办理或电子认证，但始终需要人工分析以防止欺诈。

在瑞士、美国或德国等国家，更像"轻松搞定"：认证从市政厅、邮局或网上获取，无需公证员，带有自解释的二维码，零麻烦。在法国或意大利，领事印章就够了；在巴西，没有公证处，你的文凭就变成餐巾纸。`
      },
      {
        id: "apostille",
        icon: Globe,
        title: "海牙认证",
        content: `海牙公约允许外国公共文件在其原籍国进行认证，免除2026年在巴西使用的领事认证，简化移民和税务登记等流程。该认证在适用时必须附有宣誓翻译，确保在巴西公共机构的直接真实性。`
      },
      {
        id: "taxes",
        icon: Calculator,
        title: "所得税与利息",
        content: `税务居民每年就全球收入申报IRPF，2026年累进税率表免除月收入5,000雷亚尔以下的税款，高收入最高税率有所调整。固定收益投资利息按递减税率征收（根据期限从22.5%到15%），而JCP从2026年起预扣17.5%，影响外籍人士的净收益。

居民在年度IRPF中申报资产、全球收入和投资，2026年累进税率表（每月5,000雷亚尔以下0%，高档最高27.5%）和利息递减税率（22.5%-15%）。非居民免除最终离境申报，但遗漏罚款严格执行。`
      },
      {
        id: "translations",
        icon: FileCheck,
        title: "宣誓翻译",
        content: `外国法律文件在用于巴西公共、司法或行政机构时，需要宣誓翻译以确保法律效力。此要求主要适用于出生证明、结婚证明、死亡证明和无犯罪记录证明，用于移民、公民身份或公证登记。

个人和民事文件：民事登记证明（出生、结婚、死亡）需要宣誓翻译，用于联邦警察和公证处的移民、入籍或家庭程序。

法律和财务文件：合同、授权书、法院判决和遗嘱需要翻译用于法院、遗产或金融交易，否则将被司法拒绝。

应用领域：联邦税务局（CPF、IRPF）、联邦警察（签证）、大学（文凭）和公证处等机构要求由宣誓公共翻译进行翻译，并需先进行海牙认证。普通或自动翻译在这些情况下不具有法律效力。`
      }
    ],
    treatiesTitle: "避免双重征税协定",
    treatiesIntro: "2026年，巴西维持约37项避免双重征税的国际协定（ADTs），保护外籍人士不必在两个国家对同一收入缴纳所得税，根据具体条约进行补偿或豁免。",
    treatiesBenefits: "在巴西的税务居民外籍人士使用这些ADTs抵扣在原籍国缴纳的税款与巴西IRPF，避免投资或汇款的双重征税。没有协定的情况下，对非居民适用25%的源头预扣税，但条约将股息和利息降至10-15%。",
    countriesWithTreaties: {
      latinAmerica: ["阿根廷", "智利", "厄瓜多尔", "墨西哥", "秘鲁", "乌拉圭", "委内瑞拉"],
      europe: ["德国", "奥地利", "丹麦", "西班牙", "法国", "意大利", "挪威", "荷兰", "葡萄牙", "捷克共和国", "斯洛伐克", "瑞典", "瑞士", "英国"],
      asiaOther: ["中国", "韩国", "阿联酋", "印度", "以色列", "日本", "新加坡", "土耳其", "特立尼达和多巴哥"]
    }
  }
};

const regionLabels: Record<string, Record<string, string>> = {
  pt: { latinAmerica: "América Latina", europe: "Europa", asiaOther: "Ásia e Outros" },
  en: { latinAmerica: "Latin America", europe: "Europe", asiaOther: "Asia & Other" },
  es: { latinAmerica: "América Latina", europe: "Europa", asiaOther: "Asia y Otros" },
  fr: { latinAmerica: "Amérique Latine", europe: "Europe", asiaOther: "Asie et Autres" },
  zh: { latinAmerica: "拉丁美洲", europe: "欧洲", asiaOther: "亚洲及其他" }
};

const AccountingGuide = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language.split('-')[0];
  const content = guideContent[lang] || guideContent.en;
  const regions = regionLabels[lang] || regionLabels.en;

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-muted/30 to-background border-primary/10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-primary">{content.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground italic">{content.intro}</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {content.sections.map((section) => {
          const Icon = section.icon;
          return (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-8 pr-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}

        <AccordionItem value="treaties">
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary shrink-0" />
              <span className="font-medium">{content.treatiesTitle}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-8 pr-2 space-y-4">
              <p className="text-sm text-muted-foreground">{content.treatiesIntro}</p>
              
              <div className="grid gap-3">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{regions.latinAmerica}</h4>
                  <p className="text-xs text-muted-foreground">
                    {content.countriesWithTreaties.latinAmerica.join(" • ")}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{regions.europe}</h4>
                  <p className="text-xs text-muted-foreground">
                    {content.countriesWithTreaties.europe.join(" • ")}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">{regions.asiaOther}</h4>
                  <p className="text-xs text-muted-foreground">
                    {content.countriesWithTreaties.asiaOther.join(" • ")}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{content.treatiesBenefits}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default AccountingGuide;
