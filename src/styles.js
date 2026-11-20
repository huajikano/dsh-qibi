/**
 * 面板样式。
 *
 * 控件使用语义主题 token（--dsw-alias-*）；局部主题仅在 .qibi-theme-scope 内绑定。
 * 类名统一 `qibi-` 前缀，跟随宿主时不覆盖其令牌，也不改变 DSH 全局界面。
 */
export const STYLES = `
.qibi-theme-scope {
  position: relative; display: flex; flex-direction: column;
  width: 100%; height: 100%; min-width: 0; min-height: 0;
  color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); font-size: 13px;
}
.qibi-theme-scope > .qibi-root { flex: 1 1 auto; min-width: 0; }
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
  align-items: center; flex-wrap: wrap;
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
.qibi-btn.primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: var(--qibi-on-accent, #fff); }
.qibi-btn.primary:hover:not(:disabled) { background: var(--dsw-alias-brand-primary); border-color: transparent; filter: brightness(.96); }
.qibi-btn.small { height: 22px; padding: 0 8px; font-size: 11px; }
.qibi-body { display: flex; flex: 1 1 auto; min-height: 0; }
.qibi-side {
  width: 232px;
  flex: 0 0 232px;
  border-right: 1px solid var(--dsw-alias-border-l1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-layer-1));
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
.qibi-form-lock { display: block; min-width: 0; margin: 0; padding: 0; border: 0; }
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
.qibi-character-batch-range { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr)); gap: 10px; margin: 12px 0; }
.qibi-character-batch-range > .qibi-field { min-width: 0; }
.qibi-character-batch-range .qibi-select { width: 100%; max-width: 100%; box-sizing: border-box; }
.qibi-character-batch-reset { padding: 10px; margin: 10px 0; border: 1px solid var(--dsw-alias-state-warn-primary); border-radius: 7px; font-size: 12px; }
.qibi-character-batch-reset .qibi-btn { margin: 6px 6px 0 0; }
.qibi-character-ai-dialog {
  box-sizing: border-box; width: min(900px, 100%);
  max-height: calc(100dvh - var(--dsh-frame-top-clearance, 0px) - 48px);
  display: flex; flex-direction: column; overflow: hidden;
}
.qibi-character-ai-body { min-height: 0; overflow: auto; overscroll-behavior: contain; }
.qibi-character-ai-dialog > .qibi-dialog-head, .qibi-character-ai-footer { flex: 0 0 auto; }
.qibi-character-ai-footer { flex-wrap: wrap; }
.qibi-character-ai-candidate {
  min-width: 0; margin: 12px 0; padding: 12px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
}
.qibi-character-ai-fields .qibi-field { min-width: 0; }
.qibi-character-ai-fields :is(input, textarea) { width: 100%; box-sizing: border-box; }
.qibi-character-ai-selection { display: inline-flex; align-items: center; gap: 6px; }
.qibi-character-ai-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.qibi-character-ai-status { font-size: 12px; }
.qibi-character-ai-model-settings > .qibi-field > span { overflow-wrap: anywhere; }
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

/* ---- Outline and manuscript settings ---- */
.qibi-outline-workspace { display: flex; flex-direction: column; gap: 16px; min-width: 0; container: qibi-outline / inline-size; }
.qibi-outline-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 10px 16px; flex: 0 0 auto; }
.qibi-outline-header > div:first-child { flex: 1 1 240px; min-width: 0; }
.qibi-outline-heading { margin: 0; font-size: 16px; font-weight: 600; }
.qibi-outline-header p { line-height: 1.7; margin: 5px 0 0; }
.qibi-outline-columns { display: flex; flex-direction: column; gap: 16px; min-width: 0; min-height: 0; }
.qibi-outline-editor { box-sizing: border-box; padding: 16px; min-width: 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px; background: var(--dsw-alias-bg-base); }
.qibi-outline-editor h3, .qibi-outline-list h3 { font-size: 13px; margin: 0; overflow-wrap: anywhere; }
.qibi-outline-form { margin: 0; gap: 12px; }
.qibi-outline-fields { display: flex; flex-direction: column; gap: 12px; }
.qibi-outline-editor .qibi-input { width: 100%; box-sizing: border-box; }
.qibi-outline-textarea { min-height: 230px; resize: vertical; line-height: 1.8; }
.qibi-outline-form > .qibi-sub { line-height: 1.65; margin: 0; }
.qibi-outline-form-actions { padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
.qibi-outline-form-actions .qibi-outline-reload { margin-left: auto; }
.qibi-outline-reader { display: flex; flex-direction: column; gap: 10px; }
.qibi-outline-reader > p { margin: 0; }
.qibi-outline-reader-empty { text-align: left; padding: 22px 0; max-width: none; }
.qibi-outline-reader-empty h3 { font-size: 14px; margin-bottom: 6px; color: var(--dsw-alias-label-primary); }
.qibi-outline-list { min-width: 0; }
.qibi-outline-list-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.qibi-outline-count { margin-left: auto; }
.qibi-outline-filters { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto; align-items: end; gap: 8px; padding-bottom: 12px; }
.qibi-outline-filters .qibi-input { width: 100%; box-sizing: border-box; }
.qibi-outline-group { margin-top: 14px; }
.qibi-outline-group-heading { color: var(--dsw-alias-label-secondary); font-weight: 500; font-size: 12px; margin: 0 0 8px; overflow-wrap: anywhere; }
.qibi-outline-card { min-width: 0; padding: 12px; }
.qibi-outline-card-selected { border-color: var(--dsw-alias-brand-primary); }
.qibi-outline-card-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; }
.qibi-outline-card-heading > h4 { flex: 1 1 120px; min-width: 0; overflow-wrap: anywhere; }
.qibi-outline-card-heading .qibi-tag { max-width: 100%; height: auto; white-space: normal; overflow-wrap: anywhere; }
.qibi-outline-card .qibi-outline-preview { margin: 8px 0 10px; overflow-wrap: anywhere; }
.qibi-outline-delete { margin-left: auto; }
.qibi-outline-conflict, .qibi-outline-error { margin: 10px 0; padding: 10px; border-radius: 6px; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
.qibi-outline-conflict { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-state-warn-primary); }
.qibi-outline-error { color: var(--dsw-alias-state-error-primary); border: 1px solid var(--dsw-alias-state-error-primary); }
@container qibi-outline (min-width: 820px) {
  .qibi-outline-columns { display: grid; grid-template-columns: minmax(250px, .85fr) minmax(0, 1.15fr); flex: 1 1 0; overflow: hidden; }
  .qibi-outline-editor { grid-column: 2; grid-row: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; }
  .qibi-outline-list { grid-column: 1; grid-row: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; padding-right: 4px; }
}
@container qibi-outline (max-width: 480px) {
  .qibi-outline-filters { grid-template-columns: minmax(0, 1fr); }
  .qibi-outline-editor { padding: 12px; }
  .qibi-outline-form-actions .qibi-outline-reload { margin-left: 0; }
}

.qibi-novel-settings-dialog { box-sizing: border-box; width: min(720px, 100%); max-height: 100%; min-height: 0; overflow: hidden; container: qibi-novel-settings / inline-size; }
.qibi-novel-settings-dialog > .qibi-dialog-head, .qibi-novel-settings-dialog > .qibi-dialog-foot { flex: 0 0 auto; }
.qibi-novel-settings-dialog > .qibi-dialog-body { padding: 0 20px; flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.qibi-novel-settings-dialog > .qibi-dialog-foot { flex-wrap: wrap; gap: 8px; }
.qibi-settings-context { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; padding: 18px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.qibi-settings-context > div { flex: 1 1 220px; min-width: 0; }
.qibi-settings-context strong { display: block; font-size: 15px; overflow-wrap: anywhere; }
.qibi-settings-context p { margin: 5px 0 0; line-height: 1.7; }
.qibi-settings-bookmark { display: flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 38px; height: 44px; color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-1); border-radius: 7px; }
.qibi-settings-form { min-width: 0; margin: 0; }
.qibi-settings-section { display: flex; flex-direction: column; gap: 12px; padding: 18px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.qibi-settings-section-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.qibi-settings-section-head > h3 { font-size: 13px; margin: 0; flex: 1 1 auto; }
.qibi-settings-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-items: start; }
.qibi-novel-settings .qibi-input { width: 100%; box-sizing: border-box; }
.qibi-setting-hint { font-size: 11px; line-height: 1.6; }
.qibi-novel-intro { min-height: 150px; max-height: 40dvh; }
.qibi-settings-error { padding: 10px 12px; margin: 10px 0; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 6px; }
.qibi-settings-danger { padding: 14px 0 18px; }
.qibi-settings-danger > summary { width: fit-content; color: var(--dsw-alias-state-error-primary); cursor: pointer; font-size: 12px; padding: 5px 0; }
.qibi-settings-danger > summary:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: 3px; }
.qibi-settings-danger > p { margin: 8px 0 12px; line-height: 1.7; }
.qibi-settings-save-state { flex: 1 1 160px; }
@container qibi-novel-settings (max-width: 520px) {
  .qibi-settings-grid { grid-template-columns: minmax(0, 1fr); }
  .qibi-novel-settings-dialog > .qibi-dialog-body { padding: 0 14px; }
}

/* ---- Writer-friendly continuity and author guidance ---- */
.qibi-foreshadow-editor { min-width: 0; }
.qibi-foreshadow-list { display: flex; flex-direction: column; gap: 10px; min-width: 0; border: 0; margin: 0; padding: 0; }
.qibi-foreshadow-entry { margin: 0; }
.qibi-foreshadow-entry { min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); }
.qibi-foreshadow-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 10px; }
.qibi-foreshadow-fields > .qibi-field { min-width: 0; }
.qibi-foreshadow-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.qibi-foreshadow-advanced { margin-top: 12px; }
.qibi-foreshadow-advanced > summary { cursor: pointer; min-height: 28px; line-height: 28px; font-size: 13px; }
.qibi-foreshadow-raw { width: 100%; box-sizing: border-box; }
.qibi-foreshadow-json { width: 100%; box-sizing: border-box; font-family: ui-monospace, Consolas, monospace; }
.qibi-foreshadow-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.qibi-distill-guide { padding: 14px; margin-bottom: 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); }
.qibi-distill-guide > .qibi-sub { line-height: 1.65; }
.qibi-distill-steps { display: flex; flex-wrap: wrap; gap: 10px 16px; margin: 12px 0; padding: 0; list-style: none; }
.qibi-distill-steps > li { display: flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.qibi-distill-steps > li.current { color: var(--dsw-alias-label-primary); font-weight: 600; }
.qibi-distill-step-number { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; flex: 0 0 auto; border: 1px solid var(--dsw-alias-border-l2); border-radius: 50%; }
.qibi-distill-steps > li.current .qibi-distill-step-number { background: var(--dsw-alias-brand-primary); color: var(--qibi-on-accent, #fff); border-color: transparent; }
.qibi-distill-step-status { color: var(--dsw-alias-state-success-primary); font-size: 11px; }
.qibi-distill-guide-next { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.qibi-distill-guide-next > .qibi-sub { flex: 1 1 220px; line-height: 1.7; }
.qibi-distill-instruction .qibi-textarea { width: 100%; box-sizing: border-box; }

/* ---- Readable density, confined to QiBi ---- */
.qibi-theme-scope[data-qibi-density="comfortable"] { font-size: 14px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-root { font-size: 14px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-btn { min-height: 34px; height: auto; padding: 6px 12px; font-size: 13px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-btn.small { min-height: 30px; padding: 5px 9px; font-size: 12px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-sub,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-label,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-card p { font-size: 13px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-chip { min-height: 28px; height: auto; font-size: 12px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-novel,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-chapter { min-height: 36px; padding: 8px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-novel-meta,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-chapter-words,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-author-meta { font-size: 12px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-input,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-select { min-height: 34px; height: auto; font-size: 14px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-textarea { font-size: 14px; line-height: 1.65; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-tabs { min-height: 44px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-tab { min-height: 36px; padding: 6px 12px; font-size: 13px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-menu button,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-context button { min-height: 32px; font-size: 13px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-side-head,
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-side-subhead { flex-wrap: wrap; font-size: 12px; }
.qibi-theme-scope[data-qibi-density="comfortable"] .qibi-main-head { flex-wrap: wrap; }

/* ---- Local appearance settings ---- */
.qibi-theme-trigger { flex: 0 0 auto; }
.qibi-theme-dialog {
  box-sizing: border-box; width: min(780px, 100%); max-height: min(720px, 100%);
  min-width: 0; min-height: 0; overflow: hidden; container: qibi-appearance / inline-size;
}
.qibi-theme-dialog > .qibi-dialog-head, .qibi-theme-dialog > .qibi-dialog-foot { flex: 0 0 auto; }
.qibi-theme-content { display: grid; grid-template-columns: 184px minmax(0, 1fr); gap: 20px; padding: 16px; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.qibi-theme-options, .qibi-theme-mode-options { min-width: 0; margin: 0; padding: 0; border: 0; }
.qibi-theme-options > legend, .qibi-theme-mode-options > legend { padding: 0; margin-bottom: 10px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.qibi-theme-option {
  display: flex; align-items: center; gap: 8px; box-sizing: border-box;
  min-height: 57px; margin-bottom: 6px; padding: 8px 10px; border-radius: 8px;
  border: 1px solid transparent; cursor: pointer; background: transparent;
}
.qibi-theme-option:hover { background: var(--dsw-alias-bg-layer-1); }
.qibi-theme-option.selected { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-theme-option input, .qibi-theme-mode input { accent-color: var(--dsw-alias-brand-primary); flex: 0 0 auto; margin: 0; }
.qibi-theme-option-content { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.qibi-theme-option-name { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.qibi-theme-default { color: var(--dsw-alias-label-secondary); font-size: 11px; }
.qibi-theme-swatches { display: inline-flex; gap: 3px; }
.qibi-theme-swatches > span { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l1); }
.qibi-theme-host-mark { color: var(--dsw-alias-label-secondary); font-size: 10px; letter-spacing: .08em; }
.qibi-theme-details { min-width: 0; }
.qibi-theme-details > h3 { margin: 0 0 6px; font-size: 16px; }
.qibi-theme-details > p { line-height: 1.7; margin: 0 0 16px; }
.qibi-theme-mode-options { display: flex; flex-wrap: wrap; gap: 6px; margin: 18px 0; }
.qibi-theme-mode { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; box-sizing: border-box; padding: 5px 9px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; cursor: pointer; }
.qibi-theme-mode.selected { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.qibi-theme-mode-options[disabled] { opacity: .55; }
.qibi-theme-mode-options[disabled] .qibi-theme-mode { cursor: default; }
.qibi-theme-specimens { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
.qibi-theme-specimen { min-width: 0; overflow: hidden; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); }
.qibi-theme-specimen-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px; padding: 9px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-specific-sidebar-fill); font-size: 11px; }
.qibi-theme-specimen-state { color: var(--dsw-alias-label-secondary); }
.qibi-theme-specimen-prose { padding: 16px 12px; line-height: 1.8; }
.qibi-theme-specimen-prose > strong { font-size: 13px; }
.qibi-theme-specimen-prose > p { font-size: 12px; margin: 6px 0 0; }
.qibi-theme-specimen-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; padding: 0 10px 10px; font-size: 11px; }
.qibi-theme-specimen-tag { padding: 3px 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
.qibi-theme-specimen-primary { padding: 4px 8px; border-radius: 5px; background: var(--dsw-alias-brand-primary); color: var(--qibi-on-accent); }
.qibi-theme-save-error { color: var(--dsw-alias-state-error-primary); }
.qibi-theme-option:focus-within, .qibi-theme-mode:focus-within { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
@container qibi-appearance (max-width: 560px) {
  .qibi-theme-content { grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .qibi-theme-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 6px; }
}
@container qibi-appearance (max-width: 320px) {
  .qibi-theme-content { padding: 12px; }
  .qibi-theme-specimens { grid-template-columns: minmax(0, 1fr); }
  .qibi-theme-options { grid-template-columns: minmax(0, 1fr); }
}

/* ---- 专注模式（Alt+F） ---- */
.qibi-root.zen .qibi-side, .qibi-root.zen .qibi-tabs { display: none; }
.qibi-root.zen .qibi-editor { max-width: 40em; font-size: 17px; line-height: 2; }
.qibi-root.zen .qibi-main-head { border-bottom-color: transparent; }
`
