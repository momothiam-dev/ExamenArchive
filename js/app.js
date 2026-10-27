document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------
    // 1. Initialisation stockage + mode admin (hash URL #admin-<mdp>)
    // ------------------------------------------------------------------
    StorageManager.init();

    const hash = window.location.hash;
    const isAdmin = hash.startsWith('#admin-');

    if (isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
        document.getElementById('adminBadge').style.display = '';
        const password = hash.replace('#admin-', '');
        const settingsPassword = document.getElementById('settingsAdminPassword');
        const settingsUrl = document.getElementById('settingsAdminUrl');
        if (settingsPassword) settingsPassword.value = password;
        if (settingsUrl) settingsUrl.textContent = window.location.href;
    }

    // ------------------------------------------------------------------
    // 2. Références DOM
    // ------------------------------------------------------------------
    const els = {
        searchInput: document.getElementById('searchInput'),
        filiereFilter: document.getElementById('filiereFilter'),
        anneeFilter: document.getElementById('anneeFilter'),
        semestreFilter: document.getElementById('semestreFilter'),
        matiereFilter: document.getElementById('matiereFilter'),
        sortSelect: document.getElementById('sortSelect'),
        subjectsGrid: document.getElementById('subjectsGrid'),
        emptyState: document.getElementById('emptyState'),
        pagination: document.getElementById('pagination'),
        btnResetFilters: document.getElementById('btnResetFilters'),
        btnResetEmpty: document.getElementById('btnResetEmpty'),

        totalSujets: document.getElementById('totalSujets'),
        totalMatieres: document.getElementById('totalMatieres'),
        totalAnnees: document.getElementById('totalAnnees'),
        totalSemestres: document.getElementById('totalSemestres'),

        viewModal: document.getElementById('viewModal'),
        uploadModal: document.getElementById('uploadModal'),
        formModal: document.getElementById('formModal'),
        settingsModal: document.getElementById('settingsModal'),
        subjectForm: document.getElementById('subjectForm'),

        btnAddSubject: document.getElementById('btnAddSubject'),
        btnSettings: document.getElementById('btnSettings'),
        btnFormCancel: document.getElementById('btnFormCancel'),
        btnUploadCancel: document.getElementById('btnUploadCancel'),
        btnUploadSave: document.getElementById('btnUploadSave'),
        btnSettingsCancel: document.getElementById('btnSettingsCancel'),
        btnSettingsSave: document.getElementById('btnSettingsSave'),

        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        uploadFormsContainer: document.getElementById('uploadFormsContainer'),

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

        themeToggle: document.getElementById('themeToggle'),
        themeIconSun: document.getElementById('themeIconSun'),
        themeIconMoon: document.getElementById('themeIconMoon'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        navLinks: document.getElementById('navLinks'),

        btnBrowse: document.getElementById('btnBrowse'),
        btnHeroSearch: document.getElementById('btnHeroSearch'),

        toastContainer: document.getElementById('toastContainer')
    };

    // ------------------------------------------------------------------
    // 3. État de l'application
    // ------------------------------------------------------------------
    let allSubjects = StorageManager.getSubjects();
    let currentSubjects = [...allSubjects];
    let currentPage = 1;
    const PAGE_SIZE = 12;

    let uploadedFiles = [];          // { file, dataUrl, ocrProcessed, extractedText, analyseImages }
    let currentViewSubjectId = null; // id du sujet ouvert dans la modale détail

    // ------------------------------------------------------------------
    // 4. Thème clair/sombre
    // ------------------------------------------------------------------
    function initTheme() {
        const saved = localStorage.getItem('examarchive_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = saved ? saved === 'dark' : prefersDark;
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        updateThemeIcons(dark);
    }

    function updateThemeIcons(dark) {
        if (els.themeIconSun) els.themeIconSun.style.display = dark ? 'none' : 'inline-block';
        if (els.themeIconMoon) els.themeIconMoon.style.display = dark ? 'inline-block' : 'none';
    }

    function toggleTheme() {
        const html = document.documentElement;
        const dark = html.getAttribute('data-theme') === 'light';
        html.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem('examarchive_theme', dark ? 'dark' : 'light');
        updateThemeIcons(dark);
    }

    // ------------------------------------------------------------------
    // 5. Notifications (toast)
    // ------------------------------------------------------------------
    function showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
        els.toastContainer.appendChild(toast);

        // Animation d'entrée
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ------------------------------------------------------------------
    // 6. Recherche / filtres / tri
    // ------------------------------------------------------------------
    function handleSearchAndFilter(resetPage = true) {
        if (resetPage) currentPage = 1;
        const query = els.searchInput.value;
        const filters = {
            filiere: els.filiereFilter.value,
            annee: els.anneeFilter.value,
            semestre: els.semestreFilter.value,
            matiere: els.matiereFilter.value
        };
        const sortBy = els.sortSelect.value;

        currentSubjects = SearchEngine.search(allSubjects, query);
        currentSubjects = SearchEngine.filter(currentSubjects, filters);
        currentSubjects = SearchEngine.sort(currentSubjects, sortBy);

        const hasActiveFilter =
            query.trim() !== '' ||
            filters.filiere || filters.annee || filters.semestre || filters.matiere ||
            sortBy !== 'default';
        if (els.btnResetFilters) els.btnResetFilters.style.display = hasActiveFilter ? 'inline-block' : 'none';

        renderSubjects();
    }

    function resetFilters() {
        els.searchInput.value = '';
        els.filiereFilter.value = '';
        els.anneeFilter.value = '';
        els.semestreFilter.value = '';
        els.matiereFilter.value = '';
        els.sortSelect.value = 'default';
        currentPage = 1;
        if (els.btnResetFilters) els.btnResetFilters.style.display = 'none';
        renderSubjects();
    }

    // ------------------------------------------------------------------
    // 7. Rendu des cartes + pagination
    // ------------------------------------------------------------------
    function renderSubjects() {
        els.subjectsGrid.innerHTML = '';

        const total = currentSubjects.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageItems = currentSubjects.slice(start, start + PAGE_SIZE);

        // État vide
        if (total === 0) {
            els.emptyState.classList.remove('hidden');
            els.subjectsGrid.classList.add('hidden');
            if (els.pagination) els.pagination.innerHTML = '';
            updateStats();
            return;
        }
        els.emptyState.classList.add('hidden');
        els.subjectsGrid.classList.remove('hidden');

        // Cartes
        const adminMarkup = isAdmin
            ? `<div class="card-overlay">
                   <button class="btn-edit-card" data-id="{id}" title="Modifier"><span aria-hidden="true">✏️</span><span class="sr-only">Modifier</span></button>
                   <button class="btn-delete-card" data-id="{id}" title="Supprimer"><span aria-hidden="true">🗑️</span><span class="sr-only">Supprimer</span></button>
               </div>`
            : '';

        pageItems.forEach(subject => {
            const card = document.createElement('article');
            card.className = 'subject-card';
            card.dataset.id = subject.id;
            card.setAttribute('role', 'option');
            card.setAttribute('aria-label', `${subject.titre} — ${subject.matiere} (${subject.codeMatiere})`);

            const adminHtml = adminMarkup.replace(/{id}/g, subject.id);
            const images = subject.images || [subject.imageBase64 || subject.image].filter(Boolean);
            const thumbSrc = images[0] || '';

            const thumbHtml = thumbSrc
                ? `<img src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(subject.titre)}" loading="lazy" onerror="this.outerHTML=\`<div class='thumb-placeholder' aria-hidden='true'>📄</div>\`">`
                : `<div class="thumb-placeholder" aria-hidden="true">📄</div>`;

            card.innerHTML = `
                ${adminHtml}
                <div class="card-thumb">
                    ${thumbHtml}
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span class="badge badge-secondary">${escapeHtml(subject.semestre)}</span>
                        <span class="badge">${escapeHtml(subject.langue === 'en' ? 'EN' : 'FR')}</span>
                    </div>
                    <h3 class="card-title">${escapeHtml(subject.titre)}</h3>
                    <div class="card-info">
                        <div class="info-item"><strong>${escapeHtml(subject.codeMatiere)}</strong> • ${escapeHtml(subject.matiere)}</div>
                        <div class="info-item">${escapeHtml(subject.filiere)} • ${escapeHtml(subject.annee)}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-view" data-id="${subject.id}">Consulter</button>
                    </div>
                </div>
            `;

            els.subjectsGrid.appendChild(card);
        });

        // Événements cartes
        els.subjectsGrid.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                viewSubject(id);
            });
        });
        if (isAdmin) {
            els.subjectsGrid.querySelectorAll('.btn-edit-card').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openFormModal(parseInt(e.currentTarget.dataset.id, 10));
                });
            });
            els.subjectsGrid.querySelectorAll('.btn-delete-card').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSubject(parseInt(e.currentTarget.dataset.id, 10));
                });
            });
        }

        // Pagination
        renderPagination(total, totalPages);
        updateStats();
    }

    function renderPagination(total, totalPages) {
        if (!els.pagination) return;
        if (totalPages <= 1) {
            els.pagination.innerHTML = '';
            return;
        }

        const fragment = document.createDocumentFragment();

        const btn = (label, page, disabled, active) => {
            const b = document.createElement('button');
            b.className = 'pagination-btn' + (active ? ' active' : '') + (disabled ? ' disabled' : '');
            b.textContent = label;
            b.disabled = disabled;
            b.setAttribute('aria-label', label);
            if (!disabled && !active) {
                b.addEventListener('click', () => {
                    currentPage = page;
                    renderSubjects();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }
            return b;
        };

        fragment.appendChild(btn('Précédent', currentPage - 1, currentPage === 1, false));

        for (let i = 1; i <= totalPages; i++) {
            const show = i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1);
            if (!show) {
                if (i === currentPage - 2 || i === currentPage + 2) {
                    const dots = document.createElement('span');
                    dots.textContent = '…';
                    dots.style.padding = '0 0.5rem';
                    dots.style.color = 'var(--color-text-muted)';
                    fragment.appendChild(dots);
                }
                continue;
            }
            fragment.appendChild(btn(i, i, false, i === currentPage));
        }

        fragment.appendChild(btn('Suivant', currentPage + 1, currentPage === totalPages, false));
        els.pagination.innerHTML = '';
        els.pagination.appendChild(fragment);
    }

    function updateStats() {
        els.totalSujets.textContent = allSubjects.length;
        els.totalMatieres.textContent = new Set(allSubjects.map(s => s.matiere)).size;
        els.totalAnnees.textContent = new Set(allSubjects.map(s => s.annee)).size;
        els.totalSemestres.textContent = new Set(allSubjects.map(s => s.semestre)).size;
    }

    function updateFiltersOptions() {
        const populate = (select, items, placeholder) => {
            const currentVal = select.value;
            select.innerHTML = `<option value="">${placeholder}</option>`;
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                select.appendChild(opt);
            });
            if (items.includes(currentVal)) select.value = currentVal;
        };

        populate(els.filiereFilter, [...new Set(allSubjects.map(s => s.filiere))].sort(), 'Toutes');
        populate(els.anneeFilter, [...new Set(allSubjects.map(s => s.annee))].sort().reverse(), 'Toutes');
        populate(els.semestreFilter, [...new Set(allSubjects.map(s => s.semestre))].sort(), 'Tous');
        populate(els.matiereFilter, [...new Set(allSubjects.map(s => s.matiere))].sort(), 'Toutes');
    }

    // ------------------------------------------------------------------
    // 8. Modale détail d'un sujet
    // ------------------------------------------------------------------
    function viewSubject(id) {
        const subject = allSubjects.find(s => s.id === id);
        if (!subject) return;
        currentViewSubjectId = id;

        document.getElementById('viewModalTitle').textContent = subject.titre;
        document.getElementById('viewCode').textContent = subject.codeMatiere;
        document.getElementById('viewMatiere').textContent = subject.matiere;
        document.getElementById('viewFiliere').textContent = subject.filiere;
        document.getElementById('viewAnnee').textContent = subject.annee;
        document.getElementById('viewSemestre').textContent = subject.semestre;
        document.getElementById('viewLangue').textContent = subject.langue === 'en' ? 'Anglais' : 'Français';
        document.getElementById('viewTexte').textContent = subject.texteComplet || 'Aucun texte disponible.';

        const wrap = document.getElementById('viewImageWrap');
        const img = document.getElementById('viewImage');
        const nextBtn = document.getElementById('btnNextImage');
        const images = subject.images || [subject.imageBase64 || subject.image].filter(Boolean);

        if (images.length) {
            wrap.style.display = 'block';
            let idx = 0;
            const setImage = (i) => {
                img.src = images[i];
                img.alt = `${subject.titre} - page ${i + 1}`;
                nextBtn.textContent = `Page ${i + 1} / ${images.length}`;
            };
            setImage(0);
            nextBtn.style.display = images.length > 1 ? 'inline-block' : 'none';
            nextBtn.onclick = () => {
                idx = (idx + 1) % images.length;
                setImage(idx);
            };
        } else {
            wrap.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        // Analyse IA
        const analyseSection = document.getElementById('viewAnalyseSection');
        const analyseDiv = document.getElementById('viewAnalyse');
        if (subject.analyseImages) {
            analyseDiv.innerHTML = markdownToHtml(subject.analyseImages);
            analyseSection.style.display = 'block';
        } else {
            analyseSection.style.display = 'none';
        }

        // Actions admin
        const adminActions = document.getElementById('viewAdminActions');
        if (adminActions) {
            adminActions.style.display = isAdmin ? 'flex' : 'none';
            const editBtn = document.getElementById('btnEditView');
            const delBtn = document.getElementById('btnDeleteView');
            editBtn.onclick = (e) => { e.stopPropagation(); closeModals(); openFormModal(id); };
            delBtn.onclick = (e) => { e.stopPropagation(); closeModals(); deleteSubject(id); };
        }

        // Copier / imprimer
        document.getElementById('btnCopyText').onclick = () => {
            navigator.clipboard.writeText(subject.texteComplet || '').then(() =>
                showNotification('Texte copié dans le presse-papiers.', 'success')
            ).catch(() => showNotification('Impossible de copier le texte.', 'error'));
        };
        document.getElementById('btnPrint').onclick = () => window.print();

        els.viewModal.classList.add('active');
        els.viewModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    // ------------------------------------------------------------------
    // 9. IA : OCR + Gemini Vision (compatibilité API existante)
    // ------------------------------------------------------------------
    async function analyzeImageWithGemini(dataUrl) {
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
            const response = await fetch('/.netlify/functions/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, image: { mimeType, data: base64Data }, maxOutputTokens: 1024 })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Erreur HTTP ${response.status}`);
            return data.text || null;
        } catch (err) {
            console.warn('Gemini Vision non bloquant:', err.message);
            return null;
        }
    }

    // ------------------------------------------------------------------
    // 10. Modale d'upload (admin)
    // ------------------------------------------------------------------
    function openUploadModal() {
        uploadedFiles = [];
        els.fileInput.value = '';
        els.uploadFormsContainer.innerHTML = '';
        els.btnUploadSave.disabled = true;
        els.uploadModal.classList.add('active');
        els.uploadModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function handleFilesSelected(files) {
        const imageFiles = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        const readers = imageFiles.map(file => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ file, dataUrl: e.target.result });
            reader.readAsDataURL(file);
        }));

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
        els.uploadFormsContainer.innerHTML = '';
        if (uploadedFiles.length === 0) {
            els.btnUploadSave.disabled = true;
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
                    <button class="btn-remove-upload" data-index="${index}" title="Retirer" aria-label="Retirer ${escapeHtml(item.file.name)}">&times;</button>
                </div>
                <div class="upload-image-form-body" id="formBody_${index}">
                    <div class="form-group">
                        <label class="form-label">Filière *</label>
                        <input type="text" id="uf_filiere_${index}" class="form-control" placeholder="ex: PM/DESS">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Année *</label>
                        <input type="text" id="uf_annee_${index}" class="form-control" placeholder="ex: 2025-2026">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Semestre *</label>
                        <input type="text" id="uf_semestre_${index}" class="form-control" placeholder="ex: S2">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Code matière *</label>
                        <input type="text" id="uf_code_${index}" class="form-control" placeholder="ex: GIS 621">
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Matière *</label>
                        <input type="text" id="uf_matiere_${index}" class="form-control" placeholder="ex: Analyse Spatiale">
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Titre *</label>
                        <input type="text" id="uf_titre_${index}" class="form-control" value="${escapeHtml(shortName)}">
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Description</label>
                        <input type="text" id="uf_desc_${index}" class="form-control" placeholder="optionnel">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Langue</label>
                        <select id="uf_langue_${index}" class="form-control">
                            <option value="fr">Français</option>
                            <option value="en">Anglais</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Texte complet <span class="form-text">(Extrait via OCR)</span></label>
                        <textarea id="uf_texte_${index}" class="form-control" rows="4" placeholder="Extraction en cours..."></textarea>
                    </div>
                    <div class="form-group full-width" id="geminiAnalyseGroup_${index}" style="display:none;">
                        <label class="form-label">🗺️ Analyse des figures (Gemini IA)</label>
                        <textarea id="uf_analyse_${index}" class="form-control" rows="3" readonly style="background: var(--color-info-bg); color: var(--color-text-secondary);"></textarea>
                    </div>
                </div>
            `;
            els.uploadFormsContainer.appendChild(div);

            div.querySelector('.btn-remove-upload').addEventListener('click', (e) => {
                e.stopPropagation();
                uploadedFiles.splice(index, 1);
                renderInlineForms();
            });

            if (!item.ocrProcessed) {
                const textarea = document.getElementById(`uf_texte_${index}`);

                fetch('/.netlify/functions/ocr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataUrl: item.dataUrl })
                })
                    .then(r => r.json())
                    .then(result => {
                        if (result.IsErroredOnProcessing || !result.ParsedResults) {
                            throw new Error(result.ErrorMessage || "Erreur inconnue");
                        }
                        const text = result.ParsedResults[0].ParsedText;
                        item.ocrProcessed = true;
                        item.extractedText = text;
                        textarea.value = text;

                        const fullText = text.toUpperCase();

                        // Année
                        const anneeMatch = fullText.match(/(?:ANN[EÉ]E(?: UNIVERSITAIRE)?\s*:?\s*)?(20[1-9][0-9]\s*[-/]\s*20[1-9][0-9])/);
                        const anneeInput = document.getElementById(`uf_annee_${index}`);
                        if (anneeMatch && anneeInput) anneeInput.value = anneeMatch[1].replace(/\s/g, '').replace('/', '-');

                        // Semestre
                        const semestreMatch = fullText.match(/(?:SEMESTRE|S)\s*:?\s*([1-9])/);
                        const isS2 = fullText.match(/(DEUXI[EÈÉ]ME|SECOND)/);
                        const isS1 = fullText.match(/(PREMIER)/);
                        const semestreInput = document.getElementById(`uf_semestre_${index}`);
                        if (semestreInput) {
                            if (semestreMatch) semestreInput.value = `S${semestreMatch[1]}`;
                            else if (isS2) semestreInput.value = 'S2';
                            else if (isS1) semestreInput.value = 'S1';
                        }

                        // Filière
                        const filiereInput = document.getElementById(`uf_filiere_${index}`);
                        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                        const deptLine = lines.find(l => l.match(/(d[ée]pa[\s\\r]*tement|institut|faculté|université|école)/i));
                        if (deptLine && filiereInput) filiereInput.value = deptLine.substring(0, 60).replace(/\\/g, '');

                        // Code matière
                        const codeMatch = text.match(/(?:Code(?: du cours)?|UE)\s*:?\s*([A-Za-z0-9\s-]{3,15})(?:\n|$)/i)
                            || text.match(/(?:^|\s|\b)([A-Z]{2,4}[ .-][0-9]{3}|[0-9]{3}[ .-][0-9]{1,3})(?:\s|\b|$)/);
                        const codeInput = document.getElementById(`uf_code_${index}`);
                        if (codeMatch && codeInput) codeInput.value = codeMatch[1].trim();

                        // Matière
                        const matiereInput = document.getElementById(`uf_matiere_${index}`);
                        const matiereMatch = text.match(/(?:Mati[èe]re|Module|[ÉE]preuve|Examen(?:\s+de)?)\s*:?\s*([A-Za-zÀ-ÿ0-9\s-']{3,60})(?:\n|$)/i);
                        if (matiereMatch && matiereInput && !matiereMatch[1].match(/deuxi|premier|master|licence/i)) {
                            matiereInput.value = matiereMatch[1].trim();
                        } else if (codeMatch && matiereInput) {
                            const codeLine = lines.find(l => l.includes(codeMatch[1]));
                            if (codeLine) matiereInput.value = codeLine.replace(codeMatch[1], '').replace(/^[-\s]+/, '').trim();
                        }

                        // Titre automatique
                        const titreInput = document.getElementById(`uf_titre_${index}`);
                        if (titreInput) {
                            const mat = matiereInput ? matiereInput.value : 'Examen';
                            const ann = anneeInput ? anneeInput.value : '';
                            titreInput.value = `${mat} ${ann}`.trim();
                        }

                        // Description
                        const descInput = document.getElementById(`uf_desc_${index}`);
                        if (descInput) {
                            let descText = "";
                            const dateMatch = text.match(/(?:Date)\s*:?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i);
                            if (dateMatch) descText += `Date : ${dateMatch[1]} - `;
                            const instructionMatch = text.match(/(?:INSTRUCTION|DIRECTIVE|NOTE)\s*:?\s*(.+)/i);
                            if (instructionMatch) descText += instructionMatch[1].trim();
                            descInput.value = descText.substring(0, 100);
                        }
                    })
                    .catch(err => {
                        console.error("OCR API Error:", err);
                        textarea.placeholder = "Erreur OCR — saisissez le texte manuellement.";
                    });

                // Gemini Vision
                analyzeImageWithGemini(item.dataUrl).then(analyseText => {
                    if (analyseText && !analyseText.includes("Aucun schéma")) {
                        item.analyseImages = analyseText;
                        const group = document.getElementById(`geminiAnalyseGroup_${index}`);
                        const ta = document.getElementById(`uf_analyse_${index}`);
                        if (group && ta) {
                            ta.value = analyseText;
                            group.style.display = 'block';
                        }
                    }
                });
            } else {
                document.getElementById(`uf_texte_${index}`).value = item.extractedText || '';
                if (item.analyseImages) {
                    const group = document.getElementById(`geminiAnalyseGroup_${index}`);
                    const ta = document.getElementById(`uf_analyse_${index}`);
                    if (group && ta) {
                        ta.value = item.analyseImages;
                        group.style.display = 'block';
                    }
                }
            }
        });

        els.btnUploadSave.disabled = false;
    }

    function saveAllUploadedSubjects() {
        if (uploadedFiles.length === 0) return;

        let savedCount = 0;
        let hasError = false;
        const addedIds = [];

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
                if (body) body.style.outline = '2px solid var(--color-error)';
                return;
            }

            const newSubject = {
                filiere, annee, semestre, codeMatiere: code, matiere, titre,
                description: (document.getElementById(`uf_desc_${index}`)?.value || '').trim(),
                langue: document.getElementById(`uf_langue_${index}`)?.value || 'fr',
                texteComplet: (document.getElementById(`uf_texte_${index}`)?.value || '').trim(),
                analyseImages: item.analyseImages || null,
                dateAjout: new Date().toISOString().slice(0, 10),
                imageBase64: item.dataUrl,
                images: item.dataUrl ? [item.dataUrl] : []
            };

            const added = StorageManager.addSubject(newSubject);
            addedIds.push(added.id);
            savedCount++;
        });

        if (hasError) {
            showNotification('Veuillez remplir tous les champs obligatoires (*).', 'warning');
            return;
        }

        allSubjects = StorageManager.getSubjects();
        currentSubjects = [...allSubjects];
        updateFiltersOptions();
        updateStats();
        handleSearchAndFilter();

        // Mettre en évidence et faire défiler vers les nouveaux sujets ajoutés
        setTimeout(() => {
            addedIds.forEach(id => {
                const card = els.subjectsGrid.querySelector(`article[data-id="${id}"]`);
                if (card) {
                    card.classList.add('new-subject');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => card.classList.remove('new-subject'), 2500);
                }
            });
        }, 100);

        closeModals();
        showNotification(`${savedCount} sujet(s) ajouté(s) avec succès !`, 'success');
    }

    // ------------------------------------------------------------------
    // 11. Modale modifier (admin)
    // ------------------------------------------------------------------
    function openFormModal(id = null) {
        if (!id || !isAdmin) return;
        els.subjectForm.reset();
        els.formId.value = '';

        const subject = allSubjects.find(s => s.id === id);
        if (subject) {
            document.getElementById('formModalTitle').textContent = 'Modifier un sujet';
            els.formId.value = subject.id;
            els.formFiliere.value = subject.filiere;
            els.formAnnee.value = subject.annee;
            els.formSemestre.value = subject.semestre;
            els.formCodeMatiere.value = subject.codeMatiere;
            els.formMatiere.value = subject.matiere;
            els.formTitre.value = subject.titre;
            els.formDescription.value = subject.description || '';
            els.formLangue.value = subject.langue || 'fr';
            els.formTexteComplet.value = subject.texteComplet || '';
        }

        els.formModal.classList.add('active');
        els.formModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        if (!isAdmin) return;

        const formData = {
            filiere: els.formFiliere.value.trim(),
            annee: els.formAnnee.value.trim(),
            semestre: els.formSemestre.value.trim(),
            codeMatiere: els.formCodeMatiere.value.trim(),
            matiere: els.formMatiere.value.trim(),
            titre: els.formTitre.value.trim(),
            description: els.formDescription.value.trim(),
            langue: els.formLangue.value,
            texteComplet: els.formTexteComplet.value.trim(),
        };

        const id = els.formId.value;
        if (!id) return;

        formData.id = parseInt(id, 10);
        const existing = allSubjects.find(s => s.id === formData.id);
        if (existing) {
            if (existing.image) formData.image = existing.image;
            if (existing.imageBase64) formData.imageBase64 = existing.imageBase64;
            if (existing.images) formData.images = existing.images;
            if (existing.analyseImages) formData.analyseImages = existing.analyseImages;
        }

        StorageManager.updateSubject(formData);
        showNotification('Modifications enregistrées avec succès.', 'success');

        allSubjects = StorageManager.getSubjects();
        currentSubjects = [...allSubjects];
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
                currentSubjects = [...allSubjects];
                currentPage = 1;
                updateFiltersOptions();
                updateStats();
                handleSearchAndFilter();
                showNotification('Sujet supprimé.', 'success');
            }
        }
    }

    // ------------------------------------------------------------------
    // 12. Événements globaux
    // ------------------------------------------------------------------
    function bindEvents() {
        // Recherche & filtres
        els.searchInput.addEventListener('input', () => handleSearchAndFilter());
        els.filiereFilter.addEventListener('change', () => handleSearchAndFilter());
        els.anneeFilter.addEventListener('change', () => handleSearchAndFilter());
        els.semestreFilter.addEventListener('change', () => handleSearchAndFilter());
        els.matiereFilter.addEventListener('change', () => handleSearchAndFilter());
        els.sortSelect.addEventListener('change', () => handleSearchAndFilter());
        if (els.btnResetFilters) els.btnResetFilters.addEventListener('click', resetFilters);
        if (els.btnResetEmpty) els.btnResetEmpty.addEventListener('click', resetFilters);

        // Hero CTA
        if (els.btnBrowse) els.btnBrowse.addEventListener('click', (e) => { e.preventDefault(); els.searchInput.focus(); });
        if (els.btnHeroSearch) els.btnHeroSearch.addEventListener('click', (e) => { e.preventDefault(); els.searchInput.focus(); });

        // Modales admin
        if (els.btnAddSubject) els.btnAddSubject.addEventListener('click', openUploadModal);
        if (els.btnSettings) els.btnSettings.addEventListener('click', openSettingsModal);
        els.btnFormCancel.addEventListener('click', closeModals);
        els.subjectForm.addEventListener('submit', handleFormSubmit);
        els.btnUploadCancel.addEventListener('click', closeModals);
        els.btnUploadSave.addEventListener('click', saveAllUploadedSubjects);
        els.btnSettingsCancel.addEventListener('click', closeModals);
        els.btnSettingsSave.addEventListener('click', () => closeModals());

        // Drop zone
        els.dropZone.addEventListener('click', () => els.fileInput.click());
        els.fileInput.addEventListener('change', (e) => handleFilesSelected(e.target.files));
        els.dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
        });
        els.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); els.dropZone.classList.add('drag-over'); });
        els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('drag-over'));
        els.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            els.dropZone.classList.remove('drag-over');
            handleFilesSelected(e.dataTransfer.files);
        });

        // Fermeture modales
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModals(); });
        });
        document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
        document.getElementById('btnCloseView').addEventListener('click', closeModals);
        document.getElementById('btnUploadClose').addEventListener('click', closeModals);
        document.getElementById('btnFormClose').addEventListener('click', closeModals);
        document.getElementById('btnSettingsClose').addEventListener('click', closeModals);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModals();
        });

        // Thème
        els.themeToggle.addEventListener('click', toggleTheme);

        // Menu mobile
        els.mobileMenuBtn.addEventListener('click', () => {
            const open = els.navLinks.classList.toggle('open');
            els.mobileMenuBtn.setAttribute('aria-expanded', open);
        });
        els.navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => els.navLinks.classList.remove('open'));
        });
    }

    function openSettingsModal() {
        const password = hash.replace('#admin-', '');
        if (document.getElementById('settingsAdminPassword')) {
            document.getElementById('settingsAdminPassword').value = password;
        }
        if (document.getElementById('settingsAdminUrl')) {
            document.getElementById('settingsAdminUrl').textContent = window.location.href;
        }
        els.settingsModal.classList.add('active');
        els.settingsModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.classList.remove('active');
            m.setAttribute('aria-hidden', 'true');
        });
        document.body.style.overflow = '';
    }

    // ------------------------------------------------------------------
    // 13. Utilitaires
    // ------------------------------------------------------------------
    function markdownToHtml(md) {
        if (!md) return '';
        return md
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 style="font-size:1.05rem;margin-top:1rem;color:var(--color-primary)">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 style="font-size:1.15rem;margin-top:1rem;">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h|u|l|p])(.+)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '');
    }

    function escapeHtml(unsafe) {
        return (unsafe || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ------------------------------------------------------------------
    // 14. Démarrage
    // ------------------------------------------------------------------
    initTheme();
    updateFiltersOptions();
    updateStats();
    renderSubjects();
    bindEvents();
});
