/**
 * 面板样式。
 *
 * 只用宿主的主题 token（--dsw-alias-*）与布局变量，因此浅色/深色自动跟随；
 * 类名统一 `qibi-` 前缀，避免与宿主样式互相污染。
 */
export const STYLES = `
.qibi-root {
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-top: var(--dsh-frame-top-clearance, 0px);
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  font-size: 13px;
}
.qibi-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  flex: 0 0 auto;
}
.qibi-title { font-weight: 600; font-size: 13px; }
.qibi-sub { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.qibi-spacer { flex: 1 1 auto; }
.qibi-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-1);
  font-size: 11px;
  white-space: nowrap;
}
.qibi-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }
.qibi-chip-dot.on { background: var(--dsw-alias-state-success-primary); }
.qibi-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  cursor: pointer;
}
.qibi-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-btn:disabled { opacity: .45; cursor: default; }
.qibi-btn.primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
.qibi-btn.small { height: 22px; padding: 0 8px; font-size: 11px; }
.qibi-body { display: flex; flex: 1 1 auto; min-height: 0; }
.qibi-side {
  width: 232px;
  flex: 0 0 232px;
  border-right: 1px solid var(--dsw-alias-border-l1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-side-head {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  font-size: 11px; letter-spacing: .04em; text-transform: uppercase;
  color: var(--dsw-alias-label-secondary);
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.qibi-list { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 6px; }
.qibi-novel {
  display: block; width: 100%; text-align: left;
  padding: 7px 8px; border-radius: 6px; border: 0;
  background: transparent; color: inherit; cursor: pointer; font: inherit;
}
.qibi-novel:hover { background: var(--dsw-alias-bg-layer-2); }
.qibi-novel.active { background: var(--dsw-alias-bg-layer-2); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2); }
.qibi-novel-name { display: block; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qibi-novel-meta { display: block; color: var(--dsw-alias-label-secondary); font-size: 11px; margin-top: 2px; }
.qibi-chapters { margin: 2px 0 8px 0; border-left: 1px solid var(--dsw-alias-border-l1); padding-left: 4px; }
.qibi-chapter {
  display: flex; align-items: center; gap: 6px;
  width: 100%; text-align: left; border: 0; border-radius: 6px;
  padding: 5px 8px; background: transparent; color: inherit; cursor: pointer; font: inherit;
}
.qibi-chapter:hover { background: var(--dsw-alias-bg-layer-2); }
.qibi-chapter.active { background: var(--dsw-alias-bg-layer-2); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2); }
.qibi-chapter-name { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qibi-chapter-words { color: var(--dsw-alias-label-secondary); font-size: 11px; flex: 0 0 auto; }
.qibi-dot { width: 5px; height: 5px; border-radius: 50%; flex: 0 0 auto; background: var(--dsw-alias-state-idle-primary); }
.qibi-dot.published { background: var(--dsw-alias-state-success-primary); }
.qibi-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.qibi-main-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  flex: 0 0 auto;
  padding: 10px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.qibi-chapter-title { font-weight: 600; font-size: 14px; }
.qibi-editor-wrap { flex: 1 1 auto; min-height: 0; display: flex; padding: 0; }
.qibi-editor {
  flex: 1 1 auto; min-height: 0; width: 100%; resize: none;
  border: 0; outline: 0; padding: 16px 20px 40px 20px;
  background: transparent; color: var(--dsw-alias-label-primary);
  font-family: var(--dsh-font-family-serif, "Noto Serif SC", "Songti SC", serif);
  font-size: 15px; line-height: 1.85; letter-spacing: .01em;
}
.qibi-editor:disabled { color: var(--dsw-alias-label-secondary); }
.qibi-pane { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 16px 20px 40px 20px; }
.qibi-card {
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-card h4 { margin: 0 0 4px 0; font-size: 13px; }
.qibi-card p { margin: 0; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; font-size: 12px; line-height: 1.7; }
.qibi-tabs {
  box-sizing: border-box;
  display: flex; flex: 0 0 auto; min-height: 35px; gap: 2px;
  padding: 6px 16px 0; border-bottom: 1px solid var(--dsw-alias-border-l1);
  overflow-x: auto; overflow-y: hidden; white-space: nowrap;
}
.qibi-tab {
  box-sizing: border-box; flex: 0 0 auto; min-height: 28px;
  height: 28px; padding: 0 10px; border: 0; border-bottom: 2px solid transparent;
  background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit;
}
.qibi-tab.active { color: var(--dsw-alias-label-primary); border-bottom-color: var(--dsw-alias-brand-primary); }
.qibi-empty {
  margin: auto; max-width: 420px; padding: 24px; text-align: center;
  color: var(--dsw-alias-label-secondary); line-height: 1.8;
}
.qibi-empty strong { display: block; color: var(--dsw-alias-label-primary); font-size: 14px; margin-bottom: 6px; }
.qibi-code {
  display: block; margin-top: 8px; padding: 6px 8px; border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px;
  word-break: break-all;
}
.qibi-setup-root { overflow: auto; }
.qibi-setup-root > .qibi-card {
  box-sizing: border-box; flex: 0 0 auto;
  width: min(560px, calc(100% - 32px)); margin: 0 auto 16px;
}
.qibi-data-settings { min-width: 0; }
.qibi-data-settings-current { display: flex; flex-direction: column; gap: 6px; }
.qibi-data-settings-current > span { overflow-wrap: anywhere; }
.qibi-banner {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin: 8px 16px 0 16px; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-state-warn-primary);
  background: var(--dsw-alias-bg-layer-1); font-size: 12px;
}
.qibi-banner.error { border-color: var(--dsw-alias-state-error-primary); }
.qibi-newrow { display: flex; gap: 6px; padding: 6px 10px; border-top: 1px solid var(--dsw-alias-border-l1); }
.qibi-input {
  flex: 1 1 auto; min-width: 0; height: 24px; padding: 0 8px; border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px;
}
.qibi-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 16px; border-top: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); font-size: 11px; flex: 0 0 auto;
}
.qibi-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.qibi-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.qibi-section-title { display: block; font-weight: 600; font-size: 12px; margin: 16px 0 8px 0; }
.qibi-pane > .qibi-section-title:first-child { margin-top: 0; }
.qibi-form-title { margin: 10px 0 0 0; font-size: 12px; }
.qibi-form { display: flex; flex-direction: column; gap: 10px; margin: 10px 0 14px 0; }
.qibi-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 0 0 auto; }
.qibi-row > .qibi-field { flex: 1 1 160px; }
.qibi-field > .qibi-input, .qibi-field > .qibi-select { flex: 0 0 auto; }
.qibi-label { color: var(--dsw-alias-label-secondary); font-size: 11px; }
.qibi-select, .qibi-textarea {
  width: 100%; box-sizing: border-box; padding: 5px 8px; border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px;
}
.qibi-select { height: 26px; padding: 0 8px; }
.qibi-textarea { resize: vertical; min-height: 48px; line-height: 1.65; }
.qibi-textarea.mono, .qibi-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.qibi-textarea.preview { flex: 1 1 auto; min-height: 240px; white-space: pre-wrap; }
.qibi-btn.danger { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); }
.qibi-tag {
  display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
  border-radius: 999px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap;
}
.qibi-check { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.qibi-side-subhead {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px 2px 10px;
  color: var(--dsw-alias-label-secondary); font-size: 11px;
}
.qibi-result {
  display: flex; flex-direction: column; gap: 2px; width: 100%;
  margin-bottom: 8px; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.qibi-result:hover { background: var(--dsw-alias-bg-layer-2); }
.qibi-snippet {
  color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6;
  white-space: pre-wrap; max-height: 4.8em; overflow: hidden;
}
/* The selected pane gets the remaining height; its inner .qibi-pane owns scrolling. */
.qibi-tabpane { flex: 1 1 0; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
.qibi-overlay {
  position: absolute; top: var(--dsh-frame-top-clearance, 0px); left: 0; right: 0; bottom: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: rgba(0, 0, 0, .45);
}
.qibi-dialog {
  width: min(560px, 100%); max-height: min(82vh, 760px);
  display: flex; flex-direction: column;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-base);
  box-shadow: 0 18px 48px rgba(0, 0, 0, .28);
}
.qibi-dialog-head {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.qibi-dialog-body { padding: 14px; overflow: auto; min-height: 0; }
.qibi-dialog-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-top: 1px solid var(--dsw-alias-border-l1);
}
.qibi-distill { display: flex; flex: 1 1 auto; min-height: 0; }
.qibi-distill-list {
  width: 200px; flex: 0 0 200px; min-height: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-distill-list .qibi-list { flex: 1 1 auto; overflow: auto; padding: 6px; }
.qibi-author-btn {
  display: block; width: 100%; text-align: left;
  padding: 7px 8px; border-radius: 6px; border: 0;
  background: transparent; color: inherit; cursor: pointer; font: inherit;
}
.qibi-author-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.qibi-author-btn.active { background: var(--dsw-alias-bg-layer-2); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2); }
.qibi-author-name { display: block; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qibi-author-meta { display: block; margin-top: 2px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.qibi-distill-main { flex: 1 1 auto; min-width: 0; overflow: auto; padding: 14px 16px 40px 16px; }
.qibi-distill-title { margin: 0; font-size: 15px; }
.qibi-binding {
  margin: 8px 0 12px; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
}
.qibi-progress {
  position: relative; height: 22px; margin: 8px 0; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
}
.qibi-progress-bar {
  position: absolute; top: 0; bottom: 0; left: 0;
  background: var(--dsw-alias-brand-primary); opacity: .35; transition: width .2s;
}
.qibi-progress span {
  position: relative; z-index: 1; display: flex; align-items: center;
  height: 100%; padding: 0 8px; font-size: 11px; color: var(--dsw-alias-label-primary);
}
.qibi-pre {
  margin: 8px 0 0; padding: 10px; max-height: 320px; overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;
}
.qibi-error-text { margin: 6px 0 0; color: var(--dsw-alias-state-error-primary); font-size: 12px; white-space: pre-wrap; }
.qibi-tag.danger { color: var(--dsw-alias-state-error-primary); }
.qibi-find {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 6px 12px; flex: 0 0 auto;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-find .qibi-input { flex: 0 1 160px; height: 24px; }
.qibi-find-count { min-width: 40px; text-align: center; }
.qibi-context {
  position: fixed; z-index: 1100; min-width: 150px;
  padding: 6px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .28);
  font-size: 12px;
}
.qibi-context-label {
  padding: 2px 6px 6px; margin-bottom: 4px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary); font-size: 11px;
  max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.qibi-context button {
  display: block; width: 100%; text-align: left;
  padding: 6px 8px; border: 0; border-radius: 5px;
  background: transparent; color: var(--dsw-alias-label-primary);
  font: inherit; cursor: pointer;
}
.qibi-context button:hover { background: var(--dsw-alias-bg-layer-2); }
.qibi-context-sep { height: 1px; margin: 4px 0; background: var(--dsw-alias-border-l1); }
.qibi-ai-overlay {
  position: absolute; inset: 0; z-index: 1040;
  background: rgba(0, 0, 0, .18);
}
.qibi-ai-drawer {
  position: absolute; top: var(--dsh-frame-top-clearance, 0px); right: 0; bottom: 0; z-index: 1050;
  width: min(440px, 100%); display: flex; flex-direction: column; gap: 10px;
  padding: 0 16px 18px; overflow: auto;
  border-left: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base);
  box-shadow: -12px 0 32px rgba(0, 0, 0, .22);
}
.qibi-ai-head {
  position: sticky; top: 0; z-index: 1;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 0 8px; margin: 0;
  background: var(--dsw-alias-bg-base);
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.qibi-ai-close { min-width: 44px; }
.qibi-ai-model-settings { align-items: flex-start; flex: 0 0 auto; }
.qibi-ai-model { display: block; min-width: 0; overflow-wrap: anywhere; line-height: 1.6; }
.qibi-ai-selection {
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-ai-selected { margin-top: 4px; font-size: 12px; line-height: 1.7; color: var(--dsw-alias-label-primary); }
.qibi-ai-modes { display: flex; flex-direction: column; gap: 8px; }
.qibi-ai-mode-group { display: flex; flex-direction: column; gap: 4px; }
.qibi-ai-preview { flex: 1 1 auto; min-height: 160px; display: flex; flex-direction: column; }
.qibi-ai-preview .qibi-pre { max-height: none; flex: 1 1 auto; }
.qibi-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.qibi-presets .qibi-chip { cursor: pointer; }
.qibi-presets .qibi-chip:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-ai-note {
  padding: 8px 10px; border-radius: 8px; font-size: 12px; line-height: 1.65;
  border: 1px solid var(--dsw-alias-state-warn-primary);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
}
.qibi-drafts {
  display: flex; flex-direction: column; gap: 4px;
  padding-top: 8px; border-top: 1px solid var(--dsw-alias-border-l1);
}
.qibi-draft { display: flex; align-items: center; gap: 4px; }
.qibi-draft-main {
  flex: 1 1 auto; min-width: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 5px 8px; border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit;
  text-align: left; cursor: pointer;
}
.qibi-draft-main:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-draft-main > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---- 可读性与键盘焦点 ---- */
.qibi-editor { max-width: 46em; margin: 0 auto; }
.qibi-editor[readonly] { color: var(--dsw-alias-label-secondary); cursor: default; }
.qibi-btn:focus-visible, .qibi-tab:focus-visible, .qibi-input:focus-visible,
.qibi-select:focus-visible, .qibi-textarea:focus-visible, .qibi-chip:focus-visible,
.qibi-novel:focus-visible, .qibi-chapter:focus-visible, .qibi-context button:focus-visible,
.qibi-menu button:focus-visible, .qibi-author-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
.qibi-editor:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }

/* ---- 侧栏：作品 / 章节两段独立滚动 ---- */
.qibi-side-block { display: flex; flex-direction: column; min-height: 0; }
.qibi-side-block.novels { flex: 0 1 auto; max-height: 40%; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.qibi-side-block.chapters { flex: 1 1 auto; }
.qibi-side-block .qibi-list { flex: 1 1 auto; }
.qibi-side-search { padding: 6px 8px 2px; }
.qibi-side-search .qibi-input { width: 100%; box-sizing: border-box; height: 24px; }
.qibi-side-note { padding: 2px 10px 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; }

/* ---- 章节头「⋯」菜单 ---- */
.qibi-menu-wrap { position: relative; display: inline-flex; }
.qibi-menu {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 900; min-width: 136px;
  padding: 4px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); box-shadow: 0 10px 28px rgba(0, 0, 0, .24);
}
.qibi-menu button {
  display: block; width: 100%; text-align: left; padding: 6px 8px;
  border: 0; border-radius: 5px; background: transparent;
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer;
}
.qibi-menu button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.qibi-menu button:disabled { opacity: .45; cursor: default; }
.qibi-menu button.danger { color: var(--dsw-alias-state-error-primary); }
.qibi-menu-sep { height: 1px; margin: 4px 0; background: var(--dsw-alias-border-l1); }

/* ---- 通知浮层：不挤压正文 ---- */
.qibi-notice {
  position: absolute; top: 46px; right: 16px; z-index: 1060;
  max-width: min(420px, calc(100% - 32px));
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base);
  box-shadow: 0 10px 28px rgba(0, 0, 0, .24);
  font-size: 12px;
}
.qibi-notice.error { border-color: var(--dsw-alias-state-error-primary); }
.qibi-notice > span:first-child { flex: 1 1 auto; }
.qibi-notice .qibi-btn { flex: 0 0 auto; }

/* ---- 写入开关：明确的按钮态 ---- */
.qibi-chip[aria-pressed] { cursor: pointer; }
.qibi-chip[aria-pressed]:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-chip[aria-pressed="false"] { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }

/* ---- 本章出场人物 ---- */
.qibi-cast {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 6px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-cast .qibi-chip { cursor: pointer; }
.qibi-cast .qibi-chip:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }

/* ---- 本章细纲锚点 ---- */
.qibi-anchors {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 6px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.qibi-anchor { display: inline-flex; align-items: center; gap: 2px; }
.qibi-anchors .qibi-chip { cursor: pointer; }
.qibi-anchors .qibi-chip:hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-anchors .qibi-chip.done { color: var(--dsw-alias-state-success-primary); }
.qibi-anchor-edit {
  height: 22px; padding: 0 4px; border: 0; border-radius: 5px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 11px; cursor: pointer;
}
.qibi-anchor-edit:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.qibi-anchor-form { display: inline-flex; align-items: center; gap: 4px; }
.qibi-anchor-form .qibi-input { flex: 0 1 140px; height: 22px; }

/* ---- 页签与只读提示 ---- */
.qibi-tab.active { font-weight: 600; }
.qibi-readonly-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 16px; font-size: 12px; color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-1);
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}

/* ---- 专注模式（Alt+F） ---- */
.qibi-root.zen .qibi-side, .qibi-root.zen .qibi-tabs { display: none; }
.qibi-root.zen .qibi-editor { max-width: 40em; font-size: 17px; line-height: 2; }
.qibi-root.zen .qibi-main-head { border-bottom-color: transparent; }
`
