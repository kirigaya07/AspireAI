/**
 * LaTeX-inspired resume HTML/CSS templates.
 * These produce professional PDF output when used with html2pdf.js.
 */

export const TEMPLATES = {
  CLASSIC: {
    id: "CLASSIC",
    name: "Classic",
    description: "Traditional academic CV — clean, ATS-friendly, trusted",
    preview: "classic",
  },
  MODERN: {
    id: "MODERN",
    name: "Modern",
    description: "Contemporary design with accent colors — stands out",
    preview: "modern",
  },
  MINIMAL: {
    id: "MINIMAL",
    name: "Minimal",
    description: "Ultra-clean whitespace-driven — timeless and elegant",
    preview: "minimal",
  },
};

/**
 * Generates the full HTML for a LaTeX-style resume PDF.
 * @param {string} markdownContent - The raw resume markdown
 * @param {string} template - Template ID
 * @param {Object} userInfo - name, email, phone, location
 */
export function generateResumeHTML(markdownContent, template = "CLASSIC", userInfo = {}) {
  const baseStyles = getBaseStyles(template);
  const body = markdownToResumeHTML(markdownContent);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${baseStyles}
</style>
</head>
<body>
<div class="resume-root">
${body}
</div>
</body>
</html>`;
}

function getBaseStyles(template) {
  const base = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    @page { margin: 0; }
  `;

  const templates = {
    CLASSIC: `
      ${base}
      .resume-root {
        font-family: 'EB Garamond', 'Georgia', 'Times New Roman', serif;
        font-size: 10.5pt;
        line-height: 1.5;
        color: #1a1a1a;
        padding: 28px 44px;
        max-width: 750px;
        margin: 0 auto;
      }
      h1 {
        font-size: 22pt;
        font-weight: 700;
        text-align: center;
        letter-spacing: -0.5px;
        margin-bottom: 3px;
        color: #111;
      }
      .contact-line {
        text-align: center;
        font-size: 9pt;
        color: #555;
        margin-bottom: 12px;
      }
      .contact-line a { color: #555; text-decoration: none; }
      hr.section-rule {
        border: none;
        border-top: 1.5px solid #1a1a1a;
        margin: 8px 0 6px;
      }
      h2 {
        font-size: 11pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin: 12px 0 4px;
        color: #1a1a1a;
      }
      .entry { margin-bottom: 8px; }
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
      .entry-title { font-weight: 700; font-size: 10.5pt; }
      .entry-date { font-size: 9.5pt; color: #555; white-space: nowrap; }
      .entry-subtitle { font-style: italic; color: #444; font-size: 10pt; }
      ul { padding-left: 16px; margin-top: 4px; }
      li { margin-bottom: 2px; font-size: 10pt; }
      p { margin-bottom: 5px; font-size: 10pt; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 10pt; }
    `,
    MODERN: `
      ${base}
      .resume-root {
        font-family: 'Inter', 'Helvetica Neue', 'Arial', sans-serif;
        font-size: 9.5pt;
        line-height: 1.55;
        color: #1e1e2e;
        padding: 0;
        max-width: 750px;
        margin: 0 auto;
      }
      .header-bar {
        background: linear-gradient(135deg, #4338ca, #7c3aed);
        color: white;
        padding: 24px 36px;
        margin-bottom: 0;
      }
      .header-bar h1 {
        font-size: 22pt;
        font-weight: 700;
        letter-spacing: -0.5px;
        color: white;
        margin-bottom: 4px;
      }
      .header-bar .contact-line {
        font-size: 8.5pt;
        color: rgba(255,255,255,0.8);
      }
      .content-area { padding: 20px 36px; }
      h2 {
        font-size: 9.5pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #4338ca;
        border-bottom: 1.5px solid #e0e7ff;
        padding-bottom: 3px;
        margin: 14px 0 7px;
      }
      .entry { margin-bottom: 10px; }
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
      .entry-title { font-weight: 600; font-size: 10pt; }
      .entry-date { font-size: 8.5pt; color: #6b7280; background: #f3f4f6; padding: 1px 6px; border-radius: 4px; }
      .entry-subtitle { color: #6b7280; font-size: 9pt; }
      ul { padding-left: 14px; margin-top: 4px; }
      li { margin-bottom: 2px; font-size: 9.5pt; }
      p { margin-bottom: 5px; font-size: 9.5pt; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 4px; }
      .skill-tag { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 12px; font-size: 8.5pt; font-weight: 500; }
    `,
    MINIMAL: `
      ${base}
      .resume-root {
        font-family: 'Helvetica Neue', 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.6;
        color: #1f2937;
        padding: 36px 52px;
        max-width: 750px;
        margin: 0 auto;
      }
      h1 {
        font-size: 26pt;
        font-weight: 300;
        letter-spacing: -1px;
        color: #111827;
        margin-bottom: 2px;
      }
      .contact-line { font-size: 9pt; color: #9ca3af; margin-bottom: 24px; }
      h2 {
        font-size: 8pt;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #9ca3af;
        margin: 20px 0 8px;
      }
      hr.section-rule { display: none; }
      .entry { margin-bottom: 10px; }
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
      .entry-title { font-weight: 500; font-size: 10.5pt; }
      .entry-date { font-size: 9pt; color: #9ca3af; }
      .entry-subtitle { color: #6b7280; font-size: 9.5pt; margin-top: 1px; }
      ul { padding-left: 14px; margin-top: 5px; list-style: none; }
      li { margin-bottom: 3px; font-size: 9.5pt; position: relative; padding-left: 10px; }
      li::before { content: "—"; position: absolute; left: 0; color: #d1d5db; }
      p { margin-bottom: 5px; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 9.5pt; color: #374151; }
    `,
  };

  return templates[template] || templates.CLASSIC;
}

/**
 * Simple markdown → styled HTML converter for resumes.
 * Handles: # headers, ## sections, **bold**, *italic*, bullet lists, pipe tables.
 */
function markdownToResumeHTML(markdown) {
  if (!markdown) return "";

  const lines = markdown.split("\n");
  const htmlParts = [];
  let inList = false;
  let inSection = false;
  let firstH1 = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      continue;
    }

    // H1 — name
    if (trimmed.startsWith("# ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      const name = trimmed.slice(2).trim();
      if (firstH1) {
        htmlParts.push(`<h1>${escapeHtml(name)}</h1>`);
        firstH1 = false;
      }
      continue;
    }

    // Contact line (lines with | or email/phone patterns right after H1)
    if (trimmed.includes("|") && !trimmed.startsWith("-") && !trimmed.startsWith("|")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      const parts = trimmed.split("|").map(p => p.trim()).filter(Boolean);
      htmlParts.push(`<div class="contact-line">${parts.join(" &nbsp;|&nbsp; ")}</div>`);
      continue;
    }

    // H2 — section header
    if (trimmed.startsWith("## ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      const title = trimmed.slice(3).trim();
      htmlParts.push(`<h2>${escapeHtml(title)}</h2><hr class="section-rule" />`);
      inSection = true;
      continue;
    }

    // ### — entry title
    if (trimmed.startsWith("### ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      const text = trimmed.slice(4).trim();
      // Check next line for dates/subtitle
      const nextLine = lines[i + 1]?.trim() || "";
      if (nextLine.startsWith("**") || nextLine.match(/^\d{4}|present/i)) {
        htmlParts.push(`<div class="entry"><div class="entry-header"><span class="entry-title">${inlineFormat(text)}</span><span class="entry-date">${inlineFormat(nextLine)}</span></div>`);
        i++; // skip the next line
      } else {
        htmlParts.push(`<div class="entry"><div class="entry-header"><span class="entry-title">${inlineFormat(text)}</span></div>`);
      }
      // Check for subtitle line
      const subtitleLine = lines[i + 1]?.trim() || "";
      if (subtitleLine && !subtitleLine.startsWith("-") && !subtitleLine.startsWith("#")) {
        htmlParts.push(`<div class="entry-subtitle">${inlineFormat(subtitleLine)}</div>`);
        i++;
      }
      continue;
    }

    // Bullet list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) { htmlParts.push("<ul>"); inList = true; }
      const text = trimmed.slice(2).trim();
      htmlParts.push(`<li>${inlineFormat(text)}</li>`);
      continue;
    }

    // Regular paragraph
    if (inList) { htmlParts.push("</ul>"); inList = false; }
    htmlParts.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  if (inList) htmlParts.push("</ul>");

  return htmlParts.join("\n");
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
