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

// Code Matière
const codeMatch = text.match(/(?:Code(?: du cours)?|UE)\s*:?\s*([A-Za-z0-9\s-]{3,15})(?:\n|$)/i) || text.match(/\b([A-Z]{2,4}\s*[0-9]{3}|[0-9]{3}\.[0-9]+)\b/);
console.log("CodeMatch full array:", codeMatch);
if (codeMatch) {
    console.log("CodeMatch[1]:", codeMatch[1].trim());
}

const matiereInput = { value: "" };
const matiereMatch = text.match(/(?:Mati[èe]re|Module|[ÉE]preuve|Examen(?:\s+de)?)\s*:?\s*([A-Za-zÀ-ÿ0-9\s-']{3,60})(?:\n|$)/i);
console.log("matiereMatch:", matiereMatch);
if (matiereMatch) {
    matiereInput.value = matiereMatch[1].trim();
} else if (codeMatch) {
    const lines = text.split('\n');
    const codeLine = lines.find(l => l.includes(codeMatch[1]));
    if (codeLine) {
        matiereInput.value = codeLine.replace(codeMatch[1], '').trim();
    }
}
console.log("Matiere:", matiereInput.value);

const semestreMatch = text.match(/(?:SEMESTRE|S|deuxi[èe]me)\s*:?\s*([1-9]?)/i);
console.log("Semestre:", semestreMatch);

