const text = `INSTITUT RÉGIONAL AFRICAIN DI
ve L'INFORMATION GÉOSPATI û
= eau INFORMATION GÉOSPATIALE (AFRIG
{CAMPUS UNIVERSITAIRE ONAFEMI AWOLOWO,| EN
Dépa irtement des sciences de l'information géographique
PGD - Master professionnel / Examen du deuxièmes 1. 2025/2026)
mess...
023.1 Analvs et moilélsatton des données géograptitisen
Durée : Trois ro _
Purée Trois(@pheues___ate:o#65206
INSTRUCTION : Répondez à trois (3) questions au choix.`;

const fullText = text.toUpperCase();

// Année : OK
const anneeMatch = fullText.match(/(?:ANN[EÉ]E(?: UNIVERSITAIRE)?\s*:?\s*)?(20[1-9][0-9]\s*[-/]\s*20[1-9][0-9])/);
console.log("Annee:", anneeMatch ? anneeMatch[1] : "not found");

// Semestre : OK
const semestreMatch = fullText.match(/(?:SEMESTRE|S)\s*:?\s*([1-9])/);
console.log("Semestre:", semestreMatch ? semestreMatch[1] : "not found");

// Filière : Allow typos in "Département", allow apostrophes
const filiereMatch = text.match(/(?:Fili[èe]re|Parcours|D[éepa]+[\s-]*irtement|D[ée]partement)\s*:?\s*([A-Za-zÀ-ÿ0-9\s-']+)(?:\n|$)/i);
console.log("Filiere:", filiereMatch ? filiereMatch[1].trim() : "not found");

// If not found, use fallback for Filière
let filiere = filiereMatch ? filiereMatch[1].trim() : "";
if (!filiere) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    // Find a line that looks like a department or school
    const deptLine = lines.find(l => l.match(/(département|institut|faculté|université|école)/i));
    if (deptLine) filiere = deptLine.substring(0, 50);
}
console.log("Filiere (fallback):", filiere);

// Code : 3-4 letters followed by digits, or digits with dots
const codeMatch = text.match(/(?:Code(?: du cours)?|UE)\s*:?\s*([A-Za-z0-9\s-]{3,15})(?:\n|$)/i) || text.match(/\b([A-Z]{2,4}\s*[0-9]{3}|[0-9]{3}\.[0-9]+)\b/);
console.log("Code:", codeMatch ? codeMatch[1].trim() : "not found");

// Matière : Very hard if no label. We can look for the line containing the code and take the rest of it, or line after PGD/Master/Licence
let matiere = "";
const matiereMatch = text.match(/(?:Mati[èe]re|Module|[ÉE]preuve|Examen(?:\s+de)?)\s*:?\s*([A-Za-zÀ-ÿ0-9\s-']{3,60})(?:\n|$)/i);
if (matiereMatch) {
    matiere = matiereMatch[1].trim();
} else if (codeMatch) {
    // find the line with the code
    const lines = text.split('\n');
    const codeLine = lines.find(l => l.includes(codeMatch[1]));
    if (codeLine) {
        matiere = codeLine.replace(codeMatch[1], '').trim();
    }
}
console.log("Matiere:", matiere);

const dateMatch = text.match(/(?:Date)\s*:?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i);
console.log("Date:", dateMatch ? dateMatch[1] : "not found");

const instructionMatch = text.match(/(?:INSTRUCTION|DIRECTIVE|NOTE)\s*:?\s*(.+)/i);
console.log("Instruction:", instructionMatch ? instructionMatch[1] : "not found");
