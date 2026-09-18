document.addEventListener('DOMContentLoaded', () => {
    // Initialize storage
    StorageManager.init();

    // =============================================
    // MODE ADMIN : Détection par hash URL
    // Exemple : index.html#admin-MonMotDePasse
    // =============================================
    const hash = window.location.hash;
    const isAdmin = hash.startsWith('#admin-');

    if (isAdmin) {
        // Afficher les éléments admin
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
        document.getElementById('adminBadge').style.display = '';

        // Pré-remplir les paramètres admin
        const password = hash.replace('#admin-', '');
        const settingsPassword = document.getElementById('settingsAdminPassword');
        const settingsUrl = document.getElementById('settingsAdminUrl');
        if (settingsPassword) settingsPassword.value = password;
        if (settingsUrl) settingsUrl.textContent = window.location.href;

        // Charger la clé Gemini dans le champ paramètres
        const savedKey = StorageManager.getGeminiKey();
        if (savedKey && document.getElementById('settingsGeminiKey')) {
            document.getElementById('settingsGeminiKey').value = savedKey;
        }
        const savedOcrKey = StorageManager.getOcrKey();
        if (savedOcrKey && document.getElementById('settingsOcrKey')) {
            document.getElementById('settingsOcrKey').value = savedOcrKey;
        }
    }

    // DOM Elements
    const elements = {
        searchInput: document.getElementById('searchInput'),
        filiereFilter: document.getElementById('filiereFilter'),
        anneeFilter: document.getElementById('anneeFilter'),
        semestreFilter: document.getElementById('semestreFilter'),
        matiereFilter: document.getElementById('matiereFilter'),
        sortSelect: document.getElementById('sortSelect'),
        subjectsGrid: document.getElementById('subjectsGrid'),

        // Stats
        totalSujets: document.getElementById('totalSujets'),
        totalMatieres: document.getElementById('totalMatieres'),
        totalAnnees: document.getElementById('totalAnnees'),
        totalSemestres: document.getElementById('totalSemestres'),

        // Modals
        viewModal: document.getElementById('viewModal'),
        uploadModal: document.getElementById('uploadModal'),
        formModal: document.getElementById('formModal'),
        settingsModal: document.getElementById('settingsModal'),
        subjectForm: document.getElementById('subjectForm'),

        // Buttons
        btnAddSubject: document.getElementById('btnAddSubject'),
        btnSettings: document.getElementById('btnSettings'),
        btnFormCancel: document.getElementById('btnFormCancel'),
        btnUploadCancel: document.getElementById('btnUploadCancel'),
        btnUploadSave: document.getElementById('btnUploadSave'),
        btnSettingsCancel: document.getElementById('btnSettingsCancel'),
        btnSettingsSave: document.getElementById('btnSettingsSave'),

        // Upload UI
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        uploadFormsContainer: document.getElementById('uploadFormsContainer'),

        // Form inputs
        formId: document.getElementById('formId'),
        formFiliere: document.getElementById('formFiliere'),
        formAnnee: document.getElementById('formAnnee'),
        formSemestre: document.getElementById('formSemestre'),
        formCodeMatiere: document.getElementById('formCodeMatiere'),
        formMatiere: document.getElementById('formMatiere'),
        formTitre: document.getElementById('formTitre'),
        formDescription: document.getElementById('formDescription'),
        formLangue: document.getElementById('formLangue'),
        formTexteComplet: document.getElementById('formTexteComplet'),

        // Notifications
        notification: document.getElementById('notification')
    };

    // Upload state
    let uploadedFiles = []; // Array of { file, dataUrl }
    let currentViewSubjectId = null; // Sujet actuellement ouvert dans viewModal

    let allSubjects = StorageManager.getSubjects();
    let currentSubjects = [...allSubjects];

    // Initialize App
    updateFiltersOptions();
    updateStats();
    renderSubjects();
    bindEvents();

    function bindEvents() {
        // Search and Filters
        elements.searchInput.addEventListener('input', handleSearchAndFilter);
        elements.filiereFilter.addEventListener('change', handleSearchAndFilter);
        elements.anneeFilter.addEventListener('change', handleSearchAndFilter);
        elements.semestreFilter.addEventListener('change', handleSearchAndFilter);
        elements.matiereFilter.addEventListener('change', handleSearchAndFilter);
        elements.sortSelect.addEventListener('change', handleSearchAndFilter);

        // Modals (admin only)
        if (elements.btnAddSubject) {
            elements.btnAddSubject.addEventListener('click', () => openUploadModal());
        }
        if (elements.btnSettings) {
            elements.btnSettings.addEventListener('click', () => openSettingsModal());
        }
        elements.btnFormCancel.addEventListener('click', () => closeModals());
        elements.subjectForm.addEventListener('submit', handleFormSubmit);

        // Upload modal events
        elements.btnUploadCancel.addEventListener('click', () => closeModals());
        elements.btnUploadSave.addEventListener('click', saveAllUploadedSubjects);

        // Settings modal events
        elements.btnSettingsCancel.addEventListener('click', () => closeModals());
        elements.btnSettingsSave.addEventListener('click', saveSettings);

        // Drop zone
        elements.dropZone.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', (e) => handleFilesSelected(e.target.files));

        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('drag-over');
        });
        elements.dropZone.addEventListener('dragleave', () => {
            elements.dropZone.classList.remove('drag-over');
        });
        elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('drag-over');
            handleFilesSelected(e.dataTransfer.files);
        });

        // Close modals on clicking outside or pressing Escape
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModals();
            });
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModals();
        });

        // Correction IA
        const btnGenerate = document.getElementById('btnGenerateCorrection');
        const btnRegenerate = document.getElementById('btnRegenerateCorrection');
        if (btnGenerate) btnGenerate.addEventListener('click', () => generateCorrection(currentViewSubjectId));
        if (btnRegenerate) btnRegenerate.addEventListener('click', () => generateCorrection(currentViewSubjectId, true));
    }

    // =============================================
    // SETTINGS MODAL
    // =============================================
    function openSettingsModal() {
        const savedKey = StorageManager.getGeminiKey();
        if (document.getElementById('settingsGeminiKey')) {
            document.getElementById('settingsGeminiKey').value = savedKey;
        }
        const savedOcrKey = StorageManager.getOcrKey();
        if (document.getElementById('settingsOcrKey')) {
            document.getElementById('settingsOcrKey').value = savedOcrKey;
        }
        const hash = window.location.hash;
        const password = hash.replace('#admin-', '');
        if (document.getElementById('settingsAdminPassword')) {
            document.getElementById('settingsAdminPassword').value = password;
        }
        if (document.getElementById('settingsAdminUrl')) {
            document.getElementById('settingsAdminUrl').textContent = window.location.href;
        }
        elements.settingsModal.classList.add('active');
    }

    function saveSettings() {
        const key = document.getElementById('settingsGeminiKey')?.value.trim();
        const ocrKey = document.getElementById('settingsOcrKey')?.value.trim();
        if (!key || !ocrKey) {
            showNotification('Veuillez saisir une clé API valide.', 'error');
            return;
        }
        StorageManager.saveGeminiKey(key);
        StorageManager.saveOcrKey(ocrKey);
        showNotification('Clés API enregistrées localement avec succès !', 'success');
        closeModals();
    }

    // =============================================
    // SEARCH & FILTER
    // =============================================
    function handleSearchAndFilter() {
        const query = elements.searchInput.value;
        const filters = {
            filiere: elements.filiereFilter.value,
            annee: elements.anneeFilter.value,
            semestre: elements.semestreFilter.value,
            matiere: elements.matiereFilter.value
        };
        const sortBy = elements.sortSelect.value;

        currentSubjects = SearchEngine.search(allSubjects, query);
        currentSubjects = SearchEngine.filter(currentSubjects, filters);
        currentSubjects = SearchEngine.sort(currentSubjects, sortBy);

        renderSubjects();
    }

    // =============================================
    // RENDER CARDS
    // =============================================
    function renderSubjects() {
        elements.subjectsGrid.innerHTML = '';

        if (currentSubjects.length === 0) {
            elements.subjectsGrid.innerHTML = '<p>Aucun sujet trouvé.</p>';
            return;
        }

        currentSubjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            const adminButtons = isAdmin ? `
                <div>
                    <button class="btn-secondary btn-edit" data-id="${subject.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Modifier</button>
                    <button class="btn-danger btn-delete" data-id="${subject.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Supprimer</button>
                </div>` : '';
            card.innerHTML = `
                <div class="subject-header">
                    <span class="subject-code">${escapeHtml(subject.codeMatiere)}</span>
                    <span class="subject-meta">${escapeHtml(subject.annee)} • ${escapeHtml(subject.semestre)}</span>
                </div>
                <h3 class="subject-title">${escapeHtml(subject.titre)}</h3>
                <div class="subject-course">${escapeHtml(subject.filiere)} - ${escapeHtml(subject.matiere)}</div>
                <div class="subject-actions">
                    <button class="btn btn-view" data-id="${subject.id}">Consulter</button>
                    ${adminButtons}
                </div>
            `;
            elements.subjectsGrid.appendChild(card);
        });

        // Bind buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => viewSubject(parseInt(e.target.dataset.id)));
        });
        if (isAdmin) {
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => openFormModal(parseInt(e.target.dataset.id)));
            });
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => deleteSubject(parseInt(e.target.dataset.id)));
            });
        }
    }

    function updateStats() {
        elements.totalSujets.textContent = allSubjects.length;
        elements.totalMatieres.textContent = new Set(allSubjects.map(s => s.matiere)).size;
        elements.totalAnnees.textContent = new Set(allSubjects.map(s => s.annee)).size;
        elements.totalSemestres.textContent = new Set(allSubjects.map(s => s.semestre)).size;
    }

    function updateFiltersOptions() {
        const populateSelect = (select, items) => {
            const currentVal = select.value;
            select.innerHTML = '<option value="">Tous</option>';
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                select.appendChild(opt);
            });
            if (items.includes(currentVal)) {
                select.value = currentVal;
            }
        };

        const filieres = [...new Set(allSubjects.map(s => s.filiere))].sort();
        const annees = [...new Set(allSubjects.map(s => s.annee))].sort().reverse();
        const semestres = [...new Set(allSubjects.map(s => s.semestre))].sort();
        const matieres = [...new Set(allSubjects.map(s => s.matiere))].sort();

        populateSelect(elements.filiereFilter, filieres);
        populateSelect(elements.anneeFilter, annees);
        populateSelect(elements.semestreFilter, semestres);
        populateSelect(elements.matiereFilter, matieres);
    }

    // =============================================
    // VIEW SUBJECT MODAL
    // =============================================
    function viewSubject(id) {
        const subject = allSubjects.find(s => s.id === id);
        if (!subject) return;
        currentViewSubjectId = id;

        document.getElementById('viewTitle').textContent = subject.titre;
        document.getElementById('viewCode').textContent = subject.codeMatiere;
        document.getElementById('viewMatiere').textContent = subject.matiere;
        document.getElementById('viewFiliere').textContent = subject.filiere;
        document.getElementById('viewAnnee').textContent = subject.annee;
        document.getElementById('viewSemestre').textContent = subject.semestre;
        document.getElementById('viewTexte').textContent = subject.texteComplet;

        const viewImage = document.getElementById('viewImage');
        const imgSrc = subject.imageBase64 || subject.image || '';
        if (imgSrc) {
            viewImage.src = imgSrc;
            viewImage.style.display = 'block';
        } else {
            viewImage.style.display = 'none';
            viewImage.src = '';
        }

        // Section analyse IA des figures
        const analyseSection = document.getElementById('viewAnalyseSection');
        const analyseDiv = document.getElementById('viewAnalyse');
        if (subject.analyseImages) {
            analyseDiv.innerHTML = markdownToHtml(subject.analyseImages);
            analyseSection.style.display = 'block';
        } else {
            analyseSection.style.display = 'none';
        }

        // Section correction IA
        const correctionContent = document.getElementById('correctionContent');
        const btnGenerate = document.getElementById('btnGenerateCorrection');
        const btnRegenerate = document.getElementById('btnRegenerateCorrection');
        const correctionLoading = document.getElementById('correctionLoading');

        const savedCorrection = StorageManager.getCorrection(id);
        correctionLoading.style.display = 'none';
        if (savedCorrection) {
            correctionContent.innerHTML = markdownToHtml(savedCorrection);
            correctionContent.style.display = 'block';
            btnGenerate.style.display = 'none';
            btnRegenerate.style.display = '';
        } else {
            correctionContent.style.display = 'none';
            correctionContent.innerHTML = '';
            btnGenerate.style.display = '';
            btnRegenerate.style.display = 'none';
        }

        elements.viewModal.classList.add('active');

        // Copy button
        const copyBtn = document.getElementById('btnCopyText');
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(subject.texteComplet).then(() => {
                showNotification('Texte copié !', 'success');
            }).catch(() => {
                showNotification('Erreur de copie', 'error');
            });
        };

        // Print button
        const printBtn = document.getElementById('btnPrint');
        printBtn.onclick = () => window.print();
    }

    // =============================================
    // CORRECTION IA (Gemini)
    // =============================================
    async function generateCorrection(id, forceRegenerate = false) {
        const subject = allSubjects.find(s => s.id === id);
        if (!subject) return;

        const geminiKey = StorageManager.getGeminiKey();
        if (!geminiKey) {
            if (isAdmin) {
                showNotification('⚙️ Veuillez d\'abord configurer votre clé API Gemini dans les Paramètres.', 'warning');
                openSettingsModal();
            } else {
                showNotification('Fonctionnalité non disponible. Clé API non configurée.', 'error');
            }
            return;
        }

        const correctionContent = document.getElementById('correctionContent');
        const correctionLoading = document.getElementById('correctionLoading');
        const btnGenerate = document.getElementById('btnGenerateCorrection');
        const btnRegenerate = document.getElementById('btnRegenerateCorrection');

        correctionLoading.style.display = 'block';
        correctionContent.style.display = 'none';
        btnGenerate.style.display = 'none';
        btnRegenerate.style.display = 'none';

        const prompt = `Tu es un professeur expert en ${subject.matiere}. 
Voici le sujet d'examen de "${subject.titre}" (${subject.annee}, ${subject.semestre}) :

---
${subject.texteComplet}
---

Génère une correction type complète et détaillée, question par question. 
Pour chaque question, donne :
1. La réponse complète et justifiée
2. Les points clés à mentionner
3. Les erreurs fréquentes à éviter

Formate ta réponse en Markdown avec des titres clairs (## Question 1, ## Question 2, etc.).
Si des calculs ou formules sont nécessaires, explique chaque étape.`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: 4096 }
                    })
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || `Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            const correction = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!correction) throw new Error('Réponse vide de l\'API Gemini');

            StorageManager.saveCorrection(id, correction);
            correctionContent.innerHTML = markdownToHtml(correction);
            correctionContent.style.display = 'block';
            btnRegenerate.style.display = '';
            showNotification('✨ Correction générée avec succès !', 'success');

        } catch (err) {
            console.error('Gemini Correction Error:', err);
            showNotification(`Erreur Gemini : ${err.message}`, 'error');
            btnGenerate.style.display = '';
        } finally {
            correctionLoading.style.display = 'none';
        }
    }

    // =============================================
    // ANALYSE IA DES FIGURES (Gemini Vision)
    // =============================================
    async function analyzeImageWithGemini(dataUrl) {
        const geminiKey = StorageManager.getGeminiKey();
        if (!geminiKey) return null;

        // Extraire le base64 pur (sans le préfixe data:image/...;base64,)
        const base64Data = dataUrl.split(',')[1];
        const mimeType = dataUrl.split(';')[0].split(':')[1];

        const prompt = `Analyse cette image d'un sujet d'examen académique.
Décris en détail UNIQUEMENT les éléments visuels suivants (ignorer le texte des questions) :
- Les cartes géographiques (localisation, légende, éléments représentés)
- Les schémas, diagrammes, graphiques
- Les tableaux de données
- Les figures ou images illustratives
- Les rasters, grilles ou matrices de données

Si tu ne vois aucun de ces éléments visuels (juste du texte), réponds : "Aucun schéma ou figure détecté."
Formate ta réponse en Markdown avec des listes à puces claires.`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                { inline_data: { mime_type: mimeType, data: base64Data } }
                            ]
                        }],
                        generationConfig: { maxOutputTokens: 1024 }
                    })
                }
            );

            if (!response.ok) throw new Error(`Erreur Gemini Vision HTTP ${response.status}`);

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

        } catch (err) {
            console.warn('Gemini Vision Error (non bloquant):', err.message);
            return null;
        }
    }

    // =============================================
    // UPLOAD MODAL
    // =============================================
    function openUploadModal() {
        uploadedFiles = [];
        elements.fileInput.value = '';
        elements.uploadFormsContainer.innerHTML = '';
        elements.btnUploadSave.disabled = true;
        elements.uploadModal.classList.add('active');
    }

    function handleFilesSelected(files) {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        const readers = imageFiles.map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({ file, dataUrl: e.target.result });
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(results => {
            results.forEach(r => {
                if (!uploadedFiles.find(f => f.file.name === r.file.name)) {
                    uploadedFiles.push(r);
                }
            });
            renderInlineForms();
        });
    }

    function renderInlineForms() {
        elements.uploadFormsContainer.innerHTML = '';

        if (uploadedFiles.length === 0) {
            elements.btnUploadSave.disabled = true;
            return;
        }

        uploadedFiles.forEach((item, index) => {
            const shortName = item.file.name.replace(/\.[^.]+$/, '');
            const div = document.createElement('div');
            div.className = 'upload-image-form';
            div.innerHTML = `
                <div class="upload-image-form-header" data-index="${index}">
                    <img src="${item.dataUrl}" alt="">
                    <span>${escapeHtml(item.file.name)}</span>
                    <button class="btn-remove-upload" data-index="${index}" title="Retirer" style="margin-left:auto;background:rgba(0,0,0,0.15);color:#333;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:1rem;flex-shrink:0;">&times;</button>
                </div>
                <div class="upload-image-form-body" id="formBody_${index}">
                    <div class="form-group">
                        <label>Filière *</label>
                        <input type="text" id="uf_filiere_${index}" placeholder="ex: PM/DESS">
                    </div>
                    <div class="form-group">
                        <label>Année *</label>
                        <input type="text" id="uf_annee_${index}" placeholder="ex: 2025-2026">
                    </div>
                    <div class="form-group">
                        <label>Semestre *</label>
                        <input type="text" id="uf_semestre_${index}" placeholder="ex: S2">
                    </div>
                    <div class="form-group">
                        <label>Code matière *</label>
                        <input type="text" id="uf_code_${index}" placeholder="ex: GIS 621">
                    </div>
                    <div class="form-group full-width">
                        <label>Matière *</label>
                        <input type="text" id="uf_matiere_${index}" placeholder="ex: Analyse Spatiale">
                    </div>
                    <div class="form-group full-width">
                        <label>Titre *</label>
                        <input type="text" id="uf_titre_${index}" value="${escapeHtml(shortName)}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="uf_desc_${index}" placeholder="optionnel">
                    </div>
                    <div class="form-group">
                        <label>Langue</label>
                        <select id="uf_langue_${index}">
                            <option value="fr">Français</option>
                            <option value="en">Anglais</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Texte complet <span style="font-weight:normal;color:var(--text-secondary)">(Extrait via OCR)</span></label>
                        <textarea id="uf_texte_${index}" rows="4" placeholder="Extraction en cours..."></textarea>
                    </div>
                    <div class="form-group full-width" id="geminiAnalyseGroup_${index}" style="display:none;">
                        <label>🗺️ Analyse des figures (Gemini IA) <span style="font-weight:normal;color:var(--text-secondary)"></span></label>
                        <textarea id="uf_analyse_${index}" rows="3" readonly style="background: rgba(99,102,241,0.07);"></textarea>
                    </div>
                </div>
            `;
            elements.uploadFormsContainer.appendChild(div);

            // Remove button
            div.querySelector('.btn-remove-upload').addEventListener('click', (e) => {
                e.stopPropagation();
                uploadedFiles.splice(index, 1);
                renderInlineForms();
            });

            // Trigger OCR + Gemini Vision for this image if not already processed
            if (!item.ocrProcessed) {
                const textarea = document.getElementById(`uf_texte_${index}`);

                // --- OCR.space ---
                const formData = new FormData();
                formData.append('base64Image', item.dataUrl);
                formData.append('language', 'fre');
                formData.append('isOverlayRequired', 'false');
                formData.append('scale', 'true');
                formData.append('OCREngine', '2');

                const ocrKey = StorageManager.getOcrKey();
                if (!ocrKey) {
                    textarea.value = 'Clé OCR non configurée. Ouvrez les paramètres administrateur.';
                }
                if (ocrKey) {
                    fetch('https://api.ocr.space/parse/image', {
                    method: 'POST',
                    headers: { 'apikey': ocrKey },
                    body: formData
                })
                    .then(response => response.json())
                    .then(result => {
                        if (result.IsErroredOnProcessing || !result.ParsedResults) {
                            throw new Error(result.ErrorMessage || "Erreur inconnue");
                        }

                        let text = result.ParsedResults[0].ParsedText;
                        item.ocrProcessed = true;
                        item.extractedText = text;
                        textarea.value = text;

                        // Algorithme d'extraction amélioré avec Regex
                        const fullText = text.toUpperCase();

                        // 1. Année Universitaire
                        const anneeMatch = fullText.match(/(?:ANN[EÉ]E(?: UNIVERSITAIRE)?\s*:?\s*)?(20[1-9][0-9]\s*[-/]\s*20[1-9][0-9])/);
                        if (anneeMatch && document.getElementById(`uf_annee_${index}`)) {
                            document.getElementById(`uf_annee_${index}`).value = anneeMatch[1].replace(/\s/g, '').replace('/', '-');
                        }

                        // 2. Semestre
                        const semestreMatch = fullText.match(/(?:SEMESTRE|S)\s*:?\s*([1-9])/);
                        const isS2 = fullText.match(/(DEUXI[EÈÉ]ME|SECOND)/);
                        const isS1 = fullText.match(/(PREMIER)/);
                        if (document.getElementById(`uf_semestre_${index}`)) {
                            if (semestreMatch) document.getElementById(`uf_semestre_${index}`).value = `S${semestreMatch[1]}`;
                            else if (isS2) document.getElementById(`uf_semestre_${index}`).value = 'S2';
                            else if (isS1) document.getElementById(`uf_semestre_${index}`).value = 'S1';
                        }

                        // 3. Filière / Parcours
                        const filiereInput = document.getElementById(`uf_filiere_${index}`);
                        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                        const deptLine = lines.find(l => l.match(/(d[ée]pa[\s\\r]*tement|institut|faculté|université|école)/i));
                        if (deptLine && filiereInput) {
                            filiereInput.value = deptLine.substring(0, 60).replace(/\\/g, '');
                        }

                        // 4. Code Matière
                        const codeMatch = text.match(/(?:Code(?: du cours)?|UE)\s*:?\s*([A-Za-z0-9\s-]{3,15})(?:\n|$)/i) || text.match(/(?:^|\s|\b)([A-Z]{2,4}[ .-][0-9]{3}|[0-9]{3}[ .-][0-9]{1,3})(?:\s|\b|$)/);
                        if (codeMatch && document.getElementById(`uf_code_${index}`)) {
                            document.getElementById(`uf_code_${index}`).value = codeMatch[1].trim();
                        }

                        // 5. Matière / Epreuve
                        const matiereInput = document.getElementById(`uf_matiere_${index}`);
                        const matiereMatch = text.match(/(?:Mati[èe]re|Module|[ÉE]preuve|Examen(?:\s+de)?)\s*:?\s*([A-Za-zÀ-ÿ0-9\s-']{3,60})(?:\n|$)/i);
                        if (matiereMatch && matiereInput && !matiereMatch[1].match(/deuxi|premier|master|licence/i)) {
                            matiereInput.value = matiereMatch[1].trim();
                        } else if (codeMatch && matiereInput) {
                            const codeLine = lines.find(l => l.includes(codeMatch[1]));
                            if (codeLine) {
                                matiereInput.value = codeLine.replace(codeMatch[1], '').replace(/^[-\s]+/, '').trim();
                            }
                        }

                        // 6. Titre Automatique
                        if (document.getElementById(`uf_titre_${index}`)) {
                            const mat = document.getElementById(`uf_matiere_${index}`)?.value || 'Examen';
                            const ann = document.getElementById(`uf_annee_${index}`)?.value || '';
                            document.getElementById(`uf_titre_${index}`).value = `${mat} ${ann}`.trim();
                        }

                        // 7. Description
                        if (document.getElementById(`uf_desc_${index}`)) {
                            let descText = "";
                            const dateMatch = text.match(/(?:Date)\s*:?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i);
                            if (dateMatch) descText += `Date : ${dateMatch[1]} - `;

                            const instructionMatch = text.match(/(?:INSTRUCTION|DIRECTIVE|NOTE)\s*:?\s*(.+)/i);
                            if (instructionMatch) {
                                descText += instructionMatch[1].trim();
                            }
                            document.getElementById(`uf_desc_${index}`).value = descText.substring(0, 100);
                        }

                    }).catch(err => {
                        console.error("OCR API Error:", err);
                        textarea.placeholder = "Erreur de connexion à l'API OCR. Vérifiez votre connexion.";
                    });
                }

                // --- Gemini Vision (analyse des figures) ---
                analyzeImageWithGemini(item.dataUrl).then(analyseText => {
                    if (analyseText && !analyseText.includes("Aucun schéma")) {
                        item.analyseImages = analyseText;
                        const analyseGroup = document.getElementById(`geminiAnalyseGroup_${index}`);
                        const analyseTextarea = document.getElementById(`uf_analyse_${index}`);
                        if (analyseGroup && analyseTextarea) {
                            analyseTextarea.value = analyseText;
                            analyseGroup.style.display = 'block';
                        }
                    }
                });

            } else {
                document.getElementById(`uf_texte_${index}`).value = item.extractedText || '';
                if (item.analyseImages) {
                    const analyseGroup = document.getElementById(`geminiAnalyseGroup_${index}`);
                    const analyseTextarea = document.getElementById(`uf_analyse_${index}`);
                    if (analyseGroup && analyseTextarea) {
                        analyseTextarea.value = item.analyseImages;
                        analyseGroup.style.display = 'block';
                    }
                }
            }
        });

        elements.btnUploadSave.disabled = false;
    }

    function saveAllUploadedSubjects() {
        if (uploadedFiles.length === 0) return;

        let savedCount = 0;
        let hasError = false;

        uploadedFiles.forEach((item, index) => {
            const filiere = (document.getElementById(`uf_filiere_${index}`)?.value || '').trim();
            const annee = (document.getElementById(`uf_annee_${index}`)?.value || '').trim();
            const semestre = (document.getElementById(`uf_semestre_${index}`)?.value || '').trim();
            const code = (document.getElementById(`uf_code_${index}`)?.value || '').trim();
            const matiere = (document.getElementById(`uf_matiere_${index}`)?.value || '').trim();
            const titre = (document.getElementById(`uf_titre_${index}`)?.value || '').trim();

            if (!filiere || !annee || !semestre || !code || !matiere || !titre) {
                hasError = true;
                const body = document.getElementById(`formBody_${index}`);
                if (body) body.style.outline = '2px solid var(--error-color)';
                return;
            }

            const newSubject = {
                filiere,
                annee,
                semestre,
                codeMatiere: code,
                matiere,
                titre,
                description: (document.getElementById(`uf_desc_${index}`)?.value || '').trim(),
                langue: document.getElementById(`uf_langue_${index}`)?.value || 'fr',
                texteComplet: (document.getElementById(`uf_texte_${index}`)?.value || '').trim(),
                analyseImages: item.analyseImages || null,
                dateAjout: new Date().toISOString().slice(0, 10),
                imageBase64: item.dataUrl
            };

            StorageManager.addSubject(newSubject);
            savedCount++;
        });

        if (hasError) {
            showNotification('⚠ Veuillez remplir tous les champs obligatoires (*).', 'warning');
            return;
        }

        allSubjects = StorageManager.getSubjects();
        updateFiltersOptions();
        updateStats();
        handleSearchAndFilter();
        closeModals();
        showNotification(`${savedCount} sujet(s) ajouté(s) avec succès !`, 'success');
    }

    // =============================================
    // EDIT MODAL (admin only)
    // =============================================
    function openFormModal(id = null) {
        if (!id || !isAdmin) return;
        elements.subjectForm.reset();
        elements.formId.value = '';

        const subject = allSubjects.find(s => s.id === id);
        if (subject) {
            document.getElementById('formTitle').textContent = 'Modifier un sujet';
            elements.formId.value = subject.id;
            elements.formFiliere.value = subject.filiere;
            elements.formAnnee.value = subject.annee;
            elements.formSemestre.value = subject.semestre;
            elements.formCodeMatiere.value = subject.codeMatiere;
            elements.formMatiere.value = subject.matiere;
            elements.formTitre.value = subject.titre;
            elements.formDescription.value = subject.description || '';
            elements.formLangue.value = subject.langue || 'fr';
            elements.formTexteComplet.value = subject.texteComplet || '';
        }

        elements.formModal.classList.add('active');
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        if (!isAdmin) return;

        const formData = {
            filiere: elements.formFiliere.value.trim(),
            annee: elements.formAnnee.value.trim(),
            semestre: elements.formSemestre.value.trim(),
            codeMatiere: elements.formCodeMatiere.value.trim(),
            matiere: elements.formMatiere.value.trim(),
            titre: elements.formTitre.value.trim(),
            description: elements.formDescription.value.trim(),
            langue: elements.formLangue.value,
            texteComplet: elements.formTexteComplet.value.trim(),
        };

        const id = elements.formId.value;
        if (!id) return;

        formData.id = parseInt(id);
        const existing = allSubjects.find(s => s.id === formData.id);
        if (existing) {
            if (existing.image) formData.image = existing.image;
            if (existing.imageBase64) formData.imageBase64 = existing.imageBase64;
            if (existing.analyseImages) formData.analyseImages = existing.analyseImages;
        }

        StorageManager.updateSubject(formData);
        showNotification('Modifications enregistrées avec succès.', 'success');

        allSubjects = StorageManager.getSubjects();
        updateFiltersOptions();
        updateStats();
        handleSearchAndFilter();
        closeModals();
    }

    function deleteSubject(id) {
        if (!isAdmin) return;
        if (confirm('Voulez-vous vraiment supprimer ce sujet ?\nCette action supprimera le sujet de votre archive locale.')) {
            if (StorageManager.deleteSubject(id)) {
                allSubjects = StorageManager.getSubjects();
                updateFiltersOptions();
                updateStats();
                handleSearchAndFilter();
                showNotification('Sujet supprimé.', 'success');
            }
        }
    }

    // =============================================
    // UTILITIES
    // =============================================
    function closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }

    function showNotification(message, type = 'success') {
        elements.notification.textContent = message;
        elements.notification.className = `notification show ${type}`;

        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, 3000);
    }

    // Convertisseur Markdown simplifié vers HTML pour afficher les corrections
    function markdownToHtml(md) {
        if (!md) return '';
        return md
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size:1.05rem;margin-top:1rem;color:var(--primary)">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 style="font-size:1.15rem;margin-top:1rem;">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h|u|l|p])(.+)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '');
    }

    // Helper for HTML escaping
    function escapeHtml(unsafe) {
        return (unsafe || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
