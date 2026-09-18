const text = `INSTITUT RÉGIONAL AFRICAIN DI
ve L'INFORMATION GÉOSPATI û
= aa INFORMATION GÉOSPATIALE (AFRIG
{CAMPUS UNIVERSITAIRE OBAFEMI AWOLOWO, ILÆIFE, NI
Dépa \\rtement des sciences de l'information géographique
PGD - Master professionnel / Examen du deuxième 4 1e 2025/2026)
75727 RS
023 1 Analvs et moûélsatton des données géograptitisen
Durée : Trois mr. _
Purée Trois@pheues___ate:0#65206
INSTRUCTION : Répondez à trois (3) questions au choix.`;

const fullText = text.toUpperCase();

const semestreMatch = fullText.match(/(?:SEMESTRE|S)\s*:?\s*([1-9])/);
const isS2 = fullText.match(/(DEUXI[EÈÉ]ME|SECOND)/);
const isS1 = fullText.match(/(PREMIER)/);
console.log("Semestre isS2:", isS2 !== null);

const filiereInput = { value: "" };
const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
const deptLine = lines.find(l => l.match(/(d[ée]pa[\s\\r]*tement|institut|faculté|université|école)/i));
if (deptLine) filiereInput.value = deptLine.substring(0, 60).replace(/\\/g, '');
console.log("Filiere:", filiereInput.value);

const codeMatch = text.match(/(?:Code(?: du cours)?|UE)\s*:?\s*([A-Za-z0-9\s-]{3,15})(?:\n|$)/i) || text.match(/\b([A-Z]{2,4}[.\s-]?[0-9]{3}|[0-9]{3}[.\s-]?[0-9]{1,3})\b/);
console.log("CodeMatch:", codeMatch ? codeMatch[1].trim() : null);

const matiereInput = { value: "" };
const matiereMatch = text.match(/(?:Mati[èe]re|Module|[ÉE]preuve|Examen(?:\s+de)?)\s*:?\s*([A-Za-zÀ-ÿ0-9\s-']{3,60})(?:\n|$)/i);
if (matiereMatch && !matiereMatch[1].match(/deuxi|premier|master|licence/i)) {
    matiereInput.value = matiereMatch[1].trim();
} else if (codeMatch) {
    const codeLine = lines.find(l => l.includes(codeMatch[1]));
    if (codeLine) {
        matiereInput.value = codeLine.replace(codeMatch[1], '').replace(/^[-\s]+/, '').trim();
    }
}
console.log("Matiere:", matiereInput.value);
