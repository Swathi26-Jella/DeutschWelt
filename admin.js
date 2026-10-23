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
// CREATE SUPABASE CLIENT
// ======================================================

function createAdminSupabase() {

    if (!window.supabase) {

        throw new Error(
            "Die Supabase-Bibliothek wurde nicht geladen."
        );

    }

    adminSupabase =
        window.supabase.createClient(
            ADMIN_SUPABASE_URL,
            ADMIN_SUPABASE_ANON_KEY
        );

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    elementId,
    message,
    type = "info"
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        "admin-message " + type;

}


// ======================================================
// LOGIN
// ======================================================

async function loginAdmin(
    email,
    password
) {

    const {
        data,
        error
    } =
        await adminSupabase.auth.signInWithPassword({

            email,
            password

        });

    if (error) {
        throw error;
    }

    return data;

}


// ======================================================
// SESSION
// ======================================================

async function checkSession() {

    const {
        data,
        error
    } =
        await adminSupabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (data && data.session) {

        showAdminPanel();

    }

}


// ======================================================
// SHOW ADMIN PANEL
// ======================================================

function showAdminPanel() {

    document
        .getElementById("adminLogin")
        .classList.add("hidden");

    document
        .getElementById("adminPanel")
        .classList.remove("hidden");

}


// ======================================================
// SHOW LOGIN
// ======================================================

function showLoginPanel() {

    document
        .getElementById("adminLogin")
        .classList.remove("hidden");

    document
        .getElementById("adminPanel")
        .classList.add("hidden");

}


// ======================================================
// SWITCH CONTENT TYPE
// ======================================================

function switchContentType(type) {

    selectedContentType = type;

    document
        .querySelectorAll(".content-type-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.contentType === type
            );

        });


    document
        .getElementById("topicForm")
        .classList.toggle(
            "hidden",
            type !== "topic"
        );


    document
        .getElementById("vocabularyForm")
        .classList.toggle(
            "hidden",
            type !== "vocabulary"
        );


    document
        .getElementById("grammarForm")
        .classList.toggle(
            "hidden",
            type !== "grammar"
        );


    document
        .getElementById("categoryField")
        .classList.toggle(
            "hidden",
            type === "grammar"
        );
    document
    .getElementById("sprechenForm")
    .classList.toggle("hidden", type !== "sprechen");

}


// ======================================================
// TEXT TO ARRAY
// ======================================================

function linesToArray(value) {

    if (!value) {
        return [];
    }

    return value
        .split("\n")
        .map(item => item.trim())
        .filter(item => item.length > 0);

}


// ======================================================
// NUMBER VALUE
// ======================================================

function getSortOrder() {

    const value =
        Number(
            document.getElementById("sortOrder").value
        );

    return Number.isFinite(value) && value > 0
        ? value
        : 1;

}


// ======================================================
// SAVE TOPIC
// ======================================================

async function saveTopic() {

    const row = {

        level:
            content_type: "lesson",
            document.getElementById("contentLevel").value,

        category:
            document.getElementById("category").value.trim(),

        title:
            document.getElementById("topicTitle").value.trim(),

        summary:
            document.getElementById("topicSummary").value.trim(),

        explanation:
            document.getElementById("topicExplanation").value.trim(),

        key_points:
            linesToArray(
                document.getElementById("topicKeyPoints").value
            ),

        sentence_patterns:
            linesToArray(
                document.getElementById("topicPatterns").value
            ),

        examples:
            linesToArray(
                document.getElementById("topicExamples").value
            ),

        merke:
            document.getElementById("topicMerke").value.trim(),

        icon:
            document.getElementById("topicIcon").value.trim(),

        image_url:
            document.getElementById("topicImage").value.trim() || null,

        sort_order:
            getSortOrder(),

        published: true
        

    };


    if (!row.title) {

        throw new Error(
            "Bitte einen Titel eingeben."
        );

    }


    const {
        error
    } =
        await adminSupabase
            .from("topics")
            .insert(row);


    if (error) {
        throw error;
    }

}


// ======================================================
// SAVE VOCABULARY
// ======================================================

async function saveVocabulary() {

    const row = {

        level:
            document.getElementById("contentLevel").value,

        category:
            document.getElementById("category").value.trim(),

        word:
            document.getElementById("vocabWord").value.trim(),

        article:
            document.getElementById("vocabArticle").value,

        plural:
            document.getElementById("vocabPlural").value.trim(),

        meaning:
            document.getElementById("vocabMeaning").value.trim(),

        example:
            document.getElementById("vocabExample").value.trim(),

        note:
            document.getElementById("vocabNote").value.trim(),

        image_url:
            document.getElementById("vocabImage").value.trim() || null,

        sort_order:
            getSortOrder(),

        published: true

    };


    if (!row.word) {

        throw new Error(
            "Bitte ein Wort eingeben."
        );

    }


    if (!row.meaning) {

        throw new Error(
            "Bitte eine Bedeutung eingeben."
        );

    }


    const {
        error
    } =
        await adminSupabase
            .from("vocabulary")
            .insert(row);


    if (error) {
        throw error;
    }

}


// ======================================================
// SAVE GRAMMAR
// ======================================================

async function saveGrammar() {

    const row = {

        level:
            document.getElementById("contentLevel").value,

        title:
            document.getElementById("grammarTitle").value.trim(),

        short_explanation:
            document.getElementById("grammarShort").value.trim(),

        explanation:
            document.getElementById("grammarExplanation").value.trim(),

        rule_preview:
            document.getElementById("grammarRule").value.trim(),

        key_points:
            linesToArray(
                document.getElementById("grammarKeyPoints").value
            ),

        sentence_patterns:
            linesToArray(
                document.getElementById("grammarPatterns").value
            ),

        examples:
            linesToArray(
                document.getElementById("grammarExamples").value
            ),

        merke:
            document.getElementById("grammarMerke").value.trim(),

        image_url:
            document.getElementById("grammarImage").value.trim() || null,

        sort_order:
            getSortOrder(),

        published: true

    };


    if (!row.title) {

        throw new Error(
            "Bitte einen Grammatik-Titel eingeben."
        );

    }


    const {
        error
    } =
        await adminSupabase
            .from("grammar_topics")
            .insert(row);


    if (error) {
        throw error;
    }

}

function parseSpeakingPhrases(value) {
    const categories = [];
    let currentCategory = "Allgemeine Redemittel";

    (value || "").split("\n").forEach(line => {
        const trimmed = line.trim();

        if (!trimmed) return;

        if (/^Category\s*:/i.test(trimmed)) {
            currentCategory = trimmed.replace(/^Category\s*:/i, "").trim()
                || "Allgemeine Redemittel";

            if (!categories.some(c => c.category === currentCategory)) {
                categories.push({
                    category: currentCategory,
                    phrases: []
                });
            }
            return;
        }

        const separator = trimmed.indexOf("|");

        if (separator === -1) {
            throw new Error(
                'Jede Redewendung braucht eine Übersetzung: Deutsch | Englisch. Fehler: ' +
                trimmed
            );
        }

        const german = trimmed.slice(0, separator).trim();
        const english = trimmed.slice(separator + 1).trim();

        if (!german || !english) {
            throw new Error(
                "Bitte beide Übersetzungen angeben: " + trimmed
            );
        }

        let group = categories.find(c => c.category === currentCategory);

        if (!group) {
            group = { category: currentCategory, phrases: [] };
            categories.push(group);
        }

        group.phrases.push({ de: german, en: english });
    });

    return categories;
}


async function saveSpeakingTopic() {
    const row = {
        level: document.getElementById("contentLevel").value,
        category: document.getElementById("category").value.trim()
            || "Sprechen",
        content_type: "sprechen",

        title: document.getElementById("speakingTitle").value.trim(),
        summary: document.getElementById("speakingSummary").value.trim(),
        explanation: document.getElementById("speakingExplanation").value.trim(),
        explanation_en: document.getElementById("speakingExplanationEn").value.trim(),

        speaking_phrases: parseSpeakingPhrases(
            document.getElementById("speakingPhrases").value
        ),

        dialogue: linesToArray(
            document.getElementById("speakingDialogue").value
        ).map(line => {
            const separator = line.indexOf(":");

            if (separator === -1) {
                return { speaker: "", text: line };
            }

            return {
                speaker: line.slice(0, separator).trim(),
                text: line.slice(separator + 1).trim()
            };
        }),

        grammar_notes: linesToArray(
            document.getElementById("speakingGrammar").value
        ),

        merke: document.getElementById("speakingMerke").value.trim(),
        icon: document.getElementById("speakingIcon").value.trim() || "🗣️",
        image_url: document.getElementById("speakingImage").value.trim() || null,
        sort_order: getSortOrder(),
        published: true
    };

    if (row.level !== "B2") {
        throw new Error("Bitte für diese Sprechen-Bibliothek das Niveau B2 auswählen.");
    }

    if (!row.title) {
        throw new Error("Bitte einen Titel eingeben.");
    }

    if (!row.explanation) {
        throw new Error("Bitte die deutsche Erklärung eingeben.");
    }

    if (!row.explanation_en) {
        throw new Error("Bitte die englische Erklärung eingeben.");
    }

    if (row.speaking_phrases.length === 0) {
        throw new Error("Bitte mindestens eine Redewendung mit englischer Übersetzung eingeben.");
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

    document
        .getElementById("contentForm")
        .reset();


    document
        .getElementById("contentLevel")
        .value = "A1";


    document
        .getElementById("sortOrder")
        .value = "1";


    document
        .getElementById("vocabArticle")
        .value = "";

}


// ======================================================
// LOGIN EVENT
// ======================================================

async function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    try {

        showMessage(
            "loginMessage",
            "Anmeldung läuft ...",
            "info"
        );


        await loginAdmin(
            email,
            password
        );


        showAdminPanel();


        showMessage(
            "loginMessage",
            "Anmeldung erfolgreich.",
            "success"
        );


    } catch (error) {

        console.error(error);


        showMessage(
            "loginMessage",
            "Anmeldung fehlgeschlagen: " + error.message,
            "error"
        );

    }

}


// ======================================================
// SAVE EVENT
// ======================================================

async function handleSave(event) {

    event.preventDefault();


    const button =
        document.querySelector(
            "#contentForm .admin-primary-button"
        );


    button.disabled = true;

    button.textContent = "Speichern ...";


    try {

        if (selectedContentType === "topic") {

            await saveTopic();

        } else if (
            selectedContentType === "vocabulary"
        ) {

            await saveVocabulary();

        } else if (
            selectedContentType === "grammar"
        ) {

            await saveGrammar();

        }
        else if (selectedContentType === "sprechen") {
            await saveSpeakingTopic();
        }


        clearContentForm();


        showMessage(
            "saveMessage",
            "Erfolgreich in Supabase gespeichert.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save error:",
            error
        );


        showMessage(
            "saveMessage",
            "Speichern fehlgeschlagen: " + error.message,
            "error"
        );

    }


    button.disabled = false;

    button.textContent = "💾 Inhalt speichern";

}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    try {

        await adminSupabase.auth.signOut();

        showLoginPanel();

    } catch (error) {

        console.error(error);

    }

}


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            createAdminSupabase();


            document
                .getElementById("loginForm")
                .addEventListener(
                    "submit",
                    handleLogin
                );


            document
                .getElementById("contentForm")
                .addEventListener(
                    "submit",
                    handleSave
                );


            document
                .getElementById("logoutButton")
                .addEventListener(
                    "click",
                    logout
                );


            document
                .querySelectorAll(".content-type-button")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            switchContentType(
                                button.dataset.contentType
                            );

                        }
                    );

                });


            switchContentType("topic");


            await checkSession();


        } catch (error) {

            console.error(
                "Admin initialization error:",
                error
            );


            showMessage(
                "loginMessage",
                error.message,
                "error"
            );

        }

    }
);
