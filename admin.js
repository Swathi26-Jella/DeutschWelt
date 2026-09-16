// ======================================================
// DEUTSCHWELT – ADMIN CONTENT MANAGER
// ======================================================


// ======================================================
// SUPABASE CONFIGURATION
// ======================================================

const ADMIN_SUPABASE_URL =
    "https://llxcyabptsbdtsdhkzkc.supabase.co";

const ADMIN_SUPABASE_ANON_KEY =
    "sb_publishable_MKh0z87kMiDAQX3jnaoADQ_-D0_XXd4";


// ======================================================
// VARIABLES
// ======================================================

let adminSupabase = null;

let selectedContentType = "topic";


// ======================================================
// CREATE SUPABASE CLIENT
// ======================================================

function createAdminSupabase() {

    if (
        typeof window.supabase === "undefined" ||
        typeof window.supabase.createClient !== "function"
    ) {
        throw new Error(
            "Supabase konnte nicht geladen werden. Bitte prüfe das Supabase-Script in admin.html."
        );
    }

    if (
        !ADMIN_SUPABASE_URL ||
        ADMIN_SUPABASE_URL.includes("PASTE_YOUR")
    ) {
        throw new Error(
            "Die Supabase-URL wurde nicht korrekt eingetragen."
        );
    }

    if (
        !ADMIN_SUPABASE_ANON_KEY ||
        ADMIN_SUPABASE_ANON_KEY.includes("PASTE_YOUR")
    ) {
        throw new Error(
            "Der Supabase-Public-Key wurde nicht korrekt eingetragen."
        );
    }

    adminSupabase = window.supabase.createClient(
        ADMIN_SUPABASE_URL,
        ADMIN_SUPABASE_ANON_KEY
    );

}


// ======================================================
// SHOW MESSAGE
// ======================================================

function showMessage(
    elementId,
    message,
    type = "info"
) {

    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className = `admin-message ${type}`;

}


// ======================================================
// LOGIN
// ======================================================

async function loginAdmin(
    email,
    password
) {

    if (!adminSupabase) {
        throw new Error(
            "Supabase ist noch nicht bereit."
        );
    }

    const {
        data,
        error
    } = await adminSupabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data;

}


// ======================================================
// CHECK EXISTING SESSION
// ======================================================

async function checkSession() {

    if (!adminSupabase) {
        return;
    }

    const {
        data,
        error
    } = await adminSupabase.auth.getSession();

    if (error) {
        throw error;
    }

    if (
        data &&
        data.session
    ) {
        showAdminPanel();
    } else {
        showLoginPanel();
    }

}


// ======================================================
// SHOW ADMIN PANEL
// ======================================================

function showAdminPanel() {

    const loginPanel =
        document.getElementById("adminLogin");

    const adminPanel =
        document.getElementById("adminPanel");

    if (loginPanel) {
        loginPanel.classList.add("hidden");
    }

    if (adminPanel) {
        adminPanel.classList.remove("hidden");
    }

}


// ======================================================
// SHOW LOGIN PANEL
// ======================================================

function showLoginPanel() {

    const loginPanel =
        document.getElementById("adminLogin");

    const adminPanel =
        document.getElementById("adminPanel");

    if (loginPanel) {
        loginPanel.classList.remove("hidden");
    }

    if (adminPanel) {
        adminPanel.classList.add("hidden");
    }

}


// ======================================================
// SWITCH CONTENT TYPE
// ======================================================

function switchContentType(type) {

    selectedContentType = type;

    document
        .querySelectorAll(".content-type-button")
        .forEach(button => {

            const isActive =
                button.dataset.contentType === type;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-selected",
                String(isActive)
            );

        });


    const topicForm =
        document.getElementById("topicForm");

    const vocabularyForm =
        document.getElementById("vocabularyForm");

    const grammarForm =
        document.getElementById("grammarForm");

    const categoryField =
        document.getElementById("categoryField");


    if (topicForm) {
        topicForm.classList.toggle(
            "hidden",
            type !== "topic"
        );
    }

    if (vocabularyForm) {
        vocabularyForm.classList.toggle(
            "hidden",
            type !== "vocabulary"
        );
    }

    if (grammarForm) {
        grammarForm.classList.toggle(
            "hidden",
            type !== "grammar"
        );
    }

    if (categoryField) {
        categoryField.classList.toggle(
            "hidden",
            type === "grammar"
        );
    }

    clearMessage("saveMessage");

}


// ======================================================
// CLEAR MESSAGE
// ======================================================

function clearMessage(elementId) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = "";

    element.className = "admin-message";

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
// GET COMMON FORM DATA
// ======================================================

function getCommonFormData() {

    const level =
        document.getElementById("contentLevel").value;

    const category =
        document.getElementById("category").value.trim();

    const sortOrder =
        Number(
            document.getElementById("sortOrder").value
        );

    if (!level) {
        throw new Error(
            "Bitte ein Niveau auswählen."
        );
    }

    if (
        selectedContentType !== "grammar" &&
        !category
    ) {
        throw new Error(
            "Bitte eine Kategorie eingeben."
        );
    }

    if (
        !Number.isFinite(sortOrder) ||
        sortOrder < 1
    ) {
        throw new Error(
            "Bitte eine gültige Sortierung eingeben."
        );
    }

    return {
        level,
        category,
        sort_order: sortOrder,
        published: true
    };

}


// ======================================================
// SAVE TOPIC
// ======================================================

async function saveTopic() {

    const commonData =
        getCommonFormData();

    const row = {

        ...commonData,

        title:
            document.getElementById(
                "topicTitle"
            ).value.trim(),

        summary:
            document.getElementById(
                "topicSummary"
            ).value.trim(),

        explanation:
            document.getElementById(
                "topicExplanation"
            ).value.trim(),

        key_points:
            linesToArray(
                document.getElementById(
                    "topicKeyPoints"
                ).value
            ),

        sentence_patterns:
            linesToArray(
                document.getElementById(
                    "topicPatterns"
                ).value
            ),

        examples:
            linesToArray(
                document.getElementById(
                    "topicExamples"
                ).value
            ),

        merke:
            document.getElementById(
                "topicMerke"
            ).value.trim(),

        icon:
            document.getElementById(
                "topicIcon"
            ).value.trim(),

        image_url:
            document.getElementById(
                "topicImage"
            ).value.trim() || null

    };


    if (!row.title) {
        throw new Error(
            "Bitte einen Topic-Titel eingeben."
        );
    }

    if (!row.explanation) {
        throw new Error(
            "Bitte eine Erklärung eingeben."
        );
    }


    const {
        error
    } = await adminSupabase
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

    const commonData =
        getCommonFormData();

    const row = {

        ...commonData,

        word:
            document.getElementById(
                "vocabWord"
            ).value.trim(),

        article:
            document.getElementById(
                "vocabArticle"
            ).value,

        plural:
            document.getElementById(
                "vocabPlural"
            ).value.trim(),

        meaning:
            document.getElementById(
                "vocabMeaning"
            ).value.trim(),

        example:
            document.getElementById(
                "vocabExample"
            ).value.trim(),

        note:
            document.getElementById(
                "vocabNote"
            ).value.trim(),

        image_url:
            document.getElementById(
                "vocabImage"
            ).value.trim() || null

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
    } = await adminSupabase
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

    const commonData =
        getCommonFormData();

    const row = {

        level:
            commonData.level,

        title:
            document.getElementById(
                "grammarTitle"
            ).value.trim(),

        short_explanation:
            document.getElementById(
                "grammarShort"
            ).value.trim(),

        explanation:
            document.getElementById(
                "grammarExplanation"
            ).value.trim(),

        rule_preview:
            document.getElementById(
                "grammarRule"
            ).value.trim(),

        key_points:
            linesToArray(
                document.getElementById(
                    "grammarKeyPoints"
                ).value
            ),

        sentence_patterns:
            linesToArray(
                document.getElementById(
                    "grammarPatterns"
                ).value
            ),

        examples:
            linesToArray(
                document.getElementById(
                    "grammarExamples"
                ).value
            ),

        merke:
            document.getElementById(
                "grammarMerke"
            ).value.trim(),

        image_url:
            document.getElementById(
                "grammarImage"
            ).value.trim() || null,

        sort_order:
            commonData.sort_order,

        published:
            true

    };


    if (!row.title) {
        throw new Error(
            "Bitte einen Grammatik-Titel eingeben."
        );
    }

    if (!row.explanation) {
        throw new Error(
            "Bitte eine Erklärung eingeben."
        );
    }


    const {
        error
    } = await adminSupabase
        .from("grammar_topics")
        .insert(row);

    if (error) {
        throw error;
    }

}


// ======================================================
// CLEAR CONTENT FORM
// ======================================================

function clearContentForm() {

    const contentForm =
        document.getElementById("contentForm");

    if (!contentForm) {
        return;
    }

    contentForm.reset();


    document.getElementById(
        "contentLevel"
    ).value = "A1";


    document.getElementById(
        "sortOrder"
    ).value = "1";


    document.getElementById(
        "vocabArticle"
    ).value = "";


    switchContentType(
        selectedContentType
    );

}


// ======================================================
// LOGIN EVENT
// ======================================================

async function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    if (!email || !password) {

        showMessage(
            "loginMessage",
            "Bitte E-Mail und Passwort eingeben.",
            "error"
        );

        return;
    }


    const loginButton =
        document.querySelector(
            "#loginForm button[type='submit']"
        );


    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Anmeldung läuft ...";
    }


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

        console.error(
            "Login error:",
            error
        );


        showMessage(
            "loginMessage",
            "Anmeldung fehlgeschlagen: " +
                getReadableError(error),
            "error"
        );

    } finally {

        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = "Anmelden";
        }

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


    if (button) {
        button.disabled = true;
        button.textContent = "Speichern läuft ...";
    }


    clearMessage("saveMessage");


    try {

        if (
            selectedContentType === "topic"
        ) {

            await saveTopic();

        } else if (
            selectedContentType === "vocabulary"
        ) {

            await saveVocabulary();

        } else if (
            selectedContentType === "grammar"
        ) {

            await saveGrammar();

        } else {

            throw new Error(
                "Unbekannter Inhaltstyp."
            );

        }


        clearContentForm();


        showMessage(
            "saveMessage",
            "Erfolgreich in Supabase gespeichert. Der nächste Google-Sheets-Backup-Lauf übernimmt den neuen Inhalt.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save error:",
            error
        );


        showMessage(
            "saveMessage",
            "Speichern fehlgeschlagen: " +
                getReadableError(error),
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

    if (!adminSupabase) {
        showLoginPanel();
        return;
    }


    try {

        const {
            error
        } = await adminSupabase.auth.signOut();

        if (error) {
            throw error;
        }

        showLoginPanel();

        showMessage(
            "loginMessage",
            "Du wurdest erfolgreich abgemeldet.",
            "success"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            "saveMessage",
            "Abmelden fehlgeschlagen: " +
                getReadableError(error),
            "error"
        );

    }

}


// ======================================================
// READABLE ERROR MESSAGE
// ======================================================

function getReadableError(error) {

    if (!error) {
        return "Unbekannter Fehler.";
    }

    const message =
        error.message || String(error);

    if (
        message.includes("Invalid login credentials")
    ) {
        return "E-Mail oder Passwort ist falsch.";
    }

    if (
        message.includes("Email not confirmed")
    ) {
        return "Bitte bestätige zuerst deine E-Mail-Adresse.";
    }

    if (
        message.includes("row-level security")
    ) {
        return "Speichern wurde durch die Supabase-Berechtigungen blockiert. Bitte prüfe die RLS-Regeln der Tabelle.";
    }

    if (
        message.includes("column") &&
        message.includes("does not exist")
    ) {
        return "Eine Spalte in Supabase wurde nicht gefunden. Bitte prüfe die Tabellenspalten.";
    }

    if (
        message.includes("duplicate key")
    ) {
        return "Dieser Inhalt existiert möglicherweise bereits.";
    }

    return message;

}


// ======================================================
// INITIALIZE ADMIN PAGE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            createAdminSupabase();


            const loginForm =
                document.getElementById("loginForm");

            const contentForm =
                document.getElementById("contentForm");

            const logoutButton =
                document.getElementById("logoutButton");


            if (loginForm) {
                loginForm.addEventListener(
                    "submit",
                    handleLogin
                );
            }

            if (contentForm) {
                contentForm.addEventListener(
                    "submit",
                    handleSave
                );
            }

            if (logoutButton) {
                logoutButton.addEventListener(
                    "click",
                    logout
                );
            }


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
                getReadableError(error),
                "error"
            );

        }

    }
);
