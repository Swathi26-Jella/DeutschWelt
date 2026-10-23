
"use strict";

const SUPABASE_URL = "https://llxcyabptsbdtsdhkzkc.supabase.co";
const SUPABASE_KEY = "sb_publishable_MKh0z87kMiDAQX3jnaoADQ_-D0_XXd4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let speakingTopics = [];
let selectedTopicId = null;

const $ = id => document.getElementById(id);

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showStatus(message, isError = false) {
    $("speakingStatus").textContent = message;
    $("speakingStatus").classList.toggle("speaking-error", isError);
}

function renderNavigation() {
    const search = $("speakingSearch").value.trim().toLowerCase();
    const category = $("speakingCategory").value;

    const filtered = speakingTopics.filter(topic => {
        const text = [
            topic.title,
            topic.summary,
            topic.category,
            topic.explanation,
            topic.explanation_en
        ].join(" ").toLowerCase();

        return text.includes(search) &&
            (!category || topic.category === category);
    });

    const navigation = $("speakingNavigation");
    navigation.replaceChildren();

    if (!filtered.length) {
        navigation.textContent = "Keine passenden Themen gefunden.";
        $("speakingContent").innerHTML =
            "<p>Bitte ändere deine Suche oder wähle eine andere Kategorie.</p>";
        return;
    }

    filtered.forEach(topic => {
        const button = document.createElement("button");
        button.type = "button";
        button.className =
            String(topic.id) === String(selectedTopicId) ? "active" : "";

        button.textContent = `${topic.icon || "🗣️"} ${topic.title}`;
        button.addEventListener("click", () => {
            selectedTopicId = topic.id;
            renderNavigation();
            renderTopic(topic);
        });

        navigation.appendChild(button);
    });

    const selectedStillVisible = filtered.some(
        topic => String(topic.id) === String(selectedTopicId)
    );

    if (!selectedStillVisible) {
        selectedTopicId = filtered[0].id;
        renderNavigation();
        renderTopic(filtered[0]);
    }
}

function renderTopic(topic) {
    const content = $("speakingContent");
    content.replaceChildren();

    function addElement(tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = text;

        if (className) element.className = className;

        content.appendChild(element);
        return element;
    }

    addElement("p", `${topic.icon || "🗣️"} B2 · ${topic.category || "Sprechen"}`);
    addElement("h2", topic.title);

    if (topic.summary) {
        addElement("p", topic.summary);
    }

    addElement("h3", "Erklärung auf Deutsch", "speaking-section");
    addElement("p", topic.explanation || "Keine deutsche Erklärung vorhanden.");

    addElement("h3", "Explanation in English", "speaking-section");
    addElement("p", topic.explanation_en || "No English explanation available.");

    addElement("h3", "Redemittel – Useful phrases", "speaking-section");

    const phraseGroups = Array.isArray(topic.speaking_phrases)
        ? topic.speaking_phrases
        : [];

    if (!phraseGroups.length) {
        addElement("p", "Noch keine Redemittel vorhanden.");
    }

    phraseGroups.forEach(group => {
        addElement("h4", group.category || "Redemittel", "phrase-group");

        (Array.isArray(group.phrases) ? group.phrases : []).forEach(phrase => {
            const wrapper = document.createElement("div");
            wrapper.className = "phrase-item";

            const german = document.createElement("div");
            german.className = "phrase-de";
            german.textContent = phrase.de || "";

            const english = document.createElement("div");
            english.className = "phrase-en";
            english.textContent = phrase.en || "";

            wrapper.append(german, english);
            content.appendChild(wrapper);
        });
    });

    addElement("h3", "Beispieldialog", "speaking-section");

    const dialogue = Array.isArray(topic.dialogue) ? topic.dialogue : [];

    if (!dialogue.length) {
        addElement("p", "Noch kein Dialog vorhanden.");
    }

    dialogue.forEach(line => {
        const wrapper = document.createElement("div");
        wrapper.className = "dialogue-line";

        if (line.speaker) {
            const speaker = document.createElement("span");
            speaker.className = "dialogue-speaker";
            speaker.textContent = `${line.speaker}: `;
            wrapper.appendChild(speaker);
        }

        wrapper.appendChild(
            document.createTextNode(line.text || "")
        );

        content.appendChild(wrapper);
    });

    addElement("h3", "Grammatik und Satzmuster", "speaking-section");

    const grammarNotes = Array.isArray(topic.grammar_notes)
        ? topic.grammar_notes
        : [];

    if (grammarNotes.length) {
        const list = document.createElement("ul");

        grammarNotes.forEach(note => {
            const item = document.createElement("li");
            item.textContent = note;
            list.appendChild(item);
        });

        content.appendChild(list);
    } else {
        addElement("p", "Noch keine Grammatiknotizen vorhanden.");
    }

    addElement("h3", "Merke", "speaking-section");

    const merke = document.createElement("p");
    merke.className = "speaking-merke";
    merke.textContent = topic.merke || "Wiederhole die Redemittel regelmäßig.";
    content.appendChild(merke);
}

async function loadSpeakingTopics() {
    showStatus("B2-Sprechen-Themen werden geladen …");

    const { data, error } = await supabaseClient
        .from("topics")
        .select("*")
        .eq("level", "B2")
        .eq("content_type", "sprechen")
        .eq("published", true)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Supabase error:", error);
        showStatus(
            "Die Themen konnten nicht geladen werden. Bitte prüfe die Supabase-Berechtigungen und die Datenbankfelder.",
            true
        );
        return;
    }

    speakingTopics = data || [];

    const categories = [...new Set(
        speakingTopics
            .map(topic => topic.category)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const categorySelect = $("speakingCategory");
    categorySelect.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Alle Kategorien";
    categorySelect.appendChild(allOption);

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    if (!speakingTopics.length) {
        $("speakingNavigation").textContent =
            "Noch keine B2-Sprechen-Themen vorhanden.";

        $("speakingContent").textContent =
            "Melde dich im Adminbereich an und füge dein erstes Sprechen-Thema hinzu.";

        showStatus("Noch keine veröffentlichten B2-Sprechen-Themen vorhanden.");
        return;
    }

    selectedTopicId = speakingTopics[0].id;
    showStatus(`${speakingTopics.length} Sprechen-Themen geladen.`);
    renderNavigation();
}

document.addEventListener("DOMContentLoaded", () => {
    $("speakingSearch").addEventListener("input", renderNavigation);
    $("speakingCategory").addEventListener("change", renderNavigation);

    loadSpeakingTopics();
});
