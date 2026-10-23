
"use strict";

// ======================================================
// DEUTSCHWELT ADMIN
// ======================================================

const ADMIN_SUPABASE_URL =
    "https://llxcyabptsbdtsdhkzkc.supabase.co";

const ADMIN_SUPABASE_ANON_KEY =
    "sb_publishable_MKh0z87kMiDAQX3jnaoADQ_-D0_XXd4";

let adminSupabase = null;
let selectedContentType = "topic";


// ======================================================
// MESSAGE HELPERS
// ======================================================

function showMessage(elementId, message, type = "info") {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = "admin-message " + type;
}

function showInitializationError(error) {
    console.error("DeutschWelt admin initialization:", error);

    showMessage(
        "loginMessage",
        "Admin-Fehler: " + (error.message || String(error)),
        "error"
    );
}


// ======================================================
// SUPABASE CLIENT
// ======================================================

function createAdminSupabase() {
    if (!window.supabase ||
        typeof window.supabase.createClient !== "function") {
        throw new Error(
            "Supabase wurde nicht geladen. Bitte Internetverbindung und CDN prüfen."
        );
    }

    adminSupabase = window.supabase.createClient(
        ADMIN_SUPABASE_URL,
        ADMIN_SUPABASE_ANON_KEY
    );
}


// ======================================================
// LOGIN AND SESSION
// ======================================================

async function loginAdmin(email, password) {
    const { data, error } =
        await adminSupabase.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error("Supabase login error:", error);
        throw error;
    }

    return data;
}

async function checkSession() {
    const { data, error } =
        await adminSupabase.auth.getSession();

    if (error) throw error;

    if (data?.session) {
        showAdminPanel();
    } else {
        showLoginPanel();
    }
}

function showAdminPanel() {
    document.getElementById("adminLogin")?.classList.add("hidden");
    document.getElementById("adminPanel")?.classList.remove("hidden");
}

function showLoginPanel() {
    document.getElementById("adminLogin")?.classList.remove("hidden");
    document.getElementById("adminPanel")?.classList.add("hidden");
}


// ======================================================
// CONTENT TYPE SWITCHING
// ======================================================

function switchContentType(type) {
    selectedContentType = type;

    document.querySelectorAll(".content-type-button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.contentType === type
        );
    });

    const sections = {
        topic: "topicForm",
        vocabulary: "vocabularyForm",
        grammar: "grammarForm",
        sprechen: "sprechenForm"
    };

    Object.entries(sections).forEach(([key, id]) => {
        const section = document.getElementById(id);
        if (section) {
            section.classList.toggle("hidden", key !== type);
        }
    });

    const categoryField = document.getElementById("categoryField");
    if (categoryField) {
        categoryField.classList.toggle("hidden", type === "grammar");
    }

    const level = document.getElementById("contentLevel");
    if (level && type === "sprechen") {
        level.value = "B2";
    }
}


// ======================================================
// FORM HELPERS
// ======================================================

function linesToArray(value) {
    if (!value) return [];

    return value
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
}

function getSortOrder() {
    const value = Number(
        document.getElementById("sortOrder").value
    );

    return Number.isFinite(value) && value > 0 ? value : 1;
}


// ======================================================
// SAVE NORMAL TOPIC
// ======================================================

async function saveTopic() {
    const row = {
        level: document.getElementById("contentLevel").value,
        content_type: "lesson",
        category: document.getElementById("category").value.trim(),
        title: document.getElementById("topicTitle").value.trim(),
        summary: document.getElementById("topicSummary").value.trim(),
        explanation: document.getElementById("topicExplanation").value.trim(),
        key_points: linesToArray(
            document.getElementById("topicKeyPoints").value
        ),
        sentence_patterns: linesToArray(
            document.getElementById("topicPatterns").value
        ),
        examples: linesToArray(
            document.getElementById("topicExamples").value
        ),
        merke: document.getElementById("topicMerke").value.trim(),
        icon: document.getElementById("topicIcon").value.trim(),
        image_url:
            document.getElementById("topicImage").value.trim() || null,
        sort_order: getSortOrder(),
        published: true
    };

    if (!row.title) {
        throw new Error("Bitte einen Titel eingeben.");
    }

    const { error } = await adminSupabase
        .from("topics")
        .insert(row);

    if (error) throw error;
}


// ======================================================
// SAVE VOCABULARY
// ======================================================

async function saveVocabulary() {
    const row = {
        level: document.getElementById("contentLevel").value,
        category: document.getElementById("category").value.trim(),
        word: document.getElementById("vocabWord").value.trim(),
        article: document.getElementById("vocabArticle").value,
        plural: document.getElementById("vocabPlural").value.trim(),
        meaning: document.getElementById("vocabMeaning").value.trim(),
        example: document.getElementById("vocabExample").value.trim(),
        note: document.getElementById("vocabNote").value.trim(),
        image_url:
            document.getElementById("vocabImage").value.trim() || null,
        sort_order: getSortOrder(),
        published: true
    };

    if (!row.word) {
        throw new Error("Bitte ein Wort eingeben.");
    }

    if (!row.meaning) {
        throw new Error("Bitte eine Bedeutung eingeben.");
    }

    const { error } = await adminSupabase
        .from("vocabulary")
        .insert(row);

    if (error) throw error;
}


// ======================================================
// SAVE GRAMMAR
// ======================================================

async function saveGrammar() {
    const row = {
        level: document.getElementById("contentLevel").value,
        title: document.getElementById("grammarTitle").value.trim(),
        short_explanation:
            document.getElementById("grammarShort").value.trim(),
        explanation:
            document.getElementById("grammarExplanation").value.trim(),
        rule_preview:
            document.getElementById("grammarRule").value.trim(),
        key_points: linesToArray(
            document.getElementById("grammarKeyPoints").value
        ),
        sentence_patterns: linesToArray(
            document.getElementById("grammarPatterns").value
        ),
        examples: linesToArray(
            document.getElementById("grammarExamples").value
        ),
        merke: document.getElementById("grammarMerke").value.trim(),
        image_url:
            document.getElementById("grammarImage").value.trim() || null,
        sort_order: getSortOrder(),
        published: true
    };

    if (!row.title) {
        throw new Error("Bitte einen Grammatik-Titel eingeben.");
    }

    const { error } = await adminSupabase
        .from("grammar_topics")
        .insert(row);

    if (error) throw error;
}


// ======================================================
// PARSE SPEAKING PHRASES
// Format:
// Category: Meinung äußern
// Meiner Meinung nach ... | In my opinion ...
// ======================================================

function parseSpeakingPhrases(value) {
    const groups = [];
    let currentCategory = "Allgemeine Redemittel";

    (value || "").split(/\r?\n/).forEach(line => {
        const text = line.trim();
        if (!text) return;

        if (/^Category\s*:/i.test(text)) {
            currentCategory =
                text.replace(/^Category\s*:/i, "").trim()
                || "Allgemeine Redemittel";
            return;
        }

        const separator = text.indexOf("|");

        if (separator < 1) {
            throw new Error(
                'Redemittel bitte im Format "Deutsch | Englisch" eingeben: ' +
                text
            );
        }

        const de = text.slice(0, separator).trim();
        const en = text.slice(separator + 1).trim();

        if (!de || !en) {
            throw new Error("Bitte deutsche und englische Phrase angeben: " + text);
        }

        let group = groups.find(item => item.category === currentCategory);

        if (!group) {
            group = { category: currentCategory, phrases: [] };
            groups.push(group);
        }

        group.phrases.push({ de, en });
    });

    return groups;
}


// ======================================================
// SAVE B2 SPRECHEN
// ======================================================

async function saveSpeakingTopic() {
    const row = {
        level: document.getElementById("contentLevel").value,
        content_type: "sprechen",
        category:
            document.getElementById("category").value.trim() || "Sprechen",
        title: document.getElementById("speakingTitle").value.trim(),
        summary: document.getElementById("speakingSummary").value.trim(),
        explanation:
            document.getElementById("speakingExplanation").value.trim(),
        explanation_en:
            document.getElementById("speakingExplanationEn").value.trim(),
        speaking_phrases: parseSpeakingPhrases(
            document.getElementById("speakingPhrases").value
        ),
        dialogue: linesToArray(
            document.getElementById("speakingDialogue").value
        ).map(line => {
            const separator = line.indexOf(":");

            return separator === -1
                ? { speaker: "", text: line }
                : {
                    speaker: line.slice(0, separator).trim(),
                    text: line.slice(separator + 1).trim()
                };
        }),
        grammar_notes: linesToArray(
            document.getElementById("speakingGrammar").value
        ),
        merke: document.getElementById("speakingMerke").value.trim(),
        icon:
            document.getElementById("speakingIcon").value.trim() || "🗣️",
        image_url:
            document.getElementById("speakingImage").value.trim() || null,
        sort_order: getSortOrder(),
        published: true
    };

    if (row.level !== "B2") {
        throw new Error("Bitte das Niveau B2 auswählen.");
    }

    if (!row.title) {
        throw new Error("Bitte einen Titel eingeben.");
    }

    if (!row.explanation || !row.explanation_en) {
        throw new Error(
            "Bitte die Erklärungen auf Deutsch und Englisch eingeben."
        );
    }

    if (!row.speaking_phrases.length) {
        throw new Error("Bitte mindestens eine Redewendung hinzufügen.");
    }

    const { error } = await adminSupabase
        .from("topics")
        .insert(row);

    if (error) throw error;
}


// ======================================================
// CLEAR FORM
// ======================================================

function clearContentForm() {
    document.getElementById("contentForm").reset();

    document.getElementById("contentLevel").value =
        selectedContentType === "sprechen" ? "B2" : "A1";

    document.getElementById("sortOrder").value = "1";

    const article = document.getElementById("vocabArticle");
    if (article) article.value = "";

    const icon = document.getElementById("speakingIcon");
    if (icon) icon.value = "🗣️";
}


// ======================================================
// LOGIN EVENT
// ======================================================

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const button = document.querySelector("#loginForm button[type='submit']");

    if (button) {
        button.disabled = true;
        button.textContent = "Anmeldung läuft ...";
    }

    showMessage("loginMessage", "Verbindung zu Supabase wird geprüft ...");

    try {
        if (!adminSupabase) {
            throw new Error("Supabase wurde nicht initialisiert. Bitte Seite neu laden.");
        }

        await loginAdmin(email, password);
        showAdminPanel();
        showMessage("loginMessage", "Anmeldung erfolgreich.", "success");

    } catch (error) {
        console.error("Login failed:", error);

        showMessage(
            "loginMessage",
            "Anmeldung fehlgeschlagen: " +
                (error.message || "Unbekannter Fehler"),
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Anmelden";
        }
    }
}


// ======================================================
// SAVE EVENT
// ======================================================

async function handleSave(event) {
    event.preventDefault();

    const button = document.querySelector(
        "#contentForm button[type='submit']"
    );

    if (button) {
        button.disabled = true;
        button.textContent = "Speichern ...";
    }

    try {
        if (!adminSupabase) {
            throw new Error("Supabase wurde nicht initialisiert.");
        }

        if (selectedContentType === "topic") {
            await saveTopic();
        } else if (selectedContentType === "vocabulary") {
            await saveVocabulary();
        } else if (selectedContentType === "grammar") {
            await saveGrammar();
        } else if (selectedContentType === "sprechen") {
            await saveSpeakingTopic();
        } else {
            throw new Error("Unbekannter Inhaltstyp.");
        }

        clearContentForm();

        showMessage(
            "saveMessage",
            "Erfolgreich in Supabase gespeichert.",
            "success"
        );

    } catch (error) {
        console.error("Save error:", error);

        showMessage(
            "saveMessage",
            "Speichern fehlgeschlagen: " +
                (error.message || "Unbekannter Fehler"),
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "💾 Inhalt speichern";
        }
    }
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {
    try {
        const { error } = await adminSupabase.auth.signOut();
        if (error) throw error;

        showLoginPanel();
        showMessage("loginMessage", "Du wurdest abgemeldet.", "info");

    } catch (error) {
        console.error("Logout error:", error);

        showMessage(
            "loginMessage",
            "Abmelden fehlgeschlagen: " + error.message,
            "error"
        );
    }
}


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        createAdminSupabase();

        const loginForm = document.getElementById("loginForm");
        const contentForm = document.getElementById("contentForm");
        const logoutButton = document.getElementById("logoutButton");

        if (!loginForm || !contentForm || !logoutButton) {
            throw new Error(
                "Ein benötigtes Formular fehlt in admin.html. Prüfe loginForm, contentForm und logoutButton."
            );
        }

        loginForm.addEventListener("submit", handleLogin);
        contentForm.addEventListener("submit", handleSave);
        logoutButton.addEventListener("click", logout);

        document.querySelectorAll(".content-type-button").forEach(button => {
            button.addEventListener("click", () => {
                switchContentType(button.dataset.contentType);
            });
        });

        switchContentType("topic");
        await checkSession();

    } catch (error) {
        showInitializationError(error);
    }
});
