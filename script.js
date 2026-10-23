/* =========================================================
   DEUTSCHWELT – FINAL SCRIPT
   ========================================================= */

const SUPABASE_URL =
    "https://llxcyabptsbdtsdhkzkc.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_MKh0z87kMiDAQX3jnaoADQ_-D0_XXd4";

let supabaseClient = null;
let currentTopics = [];
let germanVoice = null;


/* =========================================================
   SUPABASE
   ========================================================= */

async function connectSupabase() {

    if (!window.supabase) {

        await new Promise((resolve, reject) => {

            const existing =
                document.querySelector(
                    'script[src*="supabase-js"]'
                );

            if (existing) {

                existing.addEventListener(
                    "load",
                    resolve,
                    { once: true }
                );

                existing.addEventListener(
                    "error",
                    reject,
                    { once: true }
                );

                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(script);

        });

    }

    if (!window.supabase) {
        throw new Error(
            "Supabase konnte nicht geladen werden."
        );
    }

    if (!supabaseClient) {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function parseArray(value) {

    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    try {

        const parsed =
            JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        if (typeof value === "string") {

            return value
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

        }

        return [];
    }
}


function getURLLevel() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const value =
        (params.get("level") || "A1")
        .toUpperCase()
        .trim();

    return [
        "A1",
        "A2",
        "B1",
        "B2"
    ].includes(value)
        ? value
        : "A1";
}


/* =========================================================
   GERMAN AUDIO
   ========================================================= */

function loadGermanVoice() {

    if (!("speechSynthesis" in window)) {
        return;
    }

    const voices =
        speechSynthesis.getVoices();

    germanVoice =
        voices.find(
            voice =>
                voice.lang &&
                voice.lang.toLowerCase()
                    .startsWith("de")
        ) || null;
}


if ("speechSynthesis" in window) {

    loadGermanVoice();

    speechSynthesis.onvoiceschanged =
        loadGermanVoice;
}


function speakGerman(text) {

    if (
        !text ||
        !("speechSynthesis" in window)
    ) {
        return;
    }

    speechSynthesis.cancel();

    const cleanText =
        String(text)
            .replace(/<[^>]*>/g, "")
            .trim();

    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );

    utterance.lang = "de-DE";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    if (germanVoice) {
        utterance.voice = germanVoice;
    }

    speechSynthesis.speak(
        utterance
    );
}


function audioButton(
    text,
    label = "Anhören"
) {

    if (!text) {
        return "";
    }

    return `
        <button
            type="button"
            class="audio-button"
            title="${escapeHTML(label)}"
            aria-label="${escapeHTML(label)}"
            data-audio-text="${escapeHTML(text)}">
            🔊
        </button>
    `;
}


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".audio-button"
            );

        if (!button) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        speakGerman(
            button.dataset.audioText
        );

    }
);


/* =========================================================
   LEARNING PAGE
   ========================================================= */

async function loadLearningPage() {

    const navigation =
        document.getElementById(
            "topicNavigation"
        );

    const content =
        document.getElementById(
            "topicContent"
        );

    if (!navigation || !content) {
        return;
    }

    const level =
        getURLLevel();


    const titles = {

        A1:
            "A1 – Deutsch von Anfang an",

        A2:
            "A2 – Deutsch im Alltag",

        B1:
            "B1 – Selbstständig Deutsch sprechen",

        B2:
            "B2 – Deutsch sicher anwenden"

    };


    const descriptions = {

        A1:
            "Alphabet, Aussprache, Zahlen, Alltag und grundlegende Grammatik.",

        A2:
            "Erweitere deine Grundlagen und lerne Deutsch für vertraute Alltagssituationen.",

        B1:
            "Sprich über Erfahrungen, Arbeit, Alltag, Pläne und vertraute Themen.",

        B2:
            "Vertiefe deine Kenntnisse für anspruchsvollere Gespräche und Texte."

    };


    const title =
        document.getElementById(
            "levelTitle"
        );

    const eyebrow =
        document.getElementById(
            "levelEyebrow"
        );

    const description =
        document.getElementById(
            "levelDescription"
        );


    if (title) {
        title.textContent =
            titles[level];
    }

    if (eyebrow) {
        eyebrow.textContent =
            `${level} · Lernstufe`;
    }

    if (description) {
        description.textContent =
            descriptions[level];
    }


    document
        .querySelectorAll(
            "[data-level-link]"
        )
        .forEach(link => {

            link.classList.toggle(
                "selected",
                link.dataset.levelLink === level
            );

        });


    navigation.innerHTML = `
        <div class="loading-message">
            <div class="loading-spinner"></div>
            <span>
                Themen werden geladen ...
            </span>
        </div>
    `;


    try {

        await connectSupabase();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("topics")
                .select("*")
                .eq("level", level)
                .eq("published", true)
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        currentTopics =
            data || [];


        renderTopicNavigation();


        if (currentTopics.length) {

            showTopic(
                currentTopics[0].id
            );

        } else {

            content.innerHTML = `
                <div class="welcome-content">
                    <div class="welcome-icon">
                        📚
                    </div>

                    <h2>
                        Noch keine Inhalte
                    </h2>

                    <p>
                        Für ${escapeHTML(level)}
                        sind momentan keine
                        veröffentlichten Themen vorhanden.
                    </p>
                </div>
            `;

        }

    } catch (error) {

        console.error(
            "Learning page error:",
            error
        );

        navigation.innerHTML = `
            <div class="error-message">
                <strong>
                    Lerninhalte konnten nicht geladen werden.
                </strong>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Unbekannter Fehler."
                    )}
                </p>
            </div>
        `;

    }

}


/* =========================================================
   TOPIC NAVIGATION
   ========================================================= */

function renderTopicNavigation() {
    const navigation = document.getElementById("topicNavigation");

    if (!navigation) {
        return;
    }

    navigation.innerHTML = "";

    // Separate regular learning topics from speaking topics.
    const regularTopics = currentTopics.filter(
        topic => topic.content_type !== "sprechen"
    );

    const speakingTopics = currentTopics.filter(
        topic => topic.content_type === "sprechen"
    );

    // Helper: create a button for a topic.
    function createTopicButton(topic) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "topic-button";
        button.dataset.topicId = topic.id;

        button.innerHTML = `
            <span class="topic-icon">
                ${escapeHTML(topic.icon || "📘")}
            </span>

            <span class="topic-button-text">
                ${escapeHTML(topic.title || "")}
            </span>

            <span class="topic-nav-audio" title="Titel anhören">
                🔊
            </span>
        `;

        button.addEventListener("click", event => {
            const audio = event.target.closest(".topic-nav-audio");

            if (audio) {
                event.preventDefault();
                event.stopPropagation();
                speakGerman(topic.title);
                return;
            }

            showTopic(topic.id);
        });

        return button;
    }

    // Helper: create a section with a heading.
    function createSection(title) {
        const wrapper = document.createElement("div");
        wrapper.className = "topic-category";

        const heading = document.createElement("h3");
        heading.textContent = title;

        wrapper.appendChild(heading);
        navigation.appendChild(wrapper);

        return wrapper;
    }

    // SECTION 1: Regular learning topics, grouped by category.
    if (regularTopics.length > 0) {
        createSection("📘 Themen");

        const categories = {};

        regularTopics.forEach(topic => {
            const category = topic.category || "Allgemein";

            if (!categories[category]) {
                categories[category] = [];
            }

            categories[category].push(topic);
        });

        Object.keys(categories).forEach(category => {
            const categoryWrapper = document.createElement("div");
            categoryWrapper.className = "topic-subcategory";

            const heading = document.createElement("h4");
            heading.textContent = category;
            categoryWrapper.appendChild(heading);

            categories[category].forEach(topic => {
                categoryWrapper.appendChild(createTopicButton(topic));
            });

            navigation.appendChild(categoryWrapper);
        });
    }

    // SECTION 2: Speaking topics, separate from regular topics.
    if (speakingTopics.length > 0) {
        const speakingSection = createSection("🗣️ Sprechen");

        speakingTopics.forEach(topic => {
            speakingSection.appendChild(createTopicButton(topic));
        });
    }

    // Keep existing content accessible if no topics exist.
    if (currentTopics.length === 0) {
        navigation.innerHTML = `
            <p class="welcome-content">
                Noch keine veröffentlichten Themen vorhanden.
            </p>
        `;
    }
}



/* =========================================================
   SHOW TOPIC
   ========================================================= */

function showTopic(id) {

    const topic =
        currentTopics.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!topic) {
        return;
    }


    document
        .querySelectorAll(
            ".topic-button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                String(
                    button.dataset.topicId
                ) === String(id)
            );

        });


    const content =
        document.getElementById(
            "topicContent"
        );

    if (!content) {
        return;
    }


    content.innerHTML =
        buildTopicHTML(topic);


    content.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* =========================================================
   TOPIC HTML
   ========================================================= */

function buildTopicHTML(topic) {
    const points = parseArray(topic.key_points);
    const patterns = parseArray(topic.sentence_patterns);
    const examples = parseArray(topic.examples);

    // Sprechen-specific fields
    const speakingPhrases = parseArray(topic.speaking_phrases);
    const dialogue = parseArray(topic.dialogue);

    let grammarNotes = [];
    if (Array.isArray(topic.grammar_notes)) {
        grammarNotes = topic.grammar_notes;
    } else if (typeof topic.grammar_notes === "string" && topic.grammar_notes.trim()) {
        try {
            const parsed = JSON.parse(topic.grammar_notes);
            grammarNotes = Array.isArray(parsed) ? parsed : [topic.grammar_notes];
        } catch {
            grammarNotes = [topic.grammar_notes];
        }
    }

    const isSpeaking = topic.content_type === "sprechen";

    return `
        <article class="topic-article">

            <div class="topic-title-row">
                <div>
                    <div class="eyebrow">
                        ${escapeHTML(topic.category || "Lernwelt")}
                    </div>
                    <h1 style="margin-top:12px;">
                        ${escapeHTML(topic.icon || "📘")}
                        ${escapeHTML(topic.title || "")}
                    </h1>
                </div>
                ${audioButton(topic.title, "Thema anhören")}
            </div>

            ${topic.summary ? `
                <p class="topic-summary">
                    ${escapeHTML(topic.summary)}
                </p>
            ` : ""}

            ${topic.explanation ? `
                <section class="content-section">
                    <h3>📖 Erklärung auf Deutsch</h3>
                    <p>${escapeHTML(topic.explanation)}</p>
                    ${audioButton(topic.explanation, "Deutsche Erklärung anhören")}
                </section>
            ` : ""}

            ${isSpeaking && topic.explanation_en ? `
                <section class="content-section">
                    <h3>🇬🇧 Explanation in English</h3>
                    <p>${escapeHTML(topic.explanation_en)}</p>
                </section>
            ` : ""}

            ${isSpeaking && speakingPhrases.length ? `
                <section class="content-section">
                    <h3>🗣️ Wichtige Redemittel</h3>

                    ${speakingPhrases.map(group => {
                        if (typeof group === "string") {
                            return `<p>${escapeHTML(group)}</p>`;
                        }

                        const phrases = parseArray(group.phrases);

                        return `
                            <div class="speaking-phrase-group">
                                <h4>${escapeHTML(group.category || "Redemittel")}</h4>
                                <div class="example-list">
                                    ${phrases.map(phrase => {
                                        if (typeof phrase === "string") {
                                            return `<div class="example-box">${escapeHTML(phrase)}</div>`;
                                        }

                                        return `
                                            <div class="example-box">
                                                <div>
                                                    <strong>${escapeHTML(phrase.de || "")}</strong>
                                                    ${audioButton(phrase.de, "Redemittel anhören")}
                                                    ${phrase.en ? `<p>${escapeHTML(phrase.en)}</p>` : ""}
                                                </div>
                                            </div>
                                        `;
                                    }).join("")}
                                </div>
                            </div>
                        `;
                    }).join("")}
                </section>
            ` : ""}

            ${isSpeaking && dialogue.length ? `
                <section class="content-section">
                    <h3>🎭 Beispieldialog</h3>

                    <div class="dialogue-list">
                        ${dialogue.map(line => {
                            if (typeof line === "string") {
                                return `<p>${escapeHTML(line)}</p>`;
                            }

                            return `
                                <div class="dialogue-line">
                                    <strong>${escapeHTML(line.speaker || "Person")}:</strong>
                                    <span>${escapeHTML(line.text || "")}</span>
                                    ${audioButton(line.text, "Dialog anhören")}
                                </div>
                            `;
                        }).join("")}
                    </div>
                </section>
            ` : ""}

            ${isSpeaking && grammarNotes.length ? `
                <section class="content-section">
                    <h3>🧩 Grammatik und sprachliche Hinweise</h3>
                    <ul class="content-list">
                        ${grammarNotes.map(note => `
                            <li>
                                ${escapeHTML(
                                    typeof note === "string"
                                        ? note
                                        : note.text || note.de || JSON.stringify(note)
                                )}
                            </li>
                        `).join("")}
                    </ul>
                </section>
            ` : ""}

            ${points.length ? `
                <section class="content-section">
                    <h3>⭐ Wichtig</h3>
                    <ul class="content-list">
                        ${points.map(item => `
                            <li>${escapeHTML(item)}</li>
                        `).join("")}
                    </ul>
                </section>
            ` : ""}

            ${patterns.length ? `
                <section class="content-section">
                    <h3>🧩 Satzmuster</h3>
                    <div class="pattern-list">
                        ${patterns.map(item => `
                            <div class="pattern-box">
                                <span>${escapeHTML(item)}</span>
                                ${audioButton(item, "Satzmuster anhören")}
                            </div>
                        `).join("")}
                    </div>
                </section>
            ` : ""}

            ${examples.length ? `
                <section class="content-section">
                    <h3>💬 Beispiele</h3>
                    <div class="example-list">
                        ${examples.map(item => `
                            <div class="example-box">
                                <span>${escapeHTML(item)}</span>
                                ${audioButton(item, "Beispiel anhören")}
                            </div>
                        `).join("")}
                    </div>
                </section>
            ` : ""}

            ${topic.merke ? `
                <section class="merke-box">
                    <div class="merke-icon">💡</div>
                    <div>
                        <strong>Merke</strong>
                        <p>
                            ${escapeHTML(topic.merke)}
                            ${audioButton(topic.merke, "Merksatz anhören")}
                        </p>
                    </div>
                </section>
            ` : ""}

        </article>
    `;
}


/* =========================================================
   VOCABULARY
   ========================================================= */

async function loadVocabulary(level) {

    const grid =
        document.getElementById(
            "vocabularyGrid"
        );

    if (!grid) {
        return;
    }


    grid.innerHTML = `
        <div class="loading-message">

            <div class="loading-spinner"></div>

            <span>
                Wortschatz wird geladen ...
            </span>

        </div>
    `;


    try {

        await connectSupabase();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("vocabulary")
                .select("*")
                .eq("level", level)
                .eq("published", true)
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        if (!data || !data.length) {

            grid.innerHTML = `
                <div class="welcome-content">

                    <div class="welcome-icon">
                        📚
                    </div>

                    <h2>
                        Noch kein Wortschatz
                    </h2>

                    <p>
                        Für ${escapeHTML(level)}
                        wurden noch keine
                        veröffentlichten Wörter hinzugefügt.
                    </p>

                </div>
            `;

            return;
        }


        const categories = {};


        data.forEach(word => {

            const category =
                word.category ||
                "Allgemein";

            if (!categories[category]) {
                categories[category] = [];
            }

            categories[category].push(word);

        });


        grid.innerHTML = `

            <div class="vocabulary-page-content">

                ${Object.keys(categories)
                    .map(
                        category => `

                            <section class="vocabulary-category">

                                <h2>
                                    ${escapeHTML(category)}
                                </h2>

                                <div class="vocabulary-grid">

                                    ${categories[category]
                                        .map(
                                            word =>
                                                buildVocabularyCard(
                                                    word
                                                )
                                        )
                                        .join("")}

                                </div>

                            </section>

                        `
                    )
                    .join("")}

            </div>

        `;

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div class="error-message">

                <strong>
                    Wortschatz konnte nicht geladen werden.
                </strong>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Unbekannter Fehler."
                    )}
                </p>

            </div>
        `;

    }

}


/* =========================================================
   VOCABULARY CARD
   ========================================================= */

function buildVocabularyCard(word) {

    const article =
        word.article
            ? `<span class="vocabulary-article">
                ${escapeHTML(word.article)}
               </span>`
            : "";


    return `

        <article class="vocabulary-card">

            <span class="article-category">
                ${escapeHTML(
                    word.category ||
                    "Wort"
                )}
            </span>


            <h3>

                <span>
                    ${article}
                    ${escapeHTML(
                        word.word || ""
                    )}
                </span>

                ${audioButton(
                    word.word,
                    "Wort anhören"
                )}

            </h3>


            ${
                word.plural
                    ? `
                        <div class="vocabulary-plural">
                            Plural:
                            ${escapeHTML(
                                word.plural
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                word.meaning
                    ? `
                        <div class="vocabulary-meaning">
                            ${escapeHTML(
                                word.meaning
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                word.example
                    ? `
                        <div class="vocabulary-example">

                            <span>
                                ${escapeHTML(
                                    word.example
                                )}
                            </span>

                            ${audioButton(
                                word.example,
                                "Beispielsatz anhören"
                            )}

                        </div>
                    `
                    : ""
            }


            ${
                word.note
                    ? `
                        <div class="vocabulary-note">
                            💡
                            ${escapeHTML(
                                word.note
                            )}
                        </div>
                    `
                    : ""
            }

        </article>

    `;

}


/* =========================================================
   GRAMMAR
   ========================================================= */

async function loadGrammar(level) {

    const grid =
        document.getElementById(
            "grammarGrid"
        );

    if (!grid) {
        return;
    }


    grid.innerHTML = `
        <div class="loading-message">

            <div class="loading-spinner"></div>

            <span>
                Grammatik wird geladen ...
            </span>

        </div>
    `;


    try {

        await connectSupabase();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("grammar_topics")
                .select("*")
                .eq("level", level)
                .eq("published", true)
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (error) {
            throw error;
        }


        if (!data || !data.length) {

            grid.innerHTML = `
                <div class="welcome-content">

                    <div class="welcome-icon">
                        📘
                    </div>

                    <h2>
                        Noch keine Grammatik
                    </h2>

                    <p>
                        Für ${escapeHTML(level)}
                        wurden noch keine
                        veröffentlichten Grammatikthemen
                        hinzugefügt.
                    </p>

                </div>
            `;

            return;
        }


        grid.innerHTML = `

            <div class="grammar-grid">

                ${data
                    .map(
                        item =>
                            buildGrammarCard(item)
                    )
                    .join("")}

            </div>

        `;

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div class="error-message">

                <strong>
                    Grammatik konnte nicht geladen werden.
                </strong>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Unbekannter Fehler."
                    )}
                </p>

            </div>
        `;

    }

}


/* =========================================================
   GRAMMAR CARD
   ========================================================= */

function buildGrammarCard(item) {

    const points =
        parseArray(
            item.key_points
        );

    const patterns =
        parseArray(
            item.sentence_patterns
        );

    const examples =
        parseArray(
            item.examples
        );


    return `

        <article class="grammar-card">

            <span class="article-category">
                Grammatik
            </span>


            <h2>

                <span>
                    ${escapeHTML(
                        item.title || ""
                    )}
                </span>

                ${audioButton(
                    item.title,
                    "Grammatikthema anhören"
                )}

            </h2>


            ${
                item.short_explanation
                    ? `
                        <p class="grammar-short">
                            ${escapeHTML(
                                item.short_explanation
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                item.rule_preview
                    ? `
                        <div class="grammar-rule">

                            <span>
                                ${escapeHTML(
                                    item.rule_preview
                                )}
                            </span>

                            ${audioButton(
                                item.rule_preview,
                                "Regel anhören"
                            )}

                        </div>
                    `
                    : ""
            }


            ${
                item.explanation
                    ? `
                        <p class="grammar-explanation">
                            ${escapeHTML(
                                item.explanation
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                points.length
                    ? `
                        <h3>
                            ⭐ Wichtig
                        </h3>

                        <ul>

                            ${points.map(
                                point => `
                                    <li>
                                        ${escapeHTML(point)}
                                    </li>
                                `
                            ).join("")}

                        </ul>
                    `
                    : ""
            }


            ${
                patterns.length
                    ? `
                        <h3>
                            🧩 Satzmuster
                        </h3>

                        ${patterns.map(
                            pattern => `
                                <div class="grammar-example">

                                    ${escapeHTML(pattern)}

                                    ${audioButton(
                                        pattern,
                                        "Satzmuster anhören"
                                    )}

                                </div>
                            `
                        ).join("")}
                    `
                    : ""
            }


            ${
                examples.length
                    ? `
                        <h3>
                            💬 Beispiele
                        </h3>

                        ${examples.map(
                            example => `
                                <div class="grammar-example">

                                    ${escapeHTML(example)}

                                    ${audioButton(
                                        example,
                                        "Beispiel anhören"
                                    )}

                                </div>
                            `
                        ).join("")}
                    `
                    : ""
            }

        </article>

    `;

}


/* =========================================================
   LEVEL BUTTONS
   ========================================================= */

function setupLevelButtons() {

    document
        .querySelectorAll(
            "[data-vocab-level]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "[data-vocab-level]"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                            item.setAttribute(
                                "aria-pressed",
                                "false"
                            );

                        });


                    button.classList.add(
                        "active"
                    );

                    button.setAttribute(
                        "aria-pressed",
                        "true"
                    );


                    loadVocabulary(
                        button.dataset.vocabLevel
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-grammar-level]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "[data-grammar-level]"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                            item.setAttribute(
                                "aria-pressed",
                                "false"
                            );

                        });


                    button.classList.add(
                        "active"
                    );

                    button.setAttribute(
                        "aria-pressed",
                        "true"
                    );


                    loadGrammar(
                        button.dataset.grammarLevel
                    );

                }
            );

        });

}

/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

let searchData = [];
let searchLoaded = false;
let searchLoading = false;


/* ---------------------------------------------------------
   SEARCH UI
   --------------------------------------------------------- */

function createGlobalSearch() {

    if (
        document.body.classList.contains("admin-page") ||
        document.getElementById("globalSearchButton")
    ) {
        return;
    }

    const headerInner =
        document.querySelector(".header-inner");

    if (!headerInner) {
        return;
    }


    /* Search button */

    const searchButton =
        document.createElement("button");

    searchButton.type = "button";
    searchButton.id = "globalSearchButton";
    searchButton.className = "global-search-button";

    searchButton.innerHTML = `
        <span class="global-search-icon">🔍</span>
        <span class="global-search-text">Suchen</span>
    `;

    searchButton.setAttribute(
        "aria-label",
        "DEUTSCHWELT durchsuchen"
    );


    /* Put search button before Kontakt */

    const contact =
        headerInner.querySelector(".header-contact");

    if (contact) {
        headerInner.insertBefore(
            searchButton,
            contact
        );
    } else {
        headerInner.appendChild(
            searchButton
        );
    }


    /* Search overlay */

    const overlay =
        document.createElement("div");

    overlay.id = "globalSearchOverlay";
    overlay.className = "global-search-overlay";

    overlay.innerHTML = `

        <div
            class="global-search-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="globalSearchTitle"
        >

            <div class="global-search-header">

                <div>
                    <span class="eyebrow">
                        DEUTSCHWELT
                    </span>

                    <h2 id="globalSearchTitle">
                        🔍 Suche
                    </h2>

                    <p>
                        Suche nach Wörtern, Grammatik
                        oder Lernthemen.
                    </p>
                </div>

                <button
                    type="button"
                    class="global-search-close"
                    id="globalSearchClose"
                    aria-label="Suche schließen"
                >
                    ✕
                </button>

            </div>


            <div class="global-search-input-wrapper">

                <span>🔍</span>

                <input
                    type="search"
                    id="globalSearchInput"
                    placeholder="z. B. Arbeit, Passiv, Familie, CAN ..."
                    autocomplete="off"
                >

            </div>


            <div
                id="globalSearchStatus"
                class="global-search-status"
            >
                Suche starten ...
            </div>


            <div
                id="globalSearchResults"
                class="global-search-results"
            ></div>

        </div>

    `;

    document.body.appendChild(
        overlay
    );


    /* Open */

    searchButton.addEventListener(
        "click",
        openGlobalSearch
    );


    /* Close */

    document
        .getElementById("globalSearchClose")
        .addEventListener(
            "click",
            closeGlobalSearch
        );


    /* Click outside */

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                closeGlobalSearch();
            }

        }
    );


    /* Search */

    const input =
        document.getElementById(
            "globalSearchInput"
        );

    input.addEventListener(
        "input",
        debounce(
            performGlobalSearch,
            250
        )
    );


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                overlay.classList.contains("open")
            ) {
                closeGlobalSearch();
            }

        }
    );

}


function openGlobalSearch() {

    const overlay =
        document.getElementById(
            "globalSearchOverlay"
        );

    const input =
        document.getElementById(
            "globalSearchInput"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.add("open");

    document.body.classList.add(
        "search-open"
    );


    if (input) {

        input.value = "";

        setTimeout(
            () => input.focus(),
            100
        );

    }


    const results =
        document.getElementById(
            "globalSearchResults"
        );

    if (results) {
        results.innerHTML = "";
    }


    const status =
        document.getElementById(
            "globalSearchStatus"
        );

    if (status) {
        status.textContent =
            "Suchbegriff eingeben ...";
    }


    loadGlobalSearchData();

}


function closeGlobalSearch() {

    const overlay =
        document.getElementById(
            "globalSearchOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove("open");

    document.body.classList.remove(
        "search-open"
    );

}


/* ---------------------------------------------------------
   DEBOUNCE
   --------------------------------------------------------- */

function debounce(
    functionToCall,
    delay
) {

    let timer;

    return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(
            () => {
                functionToCall.apply(
                    this,
                    args
                );
            },
            delay
        );

    };

}


/* ---------------------------------------------------------
   LOAD ALL SEARCH DATA
   --------------------------------------------------------- */

async function loadGlobalSearchData() {

    if (searchLoaded) {
        return;
    }

    if (searchLoading) {
        return;
    }

    searchLoading = true;


    const status =
        document.getElementById(
            "globalSearchStatus"
        );


    if (status) {
        status.textContent =
            "Alle Lerninhalte werden geladen ...";
    }


    try {

        await connectSupabase();


        const [
            topicsResult,
            vocabularyResult,
            grammarResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("topics")
                    .select("*")
                    .eq("published", true),

                supabaseClient
                    .from("vocabulary")
                    .select("*")
                    .eq("published", true),

                supabaseClient
                    .from("grammar_topics")
                    .select("*")
                    .eq("published", true)

            ]);


        if (topicsResult.error) {
            throw topicsResult.error;
        }

        if (vocabularyResult.error) {
            throw vocabularyResult.error;
        }

        if (grammarResult.error) {
            throw grammarResult.error;
        }


        searchData = [];


        /* Lernwelten */

        (topicsResult.data || [])
            .forEach(item => {

                searchData.push({

                    type: "topic",

                    level:
                        item.level || "",

                    title:
                        item.title || "Lernthema",

                    category:
                        item.category || "Lernwelt",

                    icon:
                        item.icon || "📘",

                    data:
                        item

                });

            });


        /* Wortschatz */

        (vocabularyResult.data || [])
            .forEach(item => {

                searchData.push({

                    type: "vocabulary",

                    level:
                        item.level || "",

                    title:
                        item.word || "Wort",

                    category:
                        item.category || "Wortschatz",

                    icon:
                        "📖",

                    data:
                        item

                });

            });


        /* Grammatik */

        (grammarResult.data || [])
            .forEach(item => {

                searchData.push({

                    type: "grammar",

                    level:
                        item.level || "",

                    title:
                        item.title || "Grammatik",

                    category:
                        "Grammatik",

                    icon:
                        "📚",

                    data:
                        item

                });

            });


        searchLoaded = true;


        if (status) {

            status.textContent =
                `${searchData.length} Lerninhalte bereit.`;

        }


    } catch (error) {

        console.error(
            "Global search loading error:",
            error
        );


        if (status) {

            status.textContent =
                "Die Lerninhalte konnten nicht geladen werden.";

        }

    } finally {

        searchLoading = false;

    }

}


/* ---------------------------------------------------------
   SEARCH
   --------------------------------------------------------- */

async function performGlobalSearch() {

    await loadGlobalSearchData();


    const input =
        document.getElementById(
            "globalSearchInput"
        );

    const resultsContainer =
        document.getElementById(
            "globalSearchResults"
        );

    const status =
        document.getElementById(
            "globalSearchStatus"
        );


    if (!input || !resultsContainer) {
        return;
    }


    const query =
        input.value
            .trim()
            .toLowerCase();


    resultsContainer.innerHTML = "";


    if (!query) {

        if (status) {
            status.textContent =
                "Suchbegriff eingeben ...";
        }

        return;
    }


    /*
     * Search through the complete Supabase row.
     *
     * This means the search also checks:
     * title
     * word
     * meaning
     * explanation
     * examples
     * key_points
     * sentence_patterns
     * notes
     * rules
     * and other existing fields.
     */

    const terms =
        query
            .split(/\s+/)
            .filter(Boolean);


    const matches =
        searchData.filter(
            item => {

                const searchableText =
                    JSON.stringify(
                        item.data
                    )
                    .toLowerCase();


                /*
                 * Every word entered by the user
                 * must be found somewhere in
                 * the complete content.
                 */

                return terms.every(
                    term =>
                        searchableText.includes(
                            term
                        )
                );

            }
        );


    if (status) {

        status.textContent =
            matches.length === 1
                ? "1 Ergebnis gefunden."
                : `${matches.length} Ergebnisse gefunden.`;

    }


    if (!matches.length) {

        resultsContainer.innerHTML = `

            <div class="global-search-empty">

                <div>
                    🔎
                </div>

                <h3>
                    Keine Ergebnisse
                </h3>

                <p>
                    Versuche einen anderen Suchbegriff,
                    zum Beispiel „Arbeit“, „Passiv“
                    oder „Familie“.
                </p>

            </div>

        `;

        return;
    }


    /* Group results */

    const groups = {

        topic: {
            title: "📘 Lernwelten",
            items: []
        },

        vocabulary: {
            title: "📖 Wortschatz",
            items: []
        },

        grammar: {
            title: "📚 Grammatik",
            items: []
        }

    };


    matches.forEach(
        item => {

            if (groups[item.type]) {
                groups[item.type].items.push(
                    item
                );
            }

        }
    );


    Object.values(groups)
        .forEach(group => {

            if (!group.items.length) {
                return;
            }


            const section =
                document.createElement(
                    "section"
                );

            section.className =
                "global-search-group";


            const heading =
                document.createElement(
                    "h3"
                );

            heading.textContent =
                group.title;


            section.appendChild(
                heading
            );


            group.items.forEach(
                item => {

                    section.appendChild(
                        createSearchResult(
                            item
                        )
                    );

                }
            );


            resultsContainer.appendChild(
                section
            );

        });

}


/* ---------------------------------------------------------
   SEARCH RESULT
   --------------------------------------------------------- */

function createSearchResult(item) {

    const result =
        document.createElement(
            "article"
        );

    result.className =
        "global-search-result";


    result.innerHTML = `

        <div class="search-result-top">

            <span class="search-result-icon">
                ${escapeHTML(item.icon)}
            </span>

            <div class="search-result-main">

                <div class="search-result-meta">

                    <span>
                        ${escapeHTML(
                            item.level || ""
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            item.category || ""
                        )}
                    </span>

                </div>

                <h4>
                    ${escapeHTML(
                        item.title
                    )}
                </h4>

            </div>

            <span class="search-result-arrow">
                →
            </span>

        </div>

        <div
            class="search-result-content"
        ></div>

    `;


    result.addEventListener(
        "click",
        () => {

            const content =
                result.querySelector(
                    ".search-result-content"
                );

            const alreadyOpen =
                result.classList.contains(
                    "expanded"
                );


            /* Close all other results */

            document
                .querySelectorAll(
                    ".global-search-result.expanded"
                )
                .forEach(
                    other => {

                        if (
                            other !== result
                        ) {

                            other.classList.remove(
                                "expanded"
                            );

                            const otherContent =
                                other.querySelector(
                                    ".search-result-content"
                                );

                            if (otherContent) {
                                otherContent.innerHTML =
                                    "";
                            }

                        }

                    }
                );


            if (alreadyOpen) {

                result.classList.remove(
                    "expanded"
                );

                content.innerHTML = "";

                return;
            }


            result.classList.add(
                "expanded"
            );


            /*
             * Show the COMPLETE existing content.
             */

            if (item.type === "topic") {

                content.innerHTML =
                    buildTopicHTML(
                        item.data
                    );

            }

            else if (
                item.type === "vocabulary"
            ) {

                content.innerHTML = `

                    <div class="search-full-content">

                        ${buildVocabularyCard(
                            item.data
                        )}

                    </div>

                `;

            }

            else if (
                item.type === "grammar"
            ) {

                content.innerHTML = `

                    <div class="search-full-content">

                        ${buildGrammarCard(
                            item.data
                        )}

                    </div>

                `;

            }


            /*
             * Keep result visible.
             */

            setTimeout(
                () => {

                    result.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest"
                    });

                },
                50
            );

        }
    );


    return result;

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createGlobalSearch();

        loadLearningPage();

        setupLevelButtons();


        const vocabButton =
            document.querySelector(
                "[data-vocab-level].active"
            );

        if (vocabButton) {

            loadVocabulary(
                vocabButton.dataset.vocabLevel
            );

        }


        const grammarButton =
            document.querySelector(
                "[data-grammar-level].active"
            );

        if (grammarButton) {

            loadGrammar(
                grammarButton.dataset.grammarLevel
            );

        }

    }
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadLearningPage();

        setupLevelButtons();

        const vocabButton =
            document.querySelector(
                "[data-vocab-level].active"
            );

        if (vocabButton) {

            loadVocabulary(
                vocabButton.dataset.vocabLevel
            );

        }


        const grammarButton =
            document.querySelector(
                "[data-grammar-level].active"
            );

        if (grammarButton) {

            loadGrammar(
                grammarButton.dataset.grammarLevel
            );

        }

    }
);
