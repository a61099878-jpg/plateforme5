import puppeteer from 'puppeteer';
import { Student } from '../db/schema';
import fs from 'fs';
import path from 'path';

export interface ConventionData {
  student: Student;
  typeStage: string;
  dateGeneration: string;
}

export function getStageType(annee: number): string {
  switch (annee) {
    case 1:
      return 'initiation';
    case 2:
      return 'fin_annee';
    case 3:
      return 'fin_etudes';
    default:
      return 'initiation';
  }
}

export function getStageTitle(typeStage: string): string {
  switch (typeStage) {
    case 'initiation':
      return 'Stage d\'Initiation';
    case 'fin_annee':
      return 'Stage de Fin d\'Année';
    case 'fin_etudes':
      return 'Stage de Fin d\'Études';
    default:
      return 'Stage';
  }
}

export function loadHtmlTemplate(typeStage: string): string {
  const templatePath = path.join(process.cwd(), 'src', 'templates', `convention_${typeStage}.html`);
  
  try {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf8');
    }
  } catch (error) {
    console.log(`Template spécifique non trouvé: ${templatePath}`);
  }

  // Template par défaut si le spécifique n'existe pas
  const defaultTemplate = path.join(process.cwd(), 'src', 'templates', 'convention_default.html');
  
  try {
    if (fs.existsSync(defaultTemplate)) {
      return fs.readFileSync(defaultTemplate, 'utf8');
    }
  } catch (error) {
    console.log('Template par défaut non trouvé, utilisation du template intégré');
  }

  // Template intégré en cas d'absence de fichiers
  return getDefaultTemplate();
}

export function getDefaultTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convention de Stage - {{typeStageTitle}}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 40px;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #d32f2f;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
        }
        .content {
            margin: 30px 0;
        }
        .student-info {
            background: #f5f5f5;
            padding: 20px;
            border-left: 4px solid #d32f2f;
            margin: 20px 0;
        }
        .info-row {
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature {
            text-align: center;
            width: 200px;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
        @media print {
            body { margin: 20px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">ÉCOLE NATIONALE SUPÉRIEURE D'ARTS ET MÉTIERS</div>
        <div style="font-size: 16px; margin: 10px 0;">ENSAM - RABAT</div>
        <div class="title">Convention de {{typeStageTitle}}</div>
    </div>

    <div class="content">
        <p><strong>Année Universitaire:</strong> 2024-2025</p>
        
        <div class="student-info">
            <h3>Informations de l'étudiant(e)</h3>
            <div class="info-row">
                <span class="label">Nom complet:</span> {{studentNom}}
            </div>
            <div class="info-row">
                <span class="label">Email:</span> {{studentEmail}}
            </div>
            <div class="info-row">
                <span class="label">Téléphone:</span> {{studentTelephone}}
            </div>
            <div class="info-row">
                <span class="label">Filière:</span> {{studentFiliere}}
            </div>
            <div class="info-row">
                <span class="label">Année:</span> {{studentAnnee}}ème année
            </div>
            <div class="info-row">
                <span class="label">Code Apogée:</span> {{studentCodeApogee}}
            </div>
            <div class="info-row">
                <span class="label">CNE:</span> {{studentCne}}
            </div>
            <div class="info-row">
                <span class="label">CIN:</span> {{studentCin}}
            </div>
            <div class="info-row">
                <span class="label">Date de naissance:</span> {{studentDateNaissance}}
            </div>
        </div>

        <h3>Objectifs du stage</h3>
        {{stageObjectifs}}

        <h3>Durée et période</h3>
        {{stageDuree}}

        <h3>Modalités d'encadrement</h3>
        {{stageEncadrement}}

        <h3>Modalités d'évaluation</h3>
        {{stageEvaluation}}
    </div>

    <div class="footer">
        <div class="signature">
            <div>Signature de l'étudiant(e)</div>
            <div style="height: 60px;"></div>
            <div>Date: {{dateGeneration}}</div>
        </div>
        <div class="signature">
            <div>Cachet et signature de l'administration</div>
            <div style="height: 60px;"></div>
            <div>Date: ________________</div>
        </div>
    </div>
</body>
</html>`;
}

export function getStageContent(typeStage: string): any {
  switch (typeStage) {
    case 'initiation':
      return {
        objectifs: `
        <p>Le stage d'initiation en première année vise à :</p>
        <ul>
            <li>Découvrir le monde professionnel et l'entreprise</li>
            <li>Acquérir une première expérience pratique</li>
            <li>Développer les compétences relationnelles</li>
            <li>Confirmer l'orientation professionnelle</li>
        </ul>`,
        duree: `
        <p><strong>Durée:</strong> 4 à 6 semaines</p>
        <p><strong>Période:</strong> Été de la première année</p>`,
        encadrement: `
        <p>L'étudiant sera encadré par :</p>
        <ul>
            <li>Un tuteur professionnel dans l'entreprise</li>
            <li>Un enseignant référent de l'ENSAM</li>
        </ul>`,
        evaluation: `
        <p>L'évaluation se basera sur :</p>
        <ul>
            <li>Rapport de stage (60%)</li>
            <li>Évaluation du tuteur professionnel (25%)</li>
            <li>Soutenance orale (15%)</li>
        </ul>`
      };
    
    case 'fin_annee':
      return {
        objectifs: `
        <p>Le stage de fin d'année en deuxième année vise à :</p>
        <ul>
            <li>Approfondir les connaissances techniques</li>
            <li>Participer à des projets concrets</li>
            <li>Développer l'autonomie professionnelle</li>
            <li>Préparer l'insertion en stage de fin d'études</li>
        </ul>`,
        duree: `
        <p><strong>Durée:</strong> 6 à 8 semaines</p>
        <p><strong>Période:</strong> Été de la deuxième année</p>`,
        encadrement: `
        <p>L'étudiant sera encadré par :</p>
        <ul>
            <li>Un maître de stage dans l'entreprise</li>
            <li>Un enseignant référent de l'ENSAM</li>
            <li>Visites périodiques de suivi</li>
        </ul>`,
        evaluation: `
        <p>L'évaluation se basera sur :</p>
        <ul>
            <li>Rapport de stage détaillé (50%)</li>
            <li>Évaluation du maître de stage (30%)</li>
            <li>Soutenance avec jury (20%)</li>
        </ul>`
      };
    
    case 'fin_etudes':
      return {
        objectifs: `
        <p>Le stage de fin d'études en troisième année vise à :</p>
        <ul>
            <li>Réaliser un projet d'ingénieur complet</li>
            <li>Mettre en application l'ensemble des connaissances acquises</li>
            <li>Préparer l'insertion professionnelle</li>
            <li>Développer l'expertise dans la spécialité choisie</li>
        </ul>`,
        duree: `
        <p><strong>Durée:</strong> 4 à 6 mois</p>
        <p><strong>Période:</strong> Dernière année d'études</p>`,
        encadrement: `
        <p>L'étudiant sera encadré par :</p>
        <ul>
            <li>Un ingénieur tuteur dans l'entreprise</li>
            <li>Un directeur de mémoire à l'ENSAM</li>
            <li>Comité de suivi tripartite</li>
        </ul>`,
        evaluation: `
        <p>L'évaluation se basera sur :</p>
        <ul>
            <li>Mémoire de fin d'études (40%)</li>
            <li>Évaluation entreprise (30%)</li>
            <li>Soutenance devant jury d'experts (30%)</li>
        </ul>`
      };
    
    default:
      return {
        objectifs: '<p>Objectifs du stage à définir selon le type.</p>',
        duree: '<p>Durée à définir selon le niveau.</p>',
        encadrement: '<p>Modalités d\'encadrement à définir.</p>',
        evaluation: '<p>Modalités d\'évaluation à définir.</p>'
      };
  }
}

export function replaceTemplateVariables(template: string, data: ConventionData): string {
  const stageContent = getStageContent(data.typeStage);
  
  return template
    .replace(/{{typeStageTitle}}/g, getStageTitle(data.typeStage))
    .replace(/{{studentNom}}/g, data.student.nom)
    .replace(/{{studentEmail}}/g, data.student.email)
    .replace(/{{studentTelephone}}/g, data.student.telephone || 'Non renseigné')
    .replace(/{{studentFiliere}}/g, data.student.filiere)
    .replace(/{{studentAnnee}}/g, data.student.annee.toString())
    .replace(/{{studentCodeApogee}}/g, data.student.codeApogee)
    .replace(/{{studentCne}}/g, data.student.cne)
    .replace(/{{studentCin}}/g, data.student.cin)
    .replace(/{{studentDateNaissance}}/g, data.student.dateNaissance)
    .replace(/{{dateGeneration}}/g, data.dateGeneration)
    .replace(/{{stageObjectifs}}/g, stageContent.objectifs)
    .replace(/{{stageDuree}}/g, stageContent.duree)
    .replace(/{{stageEncadrement}}/g, stageContent.encadrement)
    .replace(/{{stageEvaluation}}/g, stageContent.evaluation);
}

export async function generateConventionPDF(student: Student): Promise<Buffer> {
  const typeStage = getStageType(student.annee);
  const dateGeneration = new Date().toLocaleDateString('fr-FR');
  
  const conventionData: ConventionData = {
    student,
    typeStage,
    dateGeneration
  };

  const htmlTemplate = loadHtmlTemplate(typeStage);
  const htmlContent = replaceTemplateVariables(htmlTemplate, conventionData);

  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    throw new Error('Impossible de générer le PDF');
  }
}