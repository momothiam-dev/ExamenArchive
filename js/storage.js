const STORAGE_KEY = "examarchive_subjects";

class StorageManager {
    static init() {
        // Force reset to new data.js (removes old mock subjects)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBJECTS));
    }

    static getSubjects() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return [];
        }
    }

    static saveSubjects(subjects) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    }

    static addSubject(subject) {
        const subjects = this.getSubjects();
        
        // Generate new ID
        const maxId = subjects.reduce((max, sub) => Math.max(max, sub.id), 0);
        subject.id = maxId + 1;
        
        subject.dateAjout = new Date().toISOString().split('T')[0];
        
        subjects.push(subject);
        this.saveSubjects(subjects);
        return subject;
    }

    static updateSubject(updatedSubject) {
        const subjects = this.getSubjects();
        const index = subjects.findIndex(s => s.id === updatedSubject.id);
        if (index !== -1) {
            // preserve dateAjout if not provided
            if (!updatedSubject.dateAjout) {
                updatedSubject.dateAjout = subjects[index].dateAjout;
            }
            subjects[index] = updatedSubject;
            this.saveSubjects(subjects);
            return true;
        }
        return false;
    }

    static deleteSubject(id) {
        let subjects = this.getSubjects();
        const initialLength = subjects.length;
        subjects = subjects.filter(s => s.id !== id);
        
        if (subjects.length < initialLength) {
            this.saveSubjects(subjects);
            return true;
        }
        return false;
    }

    static checkDuplicate(subject) {
        const subjects = this.getSubjects();
        return subjects.some(s => 
            s.codeMatiere.toLowerCase() === subject.codeMatiere.toLowerCase() &&
            s.annee === subject.annee &&
            s.semestre === subject.semestre &&
            s.matiere.toLowerCase() === subject.matiere.toLowerCase() &&
            s.id !== subject.id
        );
    }

    // --- Corrections IA ---
    static saveCorrection(id, correctionText) {
        const key = `examarchive_correction_${id}`;
        localStorage.setItem(key, correctionText);
    }

    static getCorrection(id) {
        return localStorage.getItem(`examarchive_correction_${id}`) || null;
    }

    // --- Clé API Gemini ---
    static saveGeminiKey(apiKey) {
        localStorage.setItem('examarchive_gemini_key', apiKey);
    }

    static getGeminiKey() {
        return localStorage.getItem('examarchive_gemini_key') || '';
    }

    static saveOcrKey(apiKey) {
        localStorage.setItem('examarchive_ocr_key', apiKey);
    }

    static getOcrKey() {
        return localStorage.getItem('examarchive_ocr_key') || '';
    }
}
