class SearchEngine {
    static normalizeText(text) {
        if (!text) return "";
        return text.toString().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
    }

    static search(subjects, query) {
        if (!query || query.trim() === "") return subjects;

        const normalizedQueryWords = this.normalizeText(query).split(/\s+/);

        return subjects.filter(subject => {
            const searchableText = this.normalizeText(`
                ${subject.titre} 
                ${subject.matiere} 
                ${subject.codeMatiere} 
                ${subject.filiere} 
                ${subject.annee} 
                ${subject.description || ""}
                ${subject.texteComplet || ""}
            `);

            // All words must be present
            return normalizedQueryWords.every(word => searchableText.includes(word));
        });
    }

    static filter(subjects, filters) {
        return subjects.filter(subject => {
            if (filters.filiere && subject.filiere !== filters.filiere) return false;
            if (filters.annee && subject.annee !== filters.annee) return false;
            if (filters.semestre && subject.semestre !== filters.semestre) return false;
            if (filters.matiere && subject.matiere !== filters.matiere) return false;
            return true;
        });
    }

    static sort(subjects, sortBy) {
        const sorted = [...subjects];
        
        switch (sortBy) {
            case "default":
                // Année croissante -> Semestre croissant -> Matière A-Z -> Titre A-Z
                sorted.sort((a, b) => {
                    if (a.annee !== b.annee) return a.annee.localeCompare(b.annee);
                    if (a.semestre !== b.semestre) return a.semestre.localeCompare(b.semestre);
                    if (a.matiere !== b.matiere) return a.matiere.localeCompare(b.matiere);
                    return a.titre.localeCompare(b.titre);
                });
                break;
            case "annee-desc":
                sorted.sort((a, b) => b.annee.localeCompare(a.annee) || a.semestre.localeCompare(b.semestre));
                break;
            case "matiere-asc":
                sorted.sort((a, b) => a.matiere.localeCompare(b.matiere) || a.titre.localeCompare(b.titre));
                break;
            case "matiere-desc":
                sorted.sort((a, b) => b.matiere.localeCompare(a.matiere) || a.titre.localeCompare(b.titre));
                break;
            case "date-desc":
                sorted.sort((a, b) => new Date(b.dateAjout) - new Date(a.dateAjout) || b.id - a.id);
                break;
            case "date-asc":
                sorted.sort((a, b) => new Date(a.dateAjout) - new Date(b.dateAjout) || a.id - b.id);
                break;
        }
        
        return sorted;
    }
}
