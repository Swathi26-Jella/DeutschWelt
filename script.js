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

    const navigation =
        document.getElementById(
            "topicNavigation"
        );

    if (!navigation) {
        return;
    }

    navigation.innerHTML = "";


    const categories = {};


    currentTopics.forEach(topic => {

        const category =
            topic.category ||
            "Allgemein";

        if (!categories[category]) {
            categories[category] = [];
        }

        categories[category].push(topic);

    });


    Object.keys(categories)
        .forEach(category => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "topic-category";


            const heading =
                document.createElement(
                    "h3"
                );

            heading.textContent =
                category;


            wrapper.appendChild(
                heading
            );


            categories[category]
                .forEach(topic => {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type = "button";

                    button.className =
                        "topic-button";

                    button.dataset.topicId =
                        topic.id;


                    button.innerHTML = `

                        <span class="topic-icon">
                            ${escapeHTML(
                                topic.icon || "📘"
                            )}
                        </span>

                        <span class="topic-button-text">
                            ${escapeHTML(
                                topic.title || ""
                            )}
                        </span>

                        <span
                            class="topic-nav-audio"
                            title="Titel anhören">
                            🔊
                        </span>

                    `;


                    button.addEventListener(
                        "click",
                        event => {

                            const audio =
                                event.target.closest(
                                    ".topic-nav-audio"
                                );

                            if (audio) {

                                event.preventDefault();
                                event.stopPropagation();

                                speakGerman(
                                    topic.title
                                );

                                return;
                            }

                            showTopic(
                                topic.id
                            );

                        }
                    );


                    wrapper.appendChild(
                        button
                    );

                });


            navigation.appendChild(
                wrapper
            );

        });

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

    const points =
        parseArray(
            topic.key_points
        );

    const patterns =
        parseArray(
            topic.sentence_patterns
        );

    const examples =
        parseArray(
            topic.examples
        );


    return `

        <article class="topic-article">

            <div class="topic-title-row">

                <div>

                    <div class="eyebrow">
                        ${escapeHTML(
                            topic.category ||
                            "Lernwelt"
                        )}
                    </div>

                    <h1 style="margin-top:12px;">
                        ${escapeHTML(
                            topic.icon || "📘"
                        )}
                        ${escapeHTML(
                            topic.title || ""
                        )}
                    </h1>

                </div>

                ${audioButton(
                    topic.title,
                    "Thema anhören"
                )}

            </div>


            ${
                topic.summary
                    ? `
                        <p class="topic-summary">
                            ${escapeHTML(
                                topic.summary
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                topic.explanation
                    ? `
                        <section class="content-section">

                            <h3>
                                📖 Erklärung
                            </h3>

                            <p>
                                ${escapeHTML(
                                    topic.explanation
                                )}
                            </p>

                        </section>
                    `
                    : ""
            }


            ${
                points.length
                    ? `
                        <section class="content-section">

                            <h3>
                                ⭐ Wichtig
                            </h3>

                            <ul class="content-list">

                                ${points.map(
                                    item => `
                                        <li>
                                            ${escapeHTML(item)}
                                        </li>
                                    `
                                ).join("")}

                            </ul>

                        </section>
                    `
                    : ""
            }


            ${
                patterns.length
                    ? `
                        <section class="content-section">

                            <h3>
                                🧩 Satzmuster
                            </h3>

                            <div class="pattern-list">

                                ${patterns.map(
                                    item => `

                                        <div class="pattern-box">

                                            <span>
                                                ${escapeHTML(item)}
                                            </span>

                                            ${audioButton(
                                                item,
                                                "Satzmuster anhören"
                                            )}

                                        </div>

                                    `
                                ).join("")}

                            </div>

                        </section>
                    `
                    : ""
            }


            ${
                examples.length
                    ? `
                        <section class="content-section">

                            <h3>
                                💬 Beispiele
                            </h3>

                            <div class="example-list">

                                ${examples.map(
                                    item => `

                                        <div class="example-box">

                                            <span>
                                                ${escapeHTML(item)}
                                            </span>

                                            ${audioButton(
                                                item,
                                                "Beispiel anhören"
                                            )}

                                        </div>

                                    `
                                ).join("")}

                            </div>

                        </section>
                    `
                    : ""
            }


            ${
                topic.merke
                    ? `
                        <section class="merke-box">

                            <div class="merke-icon">
                                💡
                            </div>

                            <div>

                                <strong>
                                    Merke
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        topic.merke
                                    )}

                                    ${audioButton(
                                        topic.merke,
                                        "Merksatz anhören"
                                    )}
                                </p>

                            </div>

                        </section>
                    `
                    : ""
            }

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
