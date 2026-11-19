/* 由 build.mjs 生成，请勿手工修改；源码在 src/。 */
window.__ModuleLoader__.load({
  id: "dsh-qibi",
  factory(require) {
    var module = { exports: {} }
    var exports = module.exports
      var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
        }
        return to;
      };
      var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
        mod
      ));
      var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // src/panel.jsx
      var panel_exports = {};
      __export(panel_exports, {
        AiDrawer: () => AiDrawer,
        DataSettings: () => DataSettings,
        QibiIcon: () => QibiIcon,
        aiReasoningRequest: () => aiReasoningRequest,
        apply: () => apply,
        clearAiDrafts: () => clearAiDrafts,
        createHistory: () => createHistory,
        dataSettingsPayload: () => dataSettingsPayload,
        inject: () => inject,
        listAiDrafts: () => listAiDrafts,
        matchOutlineAnchors: () => matchOutlineAnchors,
        pushHistory: () => pushHistory,
        pushTypingHistory: () => pushTypingHistory,
        redoHistory: () => redoHistory,
        removeAiDraft: () => removeAiDraft,
        saveAiDraft: () => saveAiDraft,
        undoHistory: () => undoHistory,
        validReasoningPreference: () => validReasoningPreference
      });
      module.exports = __toCommonJS(panel_exports);
      var import_react = __toESM(require("react"), 1);

      // locale/en.json
      var en_default = {
        meta: {
          title: "QiBi writing desk",
          description: "QiBi writing desk: read and write QiBi manuscripts from the DSH sidebar, with 12 tools, 13 AI writing actions and pre-write revision backups.",
          detail: "docs/DETAIL.md"
        },
        ui: {
          panel: "QiBi",
          loading: "Reading QiBi data\u2026",
          noDb: "QiBi database not connected",
          noDbHint: "Choose a data location below and save. Create an empty database or connect an existing one; old manuscripts are never imported automatically. Tried: {path}",
          dataSettingsOpen: "Data location",
          dataSettingsTitle: "Set data location",
          dataSettingsDirectory: "Data directory",
          dataSettingsBrowse: "Choose folder",
          dataSettingsMode: "How to use this folder",
          dataSettingsCreate: "Create an empty database",
          dataSettingsModeHintCreate: "Initialize a folder without a database. No sample novels are added, and existing files are never overwritten.",
          dataSettingsExisting: "Connect an existing database",
          dataSettingsModeHintExisting: "Choose the folder containing novelforge.db to read its manuscripts. Files remain where they are.",
          dataSettingsUser: "Author in the current database",
          dataSettingsUserDefault: "Choose an available author automatically",
          dataSettingsCurrent: "Current database",
          dataSettingsNoCurrent: "Not created or connected yet",
          dataSettingsNoMove: "Saving changes the active location without moving, copying or overwriting old manuscripts.",
          dataSettingsCannotSave: "This host has no configuration editor, so it cannot save the data location.",
          dataSettingsSave: "Save and use this location",
          dataSettingsLoadFailed: "Could not read data location settings. Retry to continue.",
          dataSettingsInfoPageConfirm: "Changing data location reloads the workbench. Save changes on the current reference page first. Continue?",
          emptyNovel: "No novels in QiBi yet",
          emptyNovelHint: "Create a novel here, or connect an existing database from Data location.",
          emptyChapter: "This novel has no chapters",
          emptyChapterHint: "Create the first chapter here, or ask the agent to write it.",
          emptyBody: "This chapter has no prose yet.",
          retry: "Retry",
          refresh: "Refresh",
          reload: "Reload",
          novels: "Novels",
          chapters: "Chapters",
          chapter: "Chapter",
          words: "words",
          wordCount: "Words",
          updatedAt: "Updated",
          tabBody: "Prose",
          tabOutline: "Outline",
          tabCharacters: "Characters",
          tabContinuity: "Continuity",
          tabSearch: "Search",
          tabRevisions: "Revisions",
          tabExport: "Export",
          saving: "Saving\u2026",
          saved: "Saved",
          unsaved: "Unsaved",
          saveFailed: "Save failed",
          readonly: "Read only",
          writable: "Writable",
          writeOn: "Writing enabled",
          writeOff: "Writing disabled",
          conflict: "This chapter changed in QiBi",
          conflictHint: "Your edit was not written, so the manuscript is not overwritten. Reload QiBi's version, or force your content over it (a backup is taken first).",
          overwrite: "Overwrite anyway",
          newChapter: "New chapter",
          newChapterPrompt: "New chapter title",
          emptyOutline: "This novel has no outline yet.",
          emptyCharacters: "This novel has no character sheets yet.",
          error: "Failed to read",
          newNovel: "New novel",
          novelSettings: "Novel settings",
          novelTitle: "Title",
          novelAuthor: "Author",
          novelGenre: "Genre",
          novelStatus: "Serialization status",
          novelIntro: "Synopsis",
          chapterSettings: "Chapter settings",
          chapterTitle: "Chapter title",
          chapterStatus: "Chapter status",
          statusDraft: "Draft",
          noChapterSelected: "No chapter selected",
          noChapterHint: "Create or select a chapter on the left first.",
          moveUp: "Move up",
          moveDown: "Move down",
          edit: "Edit",
          delete: "Delete",
          save: "Save",
          cancel: "Cancel",
          create: "Create",
          untitled: "Untitled",
          close: "Close",
          titleRequired: "Title cannot be empty",
          nameRequired: "Character name cannot be empty",
          savedNotice: "Saved",
          createdNotice: "Created",
          deletedNotice: "Deleted",
          restoredNotice: "Restored",
          reindexedNotice: "Index rebuilt",
          externalChange: "This chapter changed on disk; save or reload to sync.",
          outlineNew: "New outline entry",
          outlineTarget: "Attached to",
          outlineMaster: "Master outline",
          outlineTitle: "Entry title",
          outlineContent: "Entry body",
          characterNew: "New character",
          characterName: "Name",
          characterAlias: "Alias",
          characterRole: "Role",
          characterGender: "Gender",
          characterAge: "Age",
          characterAppearance: "Appearance",
          characterPersonality: "Personality",
          characterBackground: "Background",
          stateSection: "Living state",
          stateLocation: "Location",
          stateRealm: "Realm / level",
          stateInventory: "Inventory",
          stateStatusEffects: "Injuries / status",
          stateRecentEvents: "Recent events",
          stateKeyRelationships: "Key relationships",
          stateNotes: "Notes",
          volumes: "Volumes",
          volumeNew: "New volume",
          volumeTitle: "Volume title",
          volumeSummary: "Volume summary",
          volumeConflict: "Core conflict",
          emptyVolumes: "This novel has no volumes yet.",
          chapterSummary: "Chapter summary",
          summaryText: "Summary",
          keyEvents: "Key events",
          cliffhanger: "Cliffhanger",
          writerState: "Writing state",
          progress: "Progress",
          foreshadowing: "Foreshadowing ledger (JSON)",
          foreshadowingInvalid: "Foreshadowing ledger must be valid JSON",
          searchPlaceholder: "Keyword or sentence",
          search: "Search",
          searchKeyword: "Keyword hits",
          searchKb: "Knowledge base hits",
          searchEmpty: "No hits.",
          reindex: "Rebuild index",
          kbStatsLabel: "Knowledge chunks",
          revisionsEmpty: "This chapter has no revisions yet.",
          restore: "Restore",
          exportFormat: "Format",
          exportOnlyPublished: "Published only",
          exportGenerate: "Generate preview",
          exportDownload: "Download",
          exportCopy: "Copy",
          exportCopied: "Copied to clipboard",
          confirmDeleteNovel: "Delete this novel and all of its chapters and settings?",
          confirmDeleteChapter: "Delete this chapter permanently? Its revision history is deleted with it.",
          confirmDeleteOutline: "Delete this outline entry?",
          confirmDeleteCharacter: "Delete this character sheet?",
          confirmRestore: "Replace the current prose with this revision? The current prose is backed up first.",
          confirmReindex: "Rebuild the knowledge base index for this whole novel?",
          tabDistill: "Distill",
          distillAuthors: "Distilled authors",
          distillNew: "New distilled author",
          distillNamePlaceholder: "Author name",
          distillEmpty: "No distilled authors yet",
          distillStartHint: "Create one with \uFF0B on the left, then upload samples or paste text.",
          distillSources: "Sources",
          distillNoSources: "No sources yet. Upload a file or paste text.",
          distillSourceCount: "sources",
          distillUpload: "Upload material",
          distillPaste: "Paste text",
          distillPasteName: "Source name",
          distillPasteContent: "Source text",
          distillAdd: "Add",
          distillFilesHint: "TXT / MD / HTML / JSON / EPUB, up to 100MB each.",
          distillEmptyFile: "empty file",
          distillUploaded: "Source parsed",
          distillCreated: "Author created",
          distillDeleted: "Deleted",
          distillAction: "Distillation",
          distillAgentHint: "Generation runs in the DSH agent. Copy the instruction below into the chat; the agent reads the sources, generates the three parts and saves a version.",
          distillInstruction: "Copy distillation instruction",
          distillInstructionCopied: "Instruction copied \u2014 paste it into the DSH chat",
          distillVersions: "Versions",
          distillNoVersions: "No versions yet. Copy the instruction and hand it to the agent first.",
          distillView: "View",
          distillRollback: "Roll back to this version",
          distillCurrentVersion: "Current version",
          distillNoVersion: "no version",
          distillBind: "Apply to current novel",
          distillUnbind: "Unbind",
          distillBound: "Applied to current novel",
          distillBindingOther: "Current novel is bound to",
          distillNotBound: "No distilled author is bound to this novel",
          distillApplied: "Applied",
          distillUnbound: "Unbound",
          distillWritingSkill: "writing skill",
          distillAuthorPersona: "author persona",
          confirmDeleteDistillAuthor: "Delete this distilled author and all of its sources and versions?",
          confirmDeleteDistillSource: "Delete this source?",
          confirmRollbackVersion: "Roll back to this version?",
          findTitle: "Find",
          findPlaceholder: "Find",
          findReplacePlaceholder: "Replace with",
          findPrev: "Previous",
          findNext: "Next",
          findReplaceOne: "Replace",
          findReplaceAll: "Replace all",
          findReplacedOne: "Replaced 1 match",
          findReplacedAll: "Replaced {n} matches",
          findSelected: "Find selection",
          copySelection: "Copy selection",
          cutSelection: "Cut selection",
          aiButton: "AI",
          aiTitle: "AI writing",
          aiGenerationModel: "Generation model",
          aiModelLoading: "Reading model settings\u2026",
          aiReasoning: "Thinking effort",
          aiReasoningFollow: "Follow current settings",
          aiReasoningHint: "Applies to generation and continuation in this panel. Remembered per model, without changing global DSH settings.",
          aiReasoningUnsupported: "This model declares no adjustable thinking levels. Current defaults will be used.",
          aiReasoningUnknown: "Thinking levels are temporarily unavailable. Current defaults will be used; reopen the panel to retry.",
          aiReasoningNone: "Off (none)",
          aiReasoningMinimal: "Minimal",
          aiReasoningLow: "Low",
          aiReasoningMedium: "Medium",
          aiReasoningHigh: "High",
          aiReasoningXhigh: "Extra high (xhigh)",
          aiReasoningMax: "Maximum",
          aiSelectionLabel: "Working on the selected text",
          aiGroupChapter: "Chapter",
          aiGroupSelection: "Selection",
          aiGroupReport: "Analysis",
          aiExtra: "Extra instructions",
          aiExtraHint: "Optional: specific requirements, taboos or direction",
          aiGenerate: "Generate",
          aiGenerating: "Generating\u2026",
          aiWaiting: "Streaming the result here\u2026",
          aiPreviewHint: "Pick an action and press Generate. The result appears here before you apply it.",
          aiApply: "Apply to prose",
          aiSaveOutline: "Save as outline",
          aiSavedOutline: "Saved as outline",
          aiOutlineTitle: "outline",
          aiNeedSelection: "Select some text in the prose first",
          aiCancelled: "Cancelled",
          aiUnavailable: "No model is available in DSH. Pick one in the model selector first.",
          aiSelectionStale: "The selected text changed; select it again.",
          aiDeslop: "Remove AI tone",
          aiPolish: "Polish",
          aiExpand: "Expand",
          format: "Format",
          formatTitle: "Normalize paragraph indents to two full-width spaces",
          filterNovels: "Filter works",
          filterChapters: "Filter chapters",
          noMatch: "No matches",
          locateChapter: "Locate current chapter",
          zen: "Focus",
          zenOff: "Exit focus",
          zenHint: "Focus mode (Alt+F): hide the sidebar and tabs, enlarge the text",
          more: "More actions",
          previousChapter: "Previous chapter",
          nextChapter: "Next chapter",
          readonlyWriteOff: "Writing is off \u2014 use the switch in the top bar to edit",
          readonlyConflict: "Version conflict \u2014 reload or overwrite first",
          writeToggleHint: "Toggle panel write access",
          undo: "Undo",
          undone: "Undone",
          undoWrongChapter: "Chapter changed \u2014 cannot undo",
          aiAppliedHint: "AI result applied to the chapter",
          aiAppliedSelection: "Selection replaced",
          aiPresetHook: "End with a hook",
          aiPresetConflict: "Raise the conflict",
          aiPresetPace: "Slow the pace",
          aiPresetForeshadow: "Seed foreshadowing",
          aiPresetDialog: "Natural dialogue",
          loadFailed: "Failed to load",
          emptyOutlineHint: "Use the master outline for the whole book and chapter outlines for per-chapter beats; AI follows them when drafting.",
          emptyCharactersHint: "Record your main characters here \u2014 writing and AI generation will use them automatically.",
          revisionsEmptyHint: "A version is saved automatically before each save or AI rewrite.",
          castThisChapter: "In this chapter",
          outlineAnchors: "Chapter beats",
          anchorSet: "Set anchor text",
          anchorPlaceholder: "Text to locate in the chapter",
          anchorNoMarker: "This outline has no anchor text",
          anchorMissing: 'Could not find "{marker}" in the chapter \u2014 set a more precise anchor.',
          anchorDoneHint: "Found in the chapter \u2014 click to jump",
          anchorTodoHint: "Not written yet \u2014 click to try locating",
          redo: "Redo",
          entityConflict: "This item was changed in another window or by the agent \u2014 reloaded. Please apply your edit again.",
          discardDraftConfirm: "Your unsaved changes will be lost. Continue?",
          aiIncomplete: "The output did not finish (interrupted or hit the length limit); it can be copied but not applied.",
          aiNoOutline: "No chapter outline yet. This run will rely on the master outline, chapter summaries, characters, foreshadowing and the previous chapter \u2014 adding a chapter outline usually keeps the draft on track.",
          aiHistory: "Generated",
          aiHistoryClear: "Clear",
          aiHistoryLoad: "Load this result (copy or apply again)",
          aiTruncated: 'The output hit the model length limit and is incomplete. Use "Continue" to keep writing, or copy it out first.',
          aiContinue: "Continue"
        }
      };

      // locale/zh.json
      var zh_default = {
        meta: {
          title: "\u8D77\u7B14\u5199\u4F5C\u53F0",
          description: "\u8D77\u7B14\u5199\u4F5C\u53F0\uFF1A\u5728 DSH \u4FA7\u680F\u8BFB\u5199\u8D77\u7B14\u4E66\u7A3F\uFF0C\u542B 12 \u4E2A\u5DE5\u5177\u300113 \u79CD AI \u5199\u4F5C\u52A8\u4F5C\u4E0E\u5199\u524D\u7248\u672C\u5907\u4EFD\u3002",
          detail: "docs/DETAIL.md"
        },
        ui: {
          panel: "\u8D77\u7B14",
          loading: "\u6B63\u5728\u8BFB\u53D6\u8D77\u7B14\u6570\u636E\u2026",
          noDb: "\u5C1A\u672A\u8FDE\u63A5\u8D77\u7B14\u6570\u636E\u5E93",
          noDbHint: "\u5728\u4E0B\u65B9\u9009\u62E9\u6570\u636E\u4F4D\u7F6E\u5E76\u4FDD\u5B58\uFF0C\u53EF\u65B0\u5EFA\u7A7A\u767D\u5E93\u6216\u8FDE\u63A5\u5DF2\u6709\u5E93\u3002\u4E0D\u4F1A\u81EA\u52A8\u5BFC\u5165\u65E7\u4E66\u7A3F\u3002\u5F53\u524D\u5C1D\u8BD5\u4F4D\u7F6E\uFF1A{path}",
          dataSettingsOpen: "\u6570\u636E\u4F4D\u7F6E",
          dataSettingsTitle: "\u8BBE\u7F6E\u6570\u636E\u4F4D\u7F6E",
          dataSettingsDirectory: "\u6570\u636E\u76EE\u5F55",
          dataSettingsBrowse: "\u9009\u62E9\u6587\u4EF6\u5939",
          dataSettingsMode: "\u4F7F\u7528\u65B9\u5F0F",
          dataSettingsCreate: "\u65B0\u5EFA\u7A7A\u767D\u5E93",
          dataSettingsModeHintCreate: "\u5728\u6CA1\u6709\u6570\u636E\u5E93\u7684\u76EE\u5F55\u65B0\u5EFA\u7A7A\u5E93\uFF0C\u4E0D\u751F\u6210\u793A\u4F8B\u5C0F\u8BF4\uFF1B\u5DF2\u6709\u6587\u4EF6\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002",
          dataSettingsExisting: "\u8FDE\u63A5\u5DF2\u6709\u5E93",
          dataSettingsModeHintExisting: "\u9009\u62E9\u542B novelforge.db \u7684\u6587\u4EF6\u5939\uFF0C\u8BFB\u53D6\u5176\u4E2D\u7684\u4F5C\u54C1\uFF1B\u539F\u6587\u4EF6\u4FDD\u6301\u5728\u539F\u4F4D\u7F6E\u3002",
          dataSettingsUser: "\u5F53\u524D\u5E93\u4E2D\u7684\u4F5C\u8005",
          dataSettingsUserDefault: "\u81EA\u52A8\u9009\u62E9\u53EF\u7528\u4F5C\u8005",
          dataSettingsCurrent: "\u5F53\u524D\u6570\u636E\u5E93",
          dataSettingsNoCurrent: "\u5C1A\u672A\u521B\u5EFA\u6216\u8FDE\u63A5",
          dataSettingsNoMove: "\u4FDD\u5B58\u53EA\u5207\u6362\u4F7F\u7528\u4F4D\u7F6E\uFF0C\u4E0D\u4F1A\u642C\u79FB\u3001\u590D\u5236\u6216\u8986\u76D6\u65E7\u4E66\u7A3F\u3002",
          dataSettingsCannotSave: "\u5F53\u524D\u5BBF\u4E3B\u6CA1\u6709\u63D0\u4F9B\u914D\u7F6E\u4FDD\u5B58\u670D\u52A1\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u6570\u636E\u4F4D\u7F6E\u3002",
          dataSettingsSave: "\u4FDD\u5B58\u5E76\u4F7F\u7528\u6B64\u4F4D\u7F6E",
          dataSettingsLoadFailed: "\u65E0\u6CD5\u8BFB\u53D6\u6570\u636E\u4F4D\u7F6E\u8BBE\u7F6E\uFF0C\u8BF7\u91CD\u8BD5\u3002",
          dataSettingsInfoPageConfirm: "\u5207\u6362\u6570\u636E\u4F4D\u7F6E\u4F1A\u91CD\u65B0\u52A0\u8F7D\u5DE5\u4F5C\u533A\u3002\u8BF7\u5148\u4FDD\u5B58\u5F53\u524D\u8D44\u6599\u9875\u7684\u4FEE\u6539\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F",
          emptyNovel: "\u8D77\u7B14\u91CC\u8FD8\u6CA1\u6709\u4F5C\u54C1",
          emptyNovelHint: "\u70B9\u51FB\u65B0\u5EFA\u4F5C\u54C1\u5F00\u59CB\u5199\u4F5C\uFF0C\u6216\u4ECE\u201C\u6570\u636E\u4F4D\u7F6E\u201D\u8FDE\u63A5\u5DF2\u6709\u6570\u636E\u5E93\u3002",
          emptyChapter: "\u8FD9\u90E8\u4F5C\u54C1\u8FD8\u6CA1\u6709\u7AE0\u8282",
          emptyChapterHint: "\u53EF\u4EE5\u76F4\u63A5\u5728\u8FD9\u91CC\u65B0\u5EFA\u7B2C\u4E00\u7AE0\uFF0C\u6216\u8BA9 Agent \u6765\u5199\u3002",
          emptyBody: "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u6709\u6B63\u6587\u3002",
          retry: "\u91CD\u8BD5",
          refresh: "\u5237\u65B0",
          reload: "\u91CD\u8F7D",
          novels: "\u4F5C\u54C1",
          chapters: "\u7AE0\u8282",
          chapter: "\u7AE0",
          words: "\u5B57",
          wordCount: "\u5B57\u6570",
          updatedAt: "\u66F4\u65B0\u4E8E",
          tabBody: "\u6B63\u6587",
          tabOutline: "\u5927\u7EB2",
          tabCharacters: "\u4EBA\u7269",
          tabContinuity: "\u8FDE\u7EED\u6027",
          tabSearch: "\u68C0\u7D22",
          tabRevisions: "\u7248\u672C",
          tabExport: "\u5BFC\u51FA",
          saving: "\u4FDD\u5B58\u4E2D\u2026",
          saved: "\u5DF2\u4FDD\u5B58",
          unsaved: "\u672A\u4FDD\u5B58",
          saveFailed: "\u4FDD\u5B58\u5931\u8D25",
          readonly: "\u53EA\u8BFB",
          writable: "\u53EF\u5199",
          writeOn: "\u5199\u5165\u5DF2\u5F00\u542F",
          writeOff: "\u5199\u5165\u5DF2\u5173\u95ED",
          conflict: "\u8D77\u7B14\u91CC\u7684\u8FD9\u4E00\u7AE0\u5DF2\u88AB\u6539\u52A8",
          conflictHint: "\u4F60\u7684\u7F16\u8F91\u6CA1\u6709\u5199\u5165\uFF0C\u907F\u514D\u8986\u76D6\u624B\u7A3F\u3002\u53EF\u4EE5\u91CD\u8F7D\u8D77\u7B14\u7684\u7248\u672C\uFF0C\u6216\u5F3A\u5236\u7528\u5F53\u524D\u5185\u5BB9\u8986\u76D6\uFF08\u4F1A\u5148\u81EA\u52A8\u5907\u4EFD\uFF09\u3002",
          overwrite: "\u5F3A\u5236\u8986\u76D6",
          newChapter: "\u65B0\u5EFA\u7AE0\u8282",
          newChapterPrompt: "\u65B0\u7AE0\u8282\u6807\u9898",
          emptyOutline: "\u8FD9\u90E8\u4F5C\u54C1\u8FD8\u6CA1\u6709\u5927\u7EB2\u3002",
          emptyCharacters: "\u8FD9\u90E8\u4F5C\u54C1\u8FD8\u6CA1\u6709\u4EBA\u7269\u8BBE\u5B9A\u3002",
          error: "\u8BFB\u53D6\u5931\u8D25",
          newNovel: "\u65B0\u5EFA\u4F5C\u54C1",
          novelSettings: "\u4F5C\u54C1\u8BBE\u7F6E",
          novelTitle: "\u4F5C\u54C1\u540D",
          novelAuthor: "\u4F5C\u8005",
          novelGenre: "\u9898\u6750",
          novelStatus: "\u8FDE\u8F7D\u72B6\u6001",
          novelIntro: "\u7B80\u4ECB",
          chapterSettings: "\u7AE0\u8282\u8BBE\u7F6E",
          chapterTitle: "\u7AE0\u8282\u6807\u9898",
          chapterStatus: "\u7AE0\u8282\u72B6\u6001",
          statusDraft: "\u8349\u7A3F",
          noChapterSelected: "\u8FD8\u6CA1\u6709\u9009\u4E2D\u7AE0\u8282",
          noChapterHint: "\u5148\u5728\u5DE6\u4FA7\u65B0\u5EFA\u6216\u9009\u62E9\u4E00\u7AE0\u3002",
          moveUp: "\u4E0A\u79FB",
          moveDown: "\u4E0B\u79FB",
          edit: "\u7F16\u8F91",
          delete: "\u5220\u9664",
          save: "\u4FDD\u5B58",
          cancel: "\u53D6\u6D88",
          create: "\u65B0\u5EFA",
          untitled: "\u672A\u547D\u540D",
          close: "\u5173\u95ED",
          titleRequired: "\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A",
          nameRequired: "\u4EBA\u7269\u540D\u4E0D\u80FD\u4E3A\u7A7A",
          savedNotice: "\u5DF2\u4FDD\u5B58",
          createdNotice: "\u5DF2\u521B\u5EFA",
          deletedNotice: "\u5DF2\u5220\u9664",
          restoredNotice: "\u5DF2\u6062\u590D",
          reindexedNotice: "\u7D22\u5F15\u5DF2\u91CD\u5EFA",
          externalChange: "\u78C1\u76D8\u4E0A\u7684\u8FD9\u4E00\u7AE0\u6709\u66F4\u65B0\uFF1B\u4FDD\u5B58\u6216\u91CD\u8F7D\u540E\u4F1A\u540C\u6B65\u3002",
          outlineNew: "\u65B0\u5EFA\u5927\u7EB2",
          outlineTarget: "\u5F52\u5C5E",
          outlineMaster: "\u603B\u7EB2",
          outlineTitle: "\u6761\u76EE\u6807\u9898",
          outlineContent: "\u6761\u76EE\u6B63\u6587",
          characterNew: "\u65B0\u5EFA\u4EBA\u7269",
          characterName: "\u59D3\u540D",
          characterAlias: "\u522B\u540D",
          characterRole: "\u5B9A\u4F4D",
          characterGender: "\u6027\u522B",
          characterAge: "\u5E74\u9F84",
          characterAppearance: "\u5916\u8C8C",
          characterPersonality: "\u6027\u683C",
          characterBackground: "\u80CC\u666F",
          stateSection: "\u52A8\u6001\u8D26\u672C",
          stateLocation: "\u5F53\u524D\u4F4D\u7F6E",
          stateRealm: "\u5883\u754C/\u7B49\u7EA7",
          stateInventory: "\u6301\u6709\u9053\u5177",
          stateStatusEffects: "\u4F24\u75C5/\u72B6\u6001",
          stateRecentEvents: "\u8FD1\u671F\u4E8B\u4EF6",
          stateKeyRelationships: "\u5173\u952E\u5173\u7CFB",
          stateNotes: "\u5907\u6CE8",
          volumes: "\u5206\u5377",
          volumeNew: "\u65B0\u5EFA\u5206\u5377",
          volumeTitle: "\u5206\u5377\u540D",
          volumeSummary: "\u5206\u5377\u7B80\u4ECB",
          volumeConflict: "\u6838\u5FC3\u51B2\u7A81",
          emptyVolumes: "\u8FD9\u90E8\u4F5C\u54C1\u8FD8\u6CA1\u6709\u5206\u5377\u3002",
          chapterSummary: "\u7AE0\u8282\u6458\u8981",
          summaryText: "\u6458\u8981",
          keyEvents: "\u5173\u952E\u4E8B\u4EF6",
          cliffhanger: "\u7AE0\u672B\u94A9\u5B50",
          writerState: "\u5199\u4F5C\u72B6\u6001",
          progress: "\u5199\u4F5C\u8FDB\u5EA6",
          foreshadowing: "\u4F0F\u7B14\u8D26\u672C\uFF08JSON\uFF09",
          foreshadowingInvalid: "\u4F0F\u7B14\u8D26\u672C\u5FC5\u987B\u662F\u5408\u6CD5 JSON",
          searchPlaceholder: "\u8F93\u5165\u5173\u952E\u8BCD\u6216\u53E5\u5B50",
          search: "\u68C0\u7D22",
          searchKeyword: "\u5173\u952E\u8BCD\u547D\u4E2D",
          searchKb: "\u77E5\u8BC6\u5E93\u547D\u4E2D",
          searchEmpty: "\u6CA1\u6709\u547D\u4E2D\u3002",
          reindex: "\u91CD\u5EFA\u7D22\u5F15",
          kbStatsLabel: "\u77E5\u8BC6\u5E93\u7247\u6BB5",
          revisionsEmpty: "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u6709\u5386\u53F2\u7248\u672C\u3002",
          restore: "\u6062\u590D",
          exportFormat: "\u683C\u5F0F",
          exportOnlyPublished: "\u53EA\u5BFC\u51FA\u5DF2\u53D1\u5E03",
          exportGenerate: "\u751F\u6210\u9884\u89C8",
          exportDownload: "\u4E0B\u8F7D",
          exportCopy: "\u590D\u5236",
          exportCopied: "\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
          confirmDeleteNovel: "\u5220\u9664\u8FD9\u90E8\u4F5C\u54C1\u4F1A\u8FDE\u5E26\u5220\u9664\u5168\u90E8\u7AE0\u8282\u4E0E\u8BBE\u5B9A\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmDeleteChapter: "\u5220\u9664\u8FD9\u4E00\u7AE0\u540E\u4E0D\u53EF\u6062\u590D\uFF08\u7248\u672C\u8BB0\u5F55\u4F1A\u4E00\u8D77\u5220\u9664\uFF09\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmDeleteOutline: "\u5220\u9664\u8FD9\u6761\u5927\u7EB2\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmDeleteCharacter: "\u5220\u9664\u8FD9\u4E2A\u4EBA\u7269\u8BBE\u5B9A\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmRestore: "\u7528\u8FD9\u4E2A\u7248\u672C\u8986\u76D6\u5F53\u524D\u6B63\u6587\uFF08\u4F1A\u5148\u5907\u4EFD\u5F53\u524D\u6B63\u6587\uFF09\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmReindex: "\u91CD\u5EFA\u6574\u90E8\u4F5C\u54C1\u7684\u77E5\u8BC6\u5E93\u7D22\u5F15\uFF0C\u786E\u5B9A\u5417\uFF1F",
          tabDistill: "\u84B8\u998F",
          distillAuthors: "\u84B8\u998F\u4F5C\u8005",
          distillNew: "\u65B0\u5EFA\u84B8\u998F\u4F5C\u8005",
          distillNamePlaceholder: "\u4F5C\u8005\u540D\u79F0",
          distillEmpty: "\u8FD8\u6CA1\u6709\u84B8\u998F\u4F5C\u8005",
          distillStartHint: "\u7528\u5DE6\u4E0A\u89D2\u7684 \uFF0B \u65B0\u5EFA\u4E00\u4F4D\uFF0C\u518D\u4E0A\u4F20\u6837\u7AE0\u6216\u7C98\u8D34\u6587\u672C\u3002",
          distillSources: "\u7D20\u6750",
          distillNoSources: "\u8FD8\u6CA1\u6709\u7D20\u6750\u3002\u8BF7\u4E0A\u4F20\u6587\u4EF6\u6216\u7C98\u8D34\u6587\u672C\u3002",
          distillSourceCount: "\u4EFD\u7D20\u6750",
          distillUpload: "\u4E0A\u4F20\u6750\u6599",
          distillPaste: "\u7C98\u8D34\u6587\u672C",
          distillPasteName: "\u6750\u6599\u540D\u79F0",
          distillPasteContent: "\u7D20\u6750\u6B63\u6587",
          distillAdd: "\u6DFB\u52A0",
          distillFilesHint: "\u652F\u6301 TXT / MD / HTML / JSON / EPUB\uFF0C\u5355\u4EFD\u6700\u5927 100MB\u3002",
          distillEmptyFile: "\u6587\u4EF6\u4E3A\u7A7A",
          distillUploaded: "\u7D20\u6750\u5DF2\u89E3\u6790",
          distillCreated: "\u4F5C\u8005\u5DF2\u521B\u5EFA",
          distillDeleted: "\u5DF2\u5220\u9664",
          distillAction: "\u84B8\u998F",
          distillAgentHint: "\u751F\u6210\u7531 DSH Agent \u5B8C\u6210\u3002\u590D\u5236\u4E0B\u9762\u7684\u6307\u4EE4\u5230\u5BF9\u8BDD\uFF0CAgent \u4F1A\u8BFB\u53D6\u7D20\u6750\u3001\u751F\u6210\u4E09\u6BB5\u7ED3\u679C\u5E76\u4FDD\u5B58\u7248\u672C\u3002",
          distillInstruction: "\u590D\u5236\u84B8\u998F\u6307\u4EE4",
          distillInstructionCopied: "\u6307\u4EE4\u5DF2\u590D\u5236\uFF0C\u7C98\u8D34\u5230 DSH \u5BF9\u8BDD\u5373\u53EF",
          distillVersions: "\u7248\u672C",
          distillNoVersions: "\u8FD8\u6CA1\u6709\u7248\u672C\u3002\u5148\u590D\u5236\u84B8\u998F\u6307\u4EE4\u4EA4\u7ED9 Agent\u3002",
          distillView: "\u67E5\u770B",
          distillRollback: "\u56DE\u6EDA\u5230\u6B64\u7248\u672C",
          distillCurrentVersion: "\u5F53\u524D\u7248\u672C",
          distillNoVersion: "\u65E0\u7248\u672C",
          distillBind: "\u5E94\u7528\u5230\u5F53\u524D\u4F5C\u54C1",
          distillUnbind: "\u89E3\u9664\u7ED1\u5B9A",
          distillBound: "\u5DF2\u5E94\u7528\u5230\u5F53\u524D\u4F5C\u54C1",
          distillBindingOther: "\u5F53\u524D\u4F5C\u54C1\u7ED1\u5B9A\u7684\u662F\u4F5C\u8005",
          distillNotBound: "\u5F53\u524D\u4F5C\u54C1\u8FD8\u6CA1\u6709\u7ED1\u5B9A\u84B8\u998F\u4F5C\u8005",
          distillApplied: "\u5DF2\u5E94\u7528",
          distillUnbound: "\u5DF2\u89E3\u9664\u7ED1\u5B9A",
          distillWritingSkill: "writing skill",
          distillAuthorPersona: "author persona",
          confirmDeleteDistillAuthor: "\u5220\u9664\u8FD9\u4F4D\u84B8\u998F\u4F5C\u8005\u53CA\u5176\u5168\u90E8\u7D20\u6750\u548C\u7248\u672C\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmDeleteDistillSource: "\u5220\u9664\u8FD9\u4EFD\u7D20\u6750\uFF0C\u786E\u5B9A\u5417\uFF1F",
          confirmRollbackVersion: "\u56DE\u6EDA\u5230\u8FD9\u4E2A\u7248\u672C\uFF0C\u786E\u5B9A\u5417\uFF1F",
          findTitle: "\u67E5\u627E",
          findPlaceholder: "\u67E5\u627E\u5185\u5BB9",
          findReplacePlaceholder: "\u66FF\u6362\u4E3A",
          findPrev: "\u4E0A\u4E00\u5904",
          findNext: "\u4E0B\u4E00\u5904",
          findReplaceOne: "\u66FF\u6362",
          findReplaceAll: "\u5168\u90E8\u66FF\u6362",
          findReplacedOne: "\u5DF2\u66FF\u6362 1 \u5904",
          findReplacedAll: "\u5DF2\u66FF\u6362 {n} \u5904",
          findSelected: "\u67E5\u627E\u9009\u4E2D\u5185\u5BB9",
          copySelection: "\u590D\u5236\u9009\u533A",
          cutSelection: "\u526A\u5207\u9009\u533A",
          aiButton: "AI \u751F\u6210",
          aiTitle: "AI \u5199\u4F5C",
          aiGenerationModel: "\u751F\u6210\u6A21\u578B",
          aiModelLoading: "\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u8BBE\u7F6E\u2026",
          aiReasoning: "\u601D\u8003\u5F3A\u5EA6",
          aiReasoningFollow: "\u8DDF\u968F\u5F53\u524D\u8BBE\u7F6E",
          aiReasoningHint: "\u4EC5\u4F5C\u7528\u4E8E\u672C\u9762\u677F\u7684\u751F\u6210\u4E0E\u7EE7\u7EED\u751F\u6210\uFF0C\u6309\u6A21\u578B\u8BB0\u4F4F\u9009\u62E9\uFF0C\u4E0D\u66F4\u6539 DSH \u5168\u5C40\u8BBE\u7F6E\u3002",
          aiReasoningUnsupported: "\u6B64\u6A21\u578B\u672A\u58F0\u660E\u53EF\u8C03\u601D\u8003\u6863\u4F4D\uFF0C\u5C06\u4F7F\u7528\u5F53\u524D\u9ED8\u8BA4\u8BBE\u7F6E\u3002",
          aiReasoningUnknown: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u601D\u8003\u6863\u4F4D\uFF0C\u5C06\u4F7F\u7528\u5F53\u524D\u9ED8\u8BA4\u8BBE\u7F6E\uFF1B\u53EF\u91CD\u65B0\u6253\u5F00\u9762\u677F\u91CD\u8BD5\u3002",
          aiReasoningNone: "\u5173\u95ED\uFF08none\uFF09",
          aiReasoningMinimal: "\u6700\u4F4E\uFF08minimal\uFF09",
          aiReasoningLow: "\u4F4E\uFF08low\uFF09",
          aiReasoningMedium: "\u4E2D\uFF08medium\uFF09",
          aiReasoningHigh: "\u9AD8\uFF08high\uFF09",
          aiReasoningXhigh: "\u6781\u9AD8\uFF08xhigh\uFF09",
          aiReasoningMax: "\u6700\u9AD8\uFF08max\uFF09",
          aiSelectionLabel: "\u6B63\u5728\u5904\u7406\u9009\u4E2D\u6587\u672C",
          aiGroupChapter: "\u6574\u7AE0",
          aiGroupSelection: "\u9009\u533A",
          aiGroupReport: "\u5206\u6790",
          aiExtra: "\u8865\u5145\u8981\u6C42",
          aiExtraHint: "\u53EF\u9009\uFF1A\u8FD9\u4E00\u6BB5\u7684\u7279\u6B8A\u8981\u6C42\u3001\u7981\u5FCC\u6216\u65B9\u5411",
          aiGenerate: "\u5F00\u59CB\u751F\u6210",
          aiGenerating: "\u751F\u6210\u4E2D\u2026",
          aiWaiting: "\u6B63\u5728\u751F\u6210\uFF0C\u6587\u5B57\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u2026",
          aiPreviewHint: "\u9009\u4E00\u4E2A\u52A8\u4F5C\u540E\u70B9\u300C\u5F00\u59CB\u751F\u6210\u300D\u3002\u751F\u6210\u7ED3\u679C\u4F1A\u5148\u51FA\u73B0\u5728\u8FD9\u91CC\uFF0C\u786E\u8BA4\u540E\u518D\u5E94\u7528\u3002",
          aiApply: "\u5E94\u7528\u5230\u6B63\u6587",
          aiSaveOutline: "\u5B58\u4E3A\u7EC6\u7EB2",
          aiSavedOutline: "\u5DF2\u4FDD\u5B58\u4E3A\u7EC6\u7EB2",
          aiOutlineTitle: "\u7EC6\u7EB2",
          aiNeedSelection: "\u8BF7\u5148\u5728\u6B63\u6587\u4E2D\u9009\u4E2D\u4E00\u6BB5\u6587\u5B57",
          aiCancelled: "\u5DF2\u53D6\u6D88",
          aiUnavailable: "DSH \u91CC\u6CA1\u6709\u53EF\u7528\u7684\u6A21\u578B\uFF0C\u8BF7\u5148\u5728\u6A21\u578B\u9009\u62E9\u5668\u91CC\u9009\u4E00\u4E2A\u3002",
          aiSelectionStale: "\u9009\u4E2D\u7684\u6B63\u6587\u5DF2\u7ECF\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u4E2D\u540E\u518D\u8BD5\u3002",
          aiDeslop: "AI \u53BBAI\u5473",
          aiPolish: "AI \u6DA6\u8272",
          aiExpand: "AI \u6269\u5199",
          format: "\u4E00\u952E\u6392\u7248",
          formatTitle: "\u6BCF\u6BB5\u9996\u884C\u7EDF\u4E00\u4E3A\u4E24\u4E2A\u5168\u89D2\u7A7A\u683C\u7F29\u8FDB",
          filterNovels: "\u7B5B\u9009\u4F5C\u54C1",
          filterChapters: "\u7B5B\u9009\u7AE0\u8282",
          noMatch: "\u6CA1\u6709\u5339\u914D\u9879",
          locateChapter: "\u5B9A\u4F4D\u5F53\u524D\u7AE0\u8282",
          zen: "\u4E13\u6CE8",
          zenOff: "\u9000\u51FA\u4E13\u6CE8",
          zenHint: "\u4E13\u6CE8\u6A21\u5F0F\uFF08Alt+F\uFF09\uFF1A\u9690\u85CF\u4FA7\u680F\u4E0E\u9875\u7B7E\uFF0C\u653E\u5927\u6B63\u6587",
          more: "\u66F4\u591A\u64CD\u4F5C",
          previousChapter: "\u4E0A\u4E00\u7AE0",
          nextChapter: "\u4E0B\u4E00\u7AE0",
          readonlyWriteOff: "\u5199\u5165\u5DF2\u5173\u95ED\uFF1A\u6253\u5F00\u53F3\u4E0A\u89D2\u5F00\u5173\u540E\u53EF\u7F16\u8F91",
          readonlyConflict: "\u7248\u672C\u51B2\u7A81\uFF1A\u8BF7\u5148\u9009\u62E9\u91CD\u8F7D\u6216\u8986\u76D6",
          writeToggleHint: "\u70B9\u51FB\u5207\u6362\u9762\u677F\u5199\u5165\u6743\u9650",
          undo: "\u64A4\u9500",
          undone: "\u5DF2\u64A4\u9500",
          undoWrongChapter: "\u5DF2\u5207\u6362\u7AE0\u8282\uFF0C\u65E0\u6CD5\u64A4\u9500",
          aiAppliedHint: "AI \u7ED3\u679C\u5DF2\u5199\u5165\u6B63\u6587",
          aiAppliedSelection: "\u5DF2\u66FF\u6362\u9009\u4E2D\u6587\u5B57",
          aiPresetHook: "\u7AE0\u672B\u7559\u94A9\u5B50",
          aiPresetConflict: "\u52A0\u5F3A\u51B2\u7A81",
          aiPresetPace: "\u653E\u6162\u8282\u594F",
          aiPresetForeshadow: "\u8865\u8DB3\u4F0F\u7B14",
          aiPresetDialog: "\u5BF9\u8BDD\u66F4\u81EA\u7136",
          loadFailed: "\u52A0\u8F7D\u5931\u8D25",
          emptyOutlineHint: "\u603B\u7EB2\u653E\u5168\u4E66\u7684\u9AA8\u67B6\uFF0C\u7AE0\u8282\u7EC6\u7EB2\u7EA6\u675F\u5355\u7AE0\u60C5\u8282\uFF1B\u5199\u6B63\u6587\u524D\u5148\u5217\u7EC6\u7EB2\uFF0CAI \u4F1A\u6309\u5B83\u6765\u5199\u3002",
          emptyCharactersHint: "\u5148\u628A\u4E3B\u8981\u89D2\u8272\u7684\u8BBE\u5B9A\u8BB0\u4E0B\u6765\uFF0C\u5199\u4F5C\u4E0E AI \u751F\u6210\u65F6\u4F1A\u81EA\u52A8\u5E26\u4E0A\u4ED6\u4EEC\u3002",
          revisionsEmptyHint: "\u6BCF\u6B21\u4FDD\u5B58\u6216 AI \u6539\u5199\u6B63\u6587\u524D\u90FD\u4F1A\u81EA\u52A8\u7559\u4E00\u4EFD\u7248\u672C\uFF0C\u4FDD\u5B58\u5728\u8FD9\u91CC\u3002",
          castThisChapter: "\u672C\u7AE0\u51FA\u573A",
          outlineAnchors: "\u672C\u7AE0\u7EC6\u7EB2",
          anchorSet: "\u8BBE\u7F6E\u951A\u70B9\u6587\u5B57",
          anchorPlaceholder: "\u6B63\u6587\u4E2D\u7684\u5B9A\u4F4D\u6587\u5B57",
          anchorNoMarker: "\u8FD9\u6761\u7EC6\u7EB2\u6CA1\u6709\u53EF\u7528\u4E8E\u5B9A\u4F4D\u7684\u6587\u5B57",
          anchorMissing: "\u6B63\u6587\u4E2D\u6CA1\u627E\u5230\u300C{marker}\u300D\uFF0C\u70B9\u300C\u8BBE\u7F6E\u951A\u70B9\u6587\u5B57\u300D\u6362\u4E00\u4E2A\u66F4\u7CBE\u786E\u7684\u6807\u8BB0\u3002",
          anchorDoneHint: "\u5DF2\u5728\u6B63\u6587\u4E2D\u5B9A\u4F4D\uFF0C\u70B9\u51FB\u8DF3\u8F6C",
          anchorTodoHint: "\u6B63\u6587\u91CC\u8FD8\u6CA1\u5199\u5230\uFF1B\u70B9\u51FB\u5C1D\u8BD5\u5B9A\u4F4D",
          redo: "\u91CD\u505A",
          entityConflict: "\u8FD9\u6761\u5185\u5BB9\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u6216 Agent \u4FEE\u6539\uFF0C\u5DF2\u91CD\u65B0\u52A0\u8F7D\uFF0C\u8BF7\u518D\u6539\u4E00\u6B21\u3002",
          discardDraftConfirm: "\u672C\u5730\u8FD8\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539\uFF0C\u91CD\u8F7D\u4F1A\u4E22\u5931\u8FD9\u4E9B\u5185\u5BB9\u3002\u7EE7\u7EED\uFF1F",
          aiIncomplete: "\u8F93\u51FA\u6CA1\u6709\u5B8C\u6574\u7ED3\u675F\uFF08\u53EF\u80FD\u88AB\u4E2D\u65AD\u6216\u8FBE\u5230\u957F\u5EA6\u4E0A\u9650\uFF09\uFF0C\u53EA\u80FD\u590D\u5236\uFF0C\u4E0D\u80FD\u5199\u5165\u6B63\u6587\u3002",
          aiNoOutline: "\u672C\u7AE0\u8FD8\u6CA1\u6709\u7EC6\u7EB2\u3002\u672C\u6B21\u4F1A\u4F9D\u636E\u4F5C\u54C1\u603B\u7EB2\u3001\u5404\u7AE0\u6458\u8981\u3001\u4EBA\u7269\u8BBE\u5B9A\u3001\u4F0F\u7B14\u8D26\u672C\u4E0E\u524D\u4E00\u7AE0\u6B63\u6587\u751F\u6210\uFF1B\u5148\u8865\u7EC6\u7EB2\u80FD\u660E\u663E\u51CF\u5C11\u8DD1\u504F\u3002",
          aiHistory: "\u751F\u6210\u5386\u53F2",
          aiHistoryClear: "\u6E05\u7A7A",
          aiHistoryLoad: "\u8F7D\u5165\u8FD9\u6B21\u751F\u6210\u7ED3\u679C\uFF08\u53EF\u590D\u5236\u6216\u518D\u6B21\u5E94\u7528\uFF09",
          aiTruncated: "\u8F93\u51FA\u8FBE\u5230\u6A21\u578B\u957F\u5EA6\u4E0A\u9650\uFF0C\u6B63\u6587\u6CA1\u6709\u5199\u5B8C\u3002\u53EF\u4EE5\u70B9\u300C\u7EE7\u7EED\u751F\u6210\u300D\u63A5\u7740\u5199\uFF0C\u6216\u5148\u590D\u5236\u4FDD\u5B58\u3002",
          aiContinue: "\u7EE7\u7EED\u751F\u6210"
        }
      };

      // src/i18n.js
      var NS = "qibi";
      function flat(pack) {
        const ui = pack && typeof pack.ui === "object" && pack.ui !== null ? pack.ui : {};
        return Object.fromEntries(Object.entries(ui).map(([key, value]) => [key, String(value)]));
      }
      var dictionaries = { zh: flat(zh_default), en: flat(en_default) };

      // src/styles.js
      var STYLES = `
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

      /* ---- \u53EF\u8BFB\u6027\u4E0E\u952E\u76D8\u7126\u70B9 ---- */
      .qibi-editor { max-width: 46em; margin: 0 auto; }
      .qibi-editor[readonly] { color: var(--dsw-alias-label-secondary); cursor: default; }
      .qibi-btn:focus-visible, .qibi-tab:focus-visible, .qibi-input:focus-visible,
      .qibi-select:focus-visible, .qibi-textarea:focus-visible, .qibi-chip:focus-visible,
      .qibi-novel:focus-visible, .qibi-chapter:focus-visible, .qibi-context button:focus-visible,
      .qibi-menu button:focus-visible, .qibi-author-btn:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
      }
      .qibi-editor:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }

      /* ---- \u4FA7\u680F\uFF1A\u4F5C\u54C1 / \u7AE0\u8282\u4E24\u6BB5\u72EC\u7ACB\u6EDA\u52A8 ---- */
      .qibi-side-block { display: flex; flex-direction: column; min-height: 0; }
      .qibi-side-block.novels { flex: 0 1 auto; max-height: 40%; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .qibi-side-block.chapters { flex: 1 1 auto; }
      .qibi-side-block .qibi-list { flex: 1 1 auto; }
      .qibi-side-search { padding: 6px 8px 2px; }
      .qibi-side-search .qibi-input { width: 100%; box-sizing: border-box; height: 24px; }
      .qibi-side-note { padding: 2px 10px 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; }

      /* ---- \u7AE0\u8282\u5934\u300C\u22EF\u300D\u83DC\u5355 ---- */
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

      /* ---- \u901A\u77E5\u6D6E\u5C42\uFF1A\u4E0D\u6324\u538B\u6B63\u6587 ---- */
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

      /* ---- \u5199\u5165\u5F00\u5173\uFF1A\u660E\u786E\u7684\u6309\u94AE\u6001 ---- */
      .qibi-chip[aria-pressed] { cursor: pointer; }
      .qibi-chip[aria-pressed]:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
      .qibi-chip[aria-pressed="false"] { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }

      /* ---- \u672C\u7AE0\u51FA\u573A\u4EBA\u7269 ---- */
      .qibi-cast {
        display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        padding: 6px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-layer-1);
      }
      .qibi-cast .qibi-chip { cursor: pointer; }
      .qibi-cast .qibi-chip:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }

      /* ---- \u672C\u7AE0\u7EC6\u7EB2\u951A\u70B9 ---- */
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

      /* ---- \u9875\u7B7E\u4E0E\u53EA\u8BFB\u63D0\u793A ---- */
      .qibi-tab.active { font-weight: 600; }
      .qibi-readonly-bar {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 16px; font-size: 12px; color: var(--dsw-alias-label-secondary);
        background: var(--dsw-alias-bg-layer-1);
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }

      /* ---- \u4E13\u6CE8\u6A21\u5F0F\uFF08Alt+F\uFF09 ---- */
      .qibi-root.zen .qibi-side, .qibi-root.zen .qibi-tabs { display: none; }
      .qibi-root.zen .qibi-editor { max-width: 40em; font-size: 17px; line-height: 2; }
      .qibi-root.zen .qibi-main-head { border-bottom-color: transparent; }
      `;

      // src/panel.jsx
      var PANEL_ID = "qibi";
      var API_PATH = "api/qibi";
      var TABS = [
        ["body", "tabBody"],
        ["outline", "tabOutline"],
        ["characters", "tabCharacters"],
        ["distill", "tabDistill"],
        ["continuity", "tabContinuity"],
        ["search", "tabSearch"],
        ["revisions", "tabRevisions"],
        ["export", "tabExport"]
      ];
      var AI_PRESETS = ["aiPresetHook", "aiPresetConflict", "aiPresetPace", "aiPresetForeshadow", "aiPresetDialog"];
      var CHARACTER_FIELDS = ["name", "alias", "role", "gender", "age", "appearance", "personality", "background"];
      var STATE_FIELDS = ["location", "realm", "inventory", "statusEffects", "recentEvents", "keyRelationships", "notes"];
      function QibiIcon({ size = 16 }) {
        return /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ import_react.default.createElement("path", { d: "M4 20.2c3.1 1 6 .7 8.6-.9", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", opacity: ".55" }), /* @__PURE__ */ import_react.default.createElement(
          "path",
          {
            d: "M14.6 3.5a2.4 2.4 0 0 1 3.3 0l2.6 2.6a2.4 2.4 0 0 1 0 3.3l-6.8 6.8-6.2 1.6 1.6-6.2 6.9-6.9Z",
            stroke: "currentColor",
            strokeWidth: "1.6",
            strokeLinejoin: "round"
          }
        ), /* @__PURE__ */ import_react.default.createElement("path", { d: "M13.1 5 19 10.9", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "12.2", cy: "13.4", r: "1.15", fill: "currentColor" }));
      }
      function rpcError(failure) {
        const error = new Error(failure?.message ?? "\u672A\u77E5\u9519\u8BEF");
        error.code = failure?.code ?? "INTERNAL";
        error.details = failure?.details ?? {};
        return error;
      }
      async function callHost(endpoint, payload) {
        const response = await fetch(API_PATH, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint, payload: payload ?? {} })
        });
        if (!response.ok) {
          throw new Error(response.status === 401 || response.status === 403 ? `\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u8BF7\u6C42\uFF08HTTP ${response.status}\uFF09\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5` : `\u5BBF\u4E3B\u8FD4\u56DE HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data?.ok) throw rpcError(data?.error);
        return data.value;
      }
      function formatWords(value) {
        return Number(value ?? 0).toLocaleString();
      }
      async function streamAi(payload, onDelta, signal) {
        const response = await fetch("api/qibi/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal
        });
        if (!response.ok) {
          let message = `\u5BBF\u4E3B\u8FD4\u56DE HTTP ${response.status}`;
          try {
            const data = await response.json();
            message = data?.error?.message ?? message;
          } catch {
          }
          throw new Error(message);
        }
        if (!response.body) throw new Error("\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u6D41\u5F0F\u54CD\u5E94");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        let meta = null;
        let completed = false;
        for (; ; ) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let split = buffer.indexOf("\n\n");
          while (split >= 0) {
            const raw = buffer.slice(0, split);
            buffer = buffer.slice(split + 2);
            const line = raw.split("\n").find((row) => row.startsWith("data: "));
            if (line) {
              let event;
              try {
                event = JSON.parse(line.slice(6));
              } catch {
                event = null;
              }
              if (event?.type === "delta") {
                full += event.text;
                if (onDelta) onDelta(event.text, full);
              } else if (event?.type === "done") {
                meta = event;
                completed = true;
              } else if (event?.type === "error") {
                throw new Error(event.message || "\u751F\u6210\u5931\u8D25");
              }
            }
            split = buffer.indexOf("\n\n");
          }
        }
        return {
          text: meta?.text ?? full,
          rewrite: meta?.rewrite === true,
          report: meta?.report === true,
          complete: completed && meta?.truncated !== true,
          truncated: meta?.truncated === true
        };
      }
      var AI_REASONING_KEY = "qibi:ai-reasoning";
      function validReasoningPreference(info, value) {
        return typeof value === "string" && info?.reasoning?.efforts?.some((row) => row.id === value) ? value : "";
      }
      function aiReasoningRequest(info, value) {
        return { modelKey: info?.model ?? "", reasoningEffort: validReasoningPreference(info, value) };
      }
      function reasoningLabel(row, t) {
        const keys = { none: "aiReasoningNone", off: "aiReasoningNone", minimal: "aiReasoningMinimal", low: "aiReasoningLow", medium: "aiReasoningMedium", high: "aiReasoningHigh", xhigh: "aiReasoningXhigh", max: "aiReasoningMax" };
        return keys[row.id] ? t(keys[row.id]) : row.name || row.id;
      }
      function AiDrawer({ call, novelId, chapterId, draft, selection, initialMode, writable, info, modelLoading = false, hasOutline, t, notify, onApply, onClose }) {
        const [reasoningEffort, setReasoningEffort] = (0, import_react.useState)(() => validReasoningPreference(info, readJson(AI_REASONING_KEY, {})?.[info?.model]));
        const [mode, setMode] = (0, import_react.useState)("draft");
        const [extra, setExtra] = (0, import_react.useState)("");
        const [busy, setBusy] = (0, import_react.useState)(false);
        const [preview, setPreview] = (0, import_react.useState)("");
        const [error, setError] = (0, import_react.useState)("");
        const [complete, setComplete] = (0, import_react.useState)(false);
        const [truncated, setTruncated] = (0, import_react.useState)(false);
        const [forceRewrite, setForceRewrite] = (0, import_react.useState)(false);
        const [history, setHistory] = (0, import_react.useState)(() => listAiDrafts(chapterId));
        const abortRef = (0, import_react.useRef)(null);
        const modes = info?.modes ?? [];
        const modeInfo = modes.find((row) => row.id === mode);
        const isSelectionMode = modeInfo?.group === "selection";
        const isReportMode = modeInfo?.group === "report";
        const reasoning = info?.reasoning;
        const inheritedEffort = reasoning?.selectedEffort ?? reasoning?.defaultEffort;
        const inheritedRow = reasoning?.efforts?.find((row) => row.id === inheritedEffort);
        (0, import_react.useEffect)(() => {
          setReasoningEffort(validReasoningPreference(info, readJson(AI_REASONING_KEY, {})?.[info?.model]));
        }, [info]);
        const chooseReasoning = (event) => {
          const next = validReasoningPreference(info, event.target.value);
          setReasoningEffort(next);
          if (info?.model) writeJson(AI_REASONING_KEY, { ...readJson(AI_REASONING_KEY, {}), [info.model]: next });
        };
        (0, import_react.useEffect)(() => {
          if (selection) setMode(initialMode || "polish-selection");
          else setMode((prev) => modes.some((row) => row.id === prev) ? prev : "draft");
        }, [selection, initialMode]);
        (0, import_react.useEffect)(() => () => {
          abortRef.current?.abort?.();
        }, []);
        (0, import_react.useEffect)(() => {
          setHistory(listAiDrafts(chapterId));
        }, [chapterId]);
        const closeRef = (0, import_react.useRef)(onClose);
        closeRef.current = onClose;
        (0, import_react.useEffect)(() => {
          const onKey = (event) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            abortRef.current?.abort?.();
            closeRef.current?.();
          };
          window.addEventListener("keydown", onKey, true);
          return () => window.removeEventListener("keydown", onKey, true);
        }, []);
        const generate = async () => {
          if (busy || modelLoading || novelId == null) return;
          if (isSelectionMode && !selection) {
            notify("error", t("aiNeedSelection"));
            return;
          }
          setBusy(true);
          setPreview("");
          setError("");
          setComplete(false);
          setTruncated(false);
          setForceRewrite(false);
          const controller = new AbortController();
          abortRef.current = controller;
          try {
            const result = await streamAi({
              ...aiReasoningRequest(info, reasoningEffort),
              mode,
              novelId,
              chapterId,
              content: isSelectionMode ? selection.text : draft,
              extra
            }, (_delta, full) => setPreview(full), controller.signal);
            setPreview(result.text);
            setComplete(result.complete === true);
            setTruncated(result.truncated === true);
            if (chapterId != null && String(result.text ?? "").trim()) {
              setHistory(saveAiDraft(chapterId, {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                mode,
                label: modeInfo?.label ?? mode,
                text: result.text,
                at: Date.now(),
                truncated: result.truncated === true,
                forceRewrite: false
              }));
            }
          } catch (cause) {
            if (controller.signal.aborted) setError(t("aiCancelled"));
            else setError(causeText(cause));
          } finally {
            setBusy(false);
            abortRef.current = null;
          }
        };
        const cancel = () => {
          abortRef.current?.abort?.();
          abortRef.current = null;
          setBusy(false);
        };
        const continueWriting = async () => {
          if (busy || modelLoading || !preview.trim() || chapterId == null) return;
          setBusy(true);
          setError("");
          const controller = new AbortController();
          abortRef.current = controller;
          const base = preview;
          const join = (value) => `${base}${base.endsWith("\n") || !value ? "" : "\n"}${value}`;
          try {
            const result = await streamAi({
              ...aiReasoningRequest(info, reasoningEffort),
              mode: "continue",
              novelId,
              chapterId,
              content: base,
              extra
            }, (_delta, full) => setPreview(join(full)), controller.signal);
            const merged = join(result.text);
            setPreview(merged);
            setComplete(result.complete === true);
            setTruncated(result.truncated === true);
            setForceRewrite(true);
            if (String(result.text ?? "").trim()) {
              setHistory(saveAiDraft(chapterId, {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                mode: "continue",
                label: t("aiContinue"),
                text: merged,
                at: Date.now(),
                truncated: result.truncated === true,
                forceRewrite: true
              }));
            }
          } catch (cause) {
            if (controller.signal.aborted) setError(t("aiCancelled"));
            else setError(causeText(cause));
          } finally {
            setBusy(false);
            abortRef.current = null;
          }
        };
        const copy = async () => {
          if (!preview) return;
          try {
            await navigator.clipboard.writeText(preview);
            notify("info", t("exportCopied"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        };
        return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-overlay", onClick: onClose }), /* @__PURE__ */ import_react.default.createElement(
          "div",
          {
            className: "qibi-ai-drawer",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": t("aiTitle"),
            onClick: (event) => event.stopPropagation()
          },
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-head" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("aiTitle")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small qibi-ai-close", onClick: onClose, title: t("close"), "aria-label": t("close") }, t("close"))),
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row qibi-ai-model-settings", "aria-busy": modelLoading }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("aiGenerationModel") }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub qibi-ai-model", title: info?.model ?? "" }, modelLoading ? t("aiModelLoading") : info?.model || t("aiUnavailable"))), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("aiReasoning") }, /* @__PURE__ */ import_react.default.createElement("select", { className: "qibi-select", "aria-label": t("aiReasoning"), value: validReasoningPreference(info, reasoningEffort), onChange: chooseReasoning, disabled: busy || modelLoading || !reasoning?.supported }, /* @__PURE__ */ import_react.default.createElement("option", { value: "" }, t("aiReasoningFollow"), inheritedRow ? ` \xB7 ${reasoningLabel(inheritedRow, t)}` : ""), (reasoning?.efforts ?? []).map((row) => /* @__PURE__ */ import_react.default.createElement("option", { key: row.id, value: row.id, title: row.description }, reasoningLabel(row, t)))))),
          !modelLoading && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, reasoning?.supported ? t("aiReasoningHint") : reasoning?.known ? t("aiReasoningUnsupported") : t("aiReasoningUnknown")),
          chapterId != null && hasOutline === false && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-note" }, t("aiNoOutline")),
          isSelectionMode && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-selection" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("aiSelectionLabel")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-selected" }, "\u201C", selection.text.slice(0, 120), selection.text.length > 120 ? "\u2026" : "", "\u201D")),
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-modes" }, ["chapter", "selection", "report"].map((group) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-mode-group", key: group }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t(group === "chapter" ? "aiGroupChapter" : group === "selection" ? "aiGroupSelection" : "aiGroupReport")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, modes.filter((row) => row.group === group).map((row) => /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              key: row.id,
              className: `qibi-btn small${mode === row.id ? " primary" : ""}`,
              disabled: busy || row.group === "selection" && !selection,
              onClick: () => {
                setMode(row.id);
                setPreview("");
                setError("");
              }
            },
            row.label
          )))))),
          /* @__PURE__ */ import_react.default.createElement(Field, { label: t("aiExtra") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 2, value: extra, onChange: (event) => setExtra(event.target.value), placeholder: t("aiExtraHint") })),
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-presets" }, AI_PRESETS.map((key) => /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              key,
              className: "qibi-chip",
              onClick: () => setExtra((previous) => previous ? `${previous}\uFF1B${t(key)}` : t(key))
            },
            t(key)
          ))),
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy || modelLoading || !info?.available, onClick: () => void generate() }, busy ? t("aiGenerating") : t("aiGenerate")), busy && /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: cancel }, t("cancel")), preview && !busy && !complete && /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: modelLoading, onClick: () => void continueWriting() }, t("aiContinue")), preview && !busy && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => void copy() }, t("exportCopy")), isReportMode ? modeInfo?.saveAsOutline === false ? null : /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || !complete, onClick: () => onApply({ mode, modeLabel: modeInfo?.label, text: preview, report: true }) }, t("aiSaveOutline")) : /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: !writable || !complete || isSelectionMode && !selection, onClick: () => onApply({ mode, modeLabel: modeInfo?.label, text: preview, rewrite: forceRewrite ? true : modeInfo?.rewrite !== false, selection }) }, t("aiApply"))), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, preview ? `${preview.replace(/\s/g, "").length} ${t("words")}` : "")),
          !info?.available && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-error-text" }, t("aiUnavailable")),
          preview && !busy && !complete && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-error-text" }, truncated ? t("aiTruncated") : t("aiIncomplete")),
          error && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-error-text" }, error),
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-ai-preview" }, preview ? /* @__PURE__ */ import_react.default.createElement("pre", { className: "qibi-pre" }, preview) : /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, busy ? t("aiWaiting") : t("aiPreviewHint"))),
          history.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-drafts" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("aiHistory"), " \xB7 ", history.length), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "qibi-btn small",
              onClick: () => {
                clearAiDrafts(chapterId);
                setHistory([]);
              }
            },
            t("aiHistoryClear")
          )), history.map((item) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-draft", key: item.id }, /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "qibi-draft-main",
              title: t("aiHistoryLoad"),
              onClick: () => {
                if (modes.some((row) => row.id === item.mode)) setMode(item.mode);
                setPreview(item.text);
                setError("");
                setComplete(item.truncated !== true);
                setTruncated(item.truncated === true);
                setForceRewrite(item.forceRewrite === true);
              }
            },
            /* @__PURE__ */ import_react.default.createElement("span", null, item.label || item.mode),
            /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, new Date(item.at).toLocaleString(), " \xB7 ", item.text.replace(/\s/g, "").length, " ", t("words"))
          ), /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "qibi-btn small",
              "aria-label": t("delete"),
              onClick: () => setHistory(removeAiDraft(chapterId, item.id))
            },
            "\xD7"
          ))))
        ));
      }
      function bytesToBase64(bytes) {
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      function readFlag(key) {
        try {
          return typeof localStorage !== "undefined" && localStorage.getItem(key) === "1";
        } catch {
          return false;
        }
      }
      function writeFlag(key, on) {
        try {
          if (typeof localStorage !== "undefined") localStorage.setItem(key, on ? "1" : "0");
        } catch {
        }
      }
      function readJson(key, fallback) {
        try {
          const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
          return raw ? JSON.parse(raw) : fallback;
        } catch {
          return fallback;
        }
      }
      function writeJson(key, value) {
        try {
          if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(value));
        } catch {
        }
      }
      var AI_DRAFTS_KEY = "qibi:ai-drafts";
      var AI_DRAFTS_PER_CHAPTER = 10;
      var AI_DRAFTS_TOTAL = 40;
      function loadDraftStore() {
        const value = readJson(AI_DRAFTS_KEY, {});
        return value && typeof value === "object" ? value : {};
      }
      function listAiDrafts(chapterId) {
        if (chapterId == null) return [];
        const rows = loadDraftStore()[String(chapterId)];
        return Array.isArray(rows) ? rows : [];
      }
      function saveAiDraft(chapterId, entry) {
        if (chapterId == null) return [];
        const store = loadDraftStore();
        const key = String(chapterId);
        const list = Array.isArray(store[key]) ? store[key] : [];
        store[key] = [entry, ...list].slice(0, AI_DRAFTS_PER_CHAPTER);
        const all = [];
        for (const [chapterKey, rows] of Object.entries(store)) {
          for (const row of rows) all.push({ chapterKey, id: row.id, at: row.at ?? 0 });
        }
        all.sort((a, b) => b.at - a.at);
        for (const extra of all.slice(AI_DRAFTS_TOTAL)) {
          store[extra.chapterKey] = (store[extra.chapterKey] ?? []).filter((row) => row.id !== extra.id);
        }
        writeJson(AI_DRAFTS_KEY, store);
        return store[key];
      }
      function removeAiDraft(chapterId, id) {
        if (chapterId == null) return [];
        const store = loadDraftStore();
        const key = String(chapterId);
        store[key] = (store[key] ?? []).filter((row) => row.id !== id);
        if (store[key].length === 0) delete store[key];
        writeJson(AI_DRAFTS_KEY, store);
        return store[key] ?? [];
      }
      function clearAiDrafts(chapterId) {
        if (chapterId == null) return;
        const store = loadDraftStore();
        delete store[String(chapterId)];
        writeJson(AI_DRAFTS_KEY, store);
      }
      function matchOutlineAnchors(draft, outlines, markers, chapterId) {
        if (chapterId == null) return [];
        const text = String(draft ?? "");
        return (outlines ?? []).filter((row) => row.chapterId === chapterId).map((row) => {
          const custom = String(markers?.[row.id] ?? "").trim();
          const fallback = String(row.title ?? "").trim().slice(0, 8);
          const marker = custom || fallback;
          const pos = marker ? text.indexOf(marker) : -1;
          return { id: row.id, title: row.title || "", marker, pos, done: pos >= 0, custom: Boolean(custom) };
        });
      }
      var HISTORY_LIMIT = 200;
      function createHistory() {
        return { past: [], future: [], lastText: "", lastAt: 0 };
      }
      function trimHistory(list) {
        if (list.length > HISTORY_LIMIT) list.shift();
      }
      function pushHistory(history, before, after) {
        if (after === before) return;
        history.past.push(before);
        trimHistory(history.past);
        history.future.length = 0;
        history.lastText = after;
        history.lastAt = 0;
      }
      function pushTypingHistory(history, before, after, now, gap = 700) {
        if (!history.lastText || now - history.lastAt > gap) {
          history.past.push(history.lastText || before);
          trimHistory(history.past);
          history.future.length = 0;
        }
        history.lastText = after;
        history.lastAt = now;
      }
      function undoHistory(history, current) {
        if (history.past.length === 0) return null;
        const previous = history.past.pop();
        history.future.push(current);
        trimHistory(history.future);
        history.lastText = previous;
        history.lastAt = 0;
        return previous;
      }
      function redoHistory(history, current) {
        if (history.future.length === 0) return null;
        const next = history.future.pop();
        history.past.push(current);
        trimHistory(history.past);
        history.lastText = next;
        history.lastAt = 0;
        return next;
      }
      function chapterStatusOptions(current) {
        const options = ["\u8349\u7A3F", "\u5DF2\u53D1\u5E03"];
        const value = typeof current === "string" ? current.trim() : "";
        if (value && !options.includes(value)) options.push(value);
        return options;
      }
      function emptyCharacter() {
        const form = {};
        for (const key of CHARACTER_FIELDS) form[key] = "";
        return form;
      }
      function emptyCharacterState() {
        const state = {};
        for (const key of STATE_FIELDS) state[key] = "";
        return state;
      }
      function stateToForm(state) {
        return {
          location: state?.location ?? "",
          realm: state?.realm ?? "",
          inventory: state?.inventory ?? "",
          statusEffects: state?.statusEffects ?? "",
          recentEvents: state?.recentEvents ?? "",
          keyRelationships: state?.keyRelationships ?? "",
          notes: state?.notes ?? ""
        };
      }
      function causeText(cause) {
        return cause instanceof Error ? cause.message : String(cause);
      }
      function Field({ label, children }) {
        return /* @__PURE__ */ import_react.default.createElement("label", { className: "qibi-field" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-label" }, label), children);
      }
      function Dialog({ title, onClose, children, footer }) {
        (0, import_react.useEffect)(() => {
          const onKey = (event) => {
            if (event.key === "Escape") onClose();
          };
          window.addEventListener("keydown", onKey);
          return () => window.removeEventListener("keydown", onKey);
        }, [onClose]);
        return /* @__PURE__ */ import_react.default.createElement(
          "div",
          {
            className: "qibi-overlay",
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) onClose();
            }
          },
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-dialog", role: "dialog", "aria-modal": "true" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-dialog-head" }, /* @__PURE__ */ import_react.default.createElement("strong", null, title), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: onClose }, "\xD7")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-dialog-body" }, children), footer ? /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-dialog-foot" }, footer) : null)
        );
      }
      function LoadError({ message, onRetry, t }) {
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("loadFailed")), /* @__PURE__ */ import_react.default.createElement("span", null, message), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn", onClick: onRetry }, t("retry"))));
      }
      function OutlineTab({ call, novelId, chapters, writable, active, notify, t }) {
        const [outline, setOutline] = (0, import_react.useState)(null);
        const [editing, setEditing] = (0, import_react.useState)(null);
        const [form, setForm] = (0, import_react.useState)({ title: "", content: "", chapterId: "" });
        const [busy, setBusy] = (0, import_react.useState)(false);
        const [error, setError] = (0, import_react.useState)(null);
        const [editToken, setEditToken] = (0, import_react.useState)(null);
        const load = (0, import_react.useCallback)(async () => {
          if (novelId === null) return;
          try {
            const result = await call("outline", { novelId });
            setOutline(result.outline);
            setError(null);
          } catch (cause) {
            setError(causeText(cause));
          }
        }, [call, novelId]);
        (0, import_react.useEffect)(() => {
          setOutline(null);
          setEditing(null);
          setForm({ title: "", content: "", chapterId: "" });
          setError(null);
        }, [novelId]);
        (0, import_react.useEffect)(() => {
          if (active) void load();
        }, [active, load]);
        const startNew = () => {
          setEditing("new");
          setEditToken(null);
          setForm({ title: "", content: "", chapterId: "" });
        };
        const startEdit = (row) => {
          setEditing(row.id);
          setEditToken(row.token ?? null);
          setForm({ title: row.title, content: row.content, chapterId: row.chapterId === null ? "" : String(row.chapterId) });
        };
        const cancel = () => {
          setEditing(null);
          setEditToken(null);
          setForm({ title: "", content: "", chapterId: "" });
        };
        const submit = async () => {
          if (busy) return;
          if (!form.title.trim() && !form.content.trim()) {
            notify("error", t("titleRequired"));
            return;
          }
          setBusy(true);
          try {
            const chapterId = form.chapterId === "" ? null : Number(form.chapterId);
            if (editing === "new") {
              await call("createOutline", { novelId, title: form.title, content: form.content, chapterId });
            } else {
              await call("updateOutline", {
                outlineId: editing,
                title: form.title,
                content: form.content,
                chapterId,
                expectedToken: editToken ?? void 0
              });
            }
            await load();
            cancel();
            notify("info", t("savedNotice"));
          } catch (cause) {
            if (cause?.code === "ENTITY_CONFLICT") {
              notify("error", t("entityConflict"));
              cancel();
              void load();
            } else {
              notify("error", causeText(cause));
            }
          } finally {
            setBusy(false);
          }
        };
        const remove = async (row) => {
          if (!window.confirm(t("confirmDeleteOutline"))) return;
          try {
            await call("deleteOutline", { outlineId: row.id });
            await load();
            notify("info", t("deletedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        };
        const chapterLabel = (id) => chapters.find((row) => row.id === id)?.title ?? `#${id}`;
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-pane" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-section-title" }, t("tabOutline")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: startNew }, "\uFF0B ", t("outlineNew"))), editing !== null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("outlineTarget") }, /* @__PURE__ */ import_react.default.createElement(
          "select",
          {
            className: "qibi-select",
            value: form.chapterId,
            onChange: (event) => setForm((current) => ({ ...current, chapterId: event.target.value }))
          },
          /* @__PURE__ */ import_react.default.createElement("option", { value: "" }, t("outlineMaster")),
          chapters.map((row) => /* @__PURE__ */ import_react.default.createElement("option", { key: row.id, value: String(row.id) }, row.title))
        )), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("outlineTitle") }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            className: "qibi-input",
            value: form.title,
            placeholder: t("outlineTitle"),
            onChange: (event) => setForm((current) => ({ ...current, title: event.target.value }))
          }
        )), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("outlineContent") }, /* @__PURE__ */ import_react.default.createElement(
          "textarea",
          {
            className: "qibi-textarea",
            rows: 6,
            value: form.content,
            onChange: (event) => setForm((current) => ({ ...current, content: event.target.value }))
          }
        )), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy, onClick: () => void submit() }, t("save")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: cancel }, t("cancel")))), error && /* @__PURE__ */ import_react.default.createElement(LoadError, { message: error, onRetry: () => void load(), t }), !error && outline === null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("loading")), !error && outline !== null && outline.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("emptyOutline")), /* @__PURE__ */ import_react.default.createElement("span", null, t("emptyOutlineHint")), writable && /* @__PURE__ */ import_react.default.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn", onClick: startNew }, "\uFF0B ", t("outlineNew")))), !error && (outline ?? []).map((row) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card", key: row.id }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("h4", null, row.title || t("untitled")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-tag" }, row.chapterId === null ? t("outlineMaster") : chapterLabel(row.chapterId)), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: () => startEdit(row) }, t("edit")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small danger", disabled: !writable, onClick: () => void remove(row) }, t("delete"))), /* @__PURE__ */ import_react.default.createElement("p", null, row.content || "\u2014"))));
      }
      function CharactersTab({ call, novelId, writable, active, notify, t }) {
        const [characters, setCharacters] = (0, import_react.useState)(null);
        const [dialog, setDialog] = (0, import_react.useState)(null);
        const [error, setError] = (0, import_react.useState)(null);
        const load = (0, import_react.useCallback)(async () => {
          if (novelId === null) return;
          try {
            const result = await call("characters", { novelId });
            setCharacters(result.characters);
            setError(null);
          } catch (cause) {
            setError(causeText(cause));
          }
        }, [call, novelId]);
        (0, import_react.useEffect)(() => {
          setCharacters(null);
          setDialog(null);
          setError(null);
        }, [novelId]);
        (0, import_react.useEffect)(() => {
          if (active) void load();
        }, [active, load]);
        const openCreate = () => {
          setDialog({ id: null, token: null, stateToken: null, form: emptyCharacter(), state: emptyCharacterState(), stateExists: false, loadingState: false, busy: false });
        };
        const openEdit = async (row) => {
          setDialog({ id: row.id, token: row.token ?? null, stateToken: null, form: { ...emptyCharacter(), ...pick(row) }, state: emptyCharacterState(), stateExists: false, loadingState: true, busy: false });
          try {
            const state = await call("characterState", { characterId: row.id });
            setDialog((current) => current && current.id === row.id ? { ...current, state: stateToForm(state), stateToken: state.token ?? null, stateExists: state.exists === true, loadingState: false } : current);
          } catch (cause) {
            notify("error", causeText(cause));
            setDialog((current) => current ? { ...current, loadingState: false } : current);
          }
        };
        const setField = (key, value) => setDialog((current) => current ? { ...current, form: { ...current.form, [key]: value } } : current);
        const setStateField = (key, value) => setDialog((current) => current ? { ...current, state: { ...current.state, [key]: value } } : current);
        const save = async () => {
          if (!dialog || dialog.busy || dialog.loadingState) return;
          if (!dialog.form.name.trim()) {
            notify("error", t("nameRequired"));
            return;
          }
          setDialog((current) => current ? { ...current, busy: true } : current);
          try {
            let characterId = dialog.id;
            if (dialog.id === null) {
              const payload = { novelId };
              for (const [key, value] of Object.entries(dialog.form)) {
                if (value.trim()) payload[key] = value.trim();
              }
              const created = await call("createCharacter", payload);
              characterId = created.id;
            } else {
              await call("updateCharacter", { characterId: dialog.id, ...dialog.form, expectedToken: dialog.token ?? void 0 });
            }
            const statePayload = {};
            for (const [key, value] of Object.entries(dialog.state)) {
              if (dialog.id === null && !value.trim()) continue;
              statePayload[key] = value;
            }
            const hasState = Object.keys(statePayload).length > 0;
            if (hasState && (dialog.id === null || dialog.stateExists || Object.values(dialog.state).some((value) => value.trim()))) {
              await call("updateCharacterState", { characterId, ...statePayload, expectedToken: dialog.stateToken ?? void 0 });
            }
            await load();
            setDialog(null);
            notify("info", t("savedNotice"));
          } catch (cause) {
            if (cause?.code === "ENTITY_CONFLICT") {
              notify("error", t("entityConflict"));
              setDialog(null);
              void load();
            } else {
              notify("error", causeText(cause));
              setDialog((current) => current ? { ...current, busy: false } : current);
            }
          }
        };
        const remove = async (row) => {
          if (!window.confirm(t("confirmDeleteCharacter"))) return;
          try {
            await call("deleteCharacter", { characterId: row.id });
            await load();
            notify("info", t("deletedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-pane" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-section-title" }, t("tabCharacters")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: openCreate }, "\uFF0B ", t("characterNew"))), error && /* @__PURE__ */ import_react.default.createElement(LoadError, { message: error, onRetry: () => void load(), t }), !error && characters === null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("loading")), !error && characters !== null && characters.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("emptyCharacters")), /* @__PURE__ */ import_react.default.createElement("span", null, t("emptyCharactersHint")), writable && /* @__PURE__ */ import_react.default.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn", onClick: openCreate }, "\uFF0B ", t("characterNew")))), !error && (characters ?? []).map((row) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card", key: row.id }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("h4", null, row.name, row.role ? ` \xB7 ${row.role}` : ""), row.alias && /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-tag" }, row.alias), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: () => void openEdit(row) }, t("edit")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small danger", disabled: !writable, onClick: () => void remove(row) }, t("delete"))), [row.gender, row.age].filter(Boolean).length > 0 && /* @__PURE__ */ import_react.default.createElement("p", null, [row.gender, row.age].filter(Boolean).join(" \xB7 ")), row.personality && /* @__PURE__ */ import_react.default.createElement("p", null, t("characterPersonality"), "\uFF1A", row.personality), row.background && /* @__PURE__ */ import_react.default.createElement("p", null, t("characterBackground"), "\uFF1A", row.background), (row.location || row.realm) && /* @__PURE__ */ import_react.default.createElement("p", null, t("stateSection"), "\uFF1A", [row.location, row.realm].filter(Boolean).join(" \xB7 ")))), dialog && /* @__PURE__ */ import_react.default.createElement(
          Dialog,
          {
            title: dialog.id === null ? t("characterNew") : t("edit"),
            onClose: () => {
              if (!dialog.busy) setDialog(null);
            },
            footer: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: dialog.busy, onClick: () => setDialog(null) }, t("cancel")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: dialog.busy || dialog.loadingState, onClick: () => void save() }, t("save")))
          },
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, CHARACTER_FIELDS.map((key) => /* @__PURE__ */ import_react.default.createElement(Field, { key, label: t(`character${key[0].toUpperCase()}${key.slice(1)}`) }, key === "background" || key === "appearance" || key === "personality" ? /* @__PURE__ */ import_react.default.createElement(
            "textarea",
            {
              className: "qibi-textarea",
              rows: 3,
              value: dialog.form[key],
              onChange: (event) => setField(key, event.target.value)
            }
          ) : /* @__PURE__ */ import_react.default.createElement(
            "input",
            {
              className: "qibi-input",
              value: dialog.form[key],
              onChange: (event) => setField(key, event.target.value)
            }
          ))), /* @__PURE__ */ import_react.default.createElement("h4", { className: "qibi-form-title" }, t("stateSection")), dialog.loadingState ? /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("loading")) : STATE_FIELDS.map((key) => /* @__PURE__ */ import_react.default.createElement(Field, { key, label: t(`state${key[0].toUpperCase()}${key.slice(1)}`) }, /* @__PURE__ */ import_react.default.createElement(
            "textarea",
            {
              className: "qibi-textarea",
              rows: 2,
              value: dialog.state[key],
              onChange: (event) => setStateField(key, event.target.value)
            }
          ))))
        ));
      }
      function DistillTab({ call, novelId, writable, active, notify, t }) {
        const [authors, setAuthors] = (0, import_react.useState)(null);
        const [authorId, setAuthorId] = (0, import_react.useState)(null);
        const [detail, setDetail] = (0, import_react.useState)(null);
        const [binding, setBinding] = (0, import_react.useState)(null);
        const [creating, setCreating] = (0, import_react.useState)(false);
        const [newName, setNewName] = (0, import_react.useState)("");
        const [pasteOpen, setPasteOpen] = (0, import_react.useState)(false);
        const [pasteName, setPasteName] = (0, import_react.useState)("");
        const [pasteText, setPasteText] = (0, import_react.useState)("");
        const [busy, setBusy] = (0, import_react.useState)(false);
        const [uploading, setUploading] = (0, import_react.useState)(null);
        const [preview, setPreview] = (0, import_react.useState)(null);
        const fileRef = (0, import_react.useRef)(null);
        const loadAuthors = (0, import_react.useCallback)(async () => {
          try {
            const result = await call("distilledAuthors", {});
            const list = Array.isArray(result) ? result : result?.authors ?? [];
            setAuthors(list);
            setAuthorId((previous) => previous != null && list.some((author) => author.id === previous) ? previous : list[0]?.id ?? null);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, notify]);
        const loadDetail = (0, import_react.useCallback)(async (id) => {
          if (id == null) {
            setDetail(null);
            return;
          }
          try {
            setDetail(await call("distilledAuthor", { authorId: id }));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, notify]);
        const loadBinding = (0, import_react.useCallback)(async () => {
          if (novelId == null) {
            setBinding(null);
            return;
          }
          try {
            const result = await call("writerState", { novelId });
            setBinding(result.writerState);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, novelId, notify]);
        (0, import_react.useEffect)(() => {
          if (active) void loadAuthors();
        }, [active, loadAuthors]);
        (0, import_react.useEffect)(() => {
          if (!active) return;
          setPreview(null);
          void loadDetail(authorId);
        }, [active, authorId, loadDetail]);
        (0, import_react.useEffect)(() => {
          if (active) void loadBinding();
        }, [active, loadBinding]);
        const createAuthor = async () => {
          const name = newName.trim();
          if (!name || busy) return;
          setBusy(true);
          try {
            const author = await call("createDistilledAuthor", { name });
            setCreating(false);
            setNewName("");
            await loadAuthors();
            setAuthorId(author.id);
            notify("info", t("distillCreated"));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const deleteAuthor = async () => {
          if (!detail || busy || !window.confirm(t("confirmDeleteDistillAuthor"))) return;
          setBusy(true);
          try {
            await call("deleteDistilledAuthor", { authorId: detail.id });
            setDetail(null);
            await loadAuthors();
            await loadBinding();
            notify("info", t("distillDeleted"));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const uploadFiles = async (fileList) => {
          const files = [...fileList ?? []];
          if (!files.length || authorId == null || busy) return;
          setBusy(true);
          try {
            for (const file of files) {
              if (!file.size) {
                notify("error", `${file.name}: ${t("distillEmptyFile")}`);
                continue;
              }
              const format = (file.name.split(".").pop() || "txt").toLowerCase();
              setUploading({ filename: file.name, percent: 0 });
              const init = await call("initDistilledSource", { authorId, filename: file.name, format, sizeBytes: file.size });
              const bytes = new Uint8Array(await file.arrayBuffer());
              const chunkSize = 512 * 1024;
              let offset = 0;
              while (offset < bytes.length) {
                const end = Math.min(bytes.length, offset + chunkSize);
                await call("appendDistilledSource", {
                  sourceId: init.sourceId,
                  offset,
                  base64: bytesToBase64(bytes.subarray(offset, end))
                });
                offset = end;
                setUploading({ filename: file.name, percent: Math.round(offset / bytes.length * 100) });
              }
              await call("completeDistilledSource", { sourceId: init.sourceId });
              setUploading(null);
            }
            await loadDetail(authorId);
            await loadAuthors();
            notify("info", t("distillUploaded"));
          } catch (cause) {
            notify("error", causeText(cause));
            setUploading(null);
            void loadDetail(authorId);
          } finally {
            setBusy(false);
            if (fileRef.current) fileRef.current.value = "";
          }
        };
        const addPaste = async () => {
          if (!pasteText.trim() || authorId == null || busy) return;
          setBusy(true);
          try {
            await call("addDistilledText", {
              authorId,
              filename: pasteName.trim() || "\u7C98\u8D34\u6750\u6599.txt",
              text: pasteText
            });
            setPasteOpen(false);
            setPasteName("");
            setPasteText("");
            await loadDetail(authorId);
            await loadAuthors();
            notify("info", t("distillUploaded"));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const deleteSource = async (source) => {
          if (busy || !window.confirm(t("confirmDeleteDistillSource"))) return;
          setBusy(true);
          try {
            await call("deleteDistilledSource", { sourceId: source.id });
            await loadDetail(authorId);
            await loadAuthors();
            notify("info", t("distillDeleted"));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const copyInstruction = async () => {
          if (!detail) return;
          const text = [
            `\u8BF7\u84B8\u998F\u8D77\u7B14\u4F5C\u8005\u300A${detail.name}\u300B\uFF08authorId=${detail.id}\uFF09\u3002`,
            `1. \u8C03\u7528 qibi_distill(action=read, authorId=${detail.id}) \u8BFB\u53D6\u7D20\u6750\u3001\u4E0A\u4E00\u7248\u672C\u4E0E\u4E09\u6BB5\u63D0\u793A\u8BCD\u3002`,
            "2. \u4F9D\u6B21\u751F\u6210 writingSkill\u3001authorPersona\u3001skillMarkdown\u3002",
            `3. \u8C03\u7528 qibi_distill(action=save, authorId=${detail.id}, writingSkill, authorPersona, skillMarkdown, sampleSummary) \u4FDD\u5B58\u65B0\u7248\u672C\u3002`,
            "\u5B8C\u6210\u540E\u56DE\u5230\u8D77\u7B14\u9762\u677F\u7684\u300C\u84B8\u998F\u300D\u9875\u7B7E\u5237\u65B0\u67E5\u770B\u7248\u672C\u3002"
          ].join("\n");
          try {
            await navigator.clipboard.writeText(text);
            notify("info", t("distillInstructionCopied"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        };
        const rollback = async (version) => {
          if (!detail || busy || !window.confirm(t("confirmRollbackVersion"))) return;
          setBusy(true);
          try {
            await call("rollbackDistilledVersion", { authorId: detail.id, versionId: version.id });
            await loadDetail(detail.id);
            await loadAuthors();
            notify("info", t("savedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const bindAuthor = async (id) => {
          if (novelId == null || busy) return;
          setBusy(true);
          try {
            const result = await call("bindDistilledAuthor", { novelId, authorId: id });
            setBinding(result.writerState);
            notify("info", id == null ? t("distillUnbound") : t("distillApplied"));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const boundAuthor = authors?.find((author) => author.id === binding?.distilledAuthorId) ?? null;
        const isBound = detail ? binding?.distilledAuthorId === detail.id : false;
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-distill" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-distill-list" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-head" }, /* @__PURE__ */ import_react.default.createElement("span", null, t("distillAuthors")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small",
            disabled: !writable,
            title: t("distillNew"),
            onClick: () => {
              setCreating((value) => !value);
              setNewName("");
            }
          },
          "\uFF0B"
        )), creating && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-newrow" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            autoFocus: true,
            className: "qibi-input",
            value: newName,
            placeholder: t("distillNamePlaceholder"),
            onChange: (event) => setNewName(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") void createAuthor();
              if (event.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }
          }
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy || !newName.trim(), onClick: () => void createAuthor() }, "\u2713")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-list" }, authors === null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub", style: { padding: "8px" } }, t("loading")), authors !== null && authors.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub", style: { padding: "8px" } }, t("distillEmpty")), (authors ?? []).map((author) => /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            key: author.id,
            className: `qibi-author-btn${author.id === authorId ? " active" : ""}`,
            onClick: () => setAuthorId(author.id)
          },
          /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-author-name" }, author.name),
          /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-author-meta" }, author.sourceCount, " ", t("distillSourceCount"), " \xB7 ", author.currentVersion ? `v${author.currentVersion.version}` : t("distillNoVersion"))
        )))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-distill-main" }, !detail && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("distillEmpty")), /* @__PURE__ */ import_react.default.createElement("span", null, t("distillStartHint"))), detail && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("h3", { className: "qibi-distill-title" }, detail.name), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-tag" }, detail.status), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("distillCurrentVersion"), " ", detail.currentVersion ? `v${detail.currentVersion.version}` : t("distillNoVersion")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => {
          void loadDetail(detail.id);
          void loadAuthors();
          void loadBinding();
        } }, t("refresh")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small danger", disabled: !writable || busy, onClick: () => void deleteAuthor() }, t("delete"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row qibi-binding" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, boundAuthor ? `${t("distillBindingOther")}\u300A${boundAuthor.name}\u300B` : t("distillNotBound")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), isBound ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-tag" }, t("distillBound")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || busy, onClick: () => void bindAuthor(null) }, t("distillUnbind"))) : /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small",
            disabled: !writable || busy || novelId == null || !detail.currentVersion,
            onClick: () => void bindAuthor(detail.id)
          },
          t("distillBind")
        )), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-section-title" }, t("distillSources"), " (", detail.sources.length, ")"), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || busy, onClick: () => fileRef.current?.click() }, t("distillUpload")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || busy, onClick: () => setPasteOpen((value) => !value) }, t("distillPaste")), /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            ref: fileRef,
            type: "file",
            multiple: true,
            accept: ".txt,.md,.html,.htm,.json,.epub",
            style: { display: "none" },
            onChange: (event) => {
              void uploadFiles(event.target.files);
            }
          }
        )), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("distillFilesHint")), uploading && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-progress" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-progress-bar", style: { width: `${uploading.percent}%` } }), /* @__PURE__ */ import_react.default.createElement("span", null, uploading.filename, " \xB7 ", uploading.percent, "%")), pasteOpen && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("distillPasteName") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: pasteName, placeholder: "\u6750\u6599.txt", onChange: (event) => setPasteName(event.target.value) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("distillPasteContent") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 6, value: pasteText, onChange: (event) => setPasteText(event.target.value) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy || !pasteText.trim(), onClick: () => void addPaste() }, t("distillAdd")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => setPasteOpen(false) }, t("cancel")))), detail.sources.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("distillNoSources")), detail.sources.map((source) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card", key: source.id }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("strong", null, source.filename), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-tag" }, source.format), /* @__PURE__ */ import_react.default.createElement("span", { className: `qibi-tag${source.status === "error" ? " danger" : ""}` }, source.status), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, formatWords(source.parsedChars), " ", t("words"), " \xB7 ", source.chapterCount, " ", t("chapters")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small danger", disabled: !writable || busy, onClick: () => void deleteSource(source) }, t("delete"))), source.error && /* @__PURE__ */ import_react.default.createElement("p", { className: "qibi-error-text" }, source.error))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-section-title" }, t("distillAction")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card" }, /* @__PURE__ */ import_react.default.createElement("p", null, t("distillAgentHint")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small primary",
            disabled: !detail.sources.some((source) => source.status === "ready"),
            onClick: () => void copyInstruction()
          },
          t("distillInstruction")
        ))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-section-title" }, t("distillVersions"), " (", detail.versions.length, ")"), detail.versions.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("distillNoVersions")), detail.versions.map((version) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card", key: version.id }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("strong", null, "v", version.version), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, version.createdAt), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => setPreview(version) }, t("distillView")), /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small",
            disabled: !writable || busy || detail.currentVersionId === version.id,
            onClick: () => void rollback(version)
          },
          t("distillRollback")
        )), /* @__PURE__ */ import_react.default.createElement("p", null, version.sampleSummary || "\u2014"))), preview && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("strong", null, "v", preview.version), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, preview.createdAt), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => setPreview(null) }, "\xD7")), /* @__PURE__ */ import_react.default.createElement("pre", { className: "qibi-pre" }, preview.skillMarkdown), /* @__PURE__ */ import_react.default.createElement("details", null, /* @__PURE__ */ import_react.default.createElement("summary", null, t("distillWritingSkill")), /* @__PURE__ */ import_react.default.createElement("pre", { className: "qibi-pre" }, preview.writingSkill)), /* @__PURE__ */ import_react.default.createElement("details", null, /* @__PURE__ */ import_react.default.createElement("summary", null, t("distillAuthorPersona")), /* @__PURE__ */ import_react.default.createElement("pre", { className: "qibi-pre" }, preview.authorPersona))))));
      }
      function ContinuityTab({ call, novelId, chapterId, writable, active, notify, t }) {
        const [volumes, setVolumes] = (0, import_react.useState)(null);
        const [volumeForm, setVolumeForm] = (0, import_react.useState)(null);
        const [summary, setSummary] = (0, import_react.useState)(null);
        const [summaryForm, setSummaryForm] = (0, import_react.useState)({ summary: "", keyEvents: "", cliffhanger: "" });
        const [writerState, setWriterState] = (0, import_react.useState)(null);
        const [writerForm, setWriterForm] = (0, import_react.useState)({ progress: "", foreshadowing: "[]" });
        const [busy, setBusy] = (0, import_react.useState)(false);
        const [loadingSummary, setLoadingSummary] = (0, import_react.useState)(false);
        const [loadingWriter, setLoadingWriter] = (0, import_react.useState)(false);
        const summarySeq = (0, import_react.useRef)(0);
        const writerSeq = (0, import_react.useRef)(0);
        const volumeSeq = (0, import_react.useRef)(0);
        const loadedSummaryFor = (0, import_react.useRef)(void 0);
        const loadedWriterFor = (0, import_react.useRef)(void 0);
        const loadVolumes = (0, import_react.useCallback)(async () => {
          if (novelId === null) return;
          const seq = ++volumeSeq.current;
          try {
            const result = await call("volumes", { novelId });
            if (seq !== volumeSeq.current) return;
            setVolumes(result.volumes);
          } catch (cause) {
            if (seq === volumeSeq.current) notify("error", causeText(cause));
          }
        }, [call, novelId, notify]);
        const loadSummary = (0, import_react.useCallback)(async () => {
          if (chapterId === null) {
            loadedSummaryFor.current = null;
            setSummary(null);
            setSummaryForm({ summary: "", keyEvents: "", cliffhanger: "" });
            return;
          }
          const target = chapterId;
          const seq = ++summarySeq.current;
          setLoadingSummary(true);
          try {
            const result = await call("chapterSummary", { chapterId: target });
            if (seq !== summarySeq.current) return;
            setSummary(result.summary);
            setSummaryForm({
              summary: result.summary.summary ?? "",
              keyEvents: result.summary.keyEvents ?? "",
              cliffhanger: result.summary.cliffhanger ?? ""
            });
            loadedSummaryFor.current = target;
          } catch (cause) {
            if (seq === summarySeq.current) notify("error", causeText(cause));
          } finally {
            if (seq === summarySeq.current) setLoadingSummary(false);
          }
        }, [call, chapterId, notify]);
        const loadWriter = (0, import_react.useCallback)(async () => {
          if (novelId === null) return;
          const target = novelId;
          const seq = ++writerSeq.current;
          setLoadingWriter(true);
          try {
            const result = await call("writerState", { novelId: target });
            if (seq !== writerSeq.current) return;
            setWriterState(result.writerState);
            setWriterForm({
              progress: result.writerState.progress ?? "",
              foreshadowing: result.writerState.foreshadowing ?? "[]"
            });
            loadedWriterFor.current = target;
          } catch (cause) {
            if (seq === writerSeq.current) notify("error", causeText(cause));
          } finally {
            if (seq === writerSeq.current) setLoadingWriter(false);
          }
        }, [call, novelId, notify]);
        (0, import_react.useEffect)(() => {
          volumeSeq.current += 1;
          summarySeq.current += 1;
          writerSeq.current += 1;
          loadedSummaryFor.current = void 0;
          loadedWriterFor.current = void 0;
          setVolumes(null);
          setVolumeForm(null);
          setSummary(null);
          setSummaryForm({ summary: "", keyEvents: "", cliffhanger: "" });
          setWriterState(null);
          setWriterForm({ progress: "", foreshadowing: "[]" });
          setLoadingSummary(false);
          setLoadingWriter(false);
        }, [novelId]);
        (0, import_react.useEffect)(() => {
          summarySeq.current += 1;
          loadedSummaryFor.current = void 0;
          setSummary(null);
          setSummaryForm({ summary: "", keyEvents: "", cliffhanger: "" });
          setLoadingSummary(false);
        }, [chapterId]);
        (0, import_react.useEffect)(() => {
          if (active) void loadVolumes();
        }, [active, loadVolumes]);
        (0, import_react.useEffect)(() => {
          if (active && loadedSummaryFor.current !== chapterId) void loadSummary();
        }, [active, chapterId, loadSummary]);
        (0, import_react.useEffect)(() => {
          if (active && loadedWriterFor.current !== novelId) void loadWriter();
        }, [active, novelId, loadWriter]);
        const startVolume = (row) => setVolumeForm(row ? { id: row.id, token: row.token ?? null, title: row.title, summary: row.summary, coreConflict: row.coreConflict } : { id: null, token: null, title: "", summary: "", coreConflict: "" });
        const submitVolume = async () => {
          if (!volumeForm || busy) return;
          if (!volumeForm.title.trim()) {
            notify("error", t("titleRequired"));
            return;
          }
          setBusy(true);
          try {
            const payload = { novelId, title: volumeForm.title, summary: volumeForm.summary, coreConflict: volumeForm.coreConflict };
            if (volumeForm.id === null) await call("createVolume", payload);
            else await call("updateVolume", { volumeId: volumeForm.id, ...payload, expectedToken: volumeForm.token ?? void 0 });
            await loadVolumes();
            setVolumeForm(null);
            notify("info", t("savedNotice"));
          } catch (cause) {
            if (cause?.code === "ENTITY_CONFLICT") {
              notify("error", t("entityConflict"));
              setVolumeForm(null);
              void loadVolumes();
            } else {
              notify("error", causeText(cause));
            }
          } finally {
            setBusy(false);
          }
        };
        const submitSummary = async () => {
          if (busy || loadingSummary || chapterId === null) return;
          setBusy(true);
          try {
            await call("updateChapterSummary", { chapterId, ...summaryForm, expectedToken: summary?.token ?? void 0 });
            await loadSummary();
            notify("info", t("savedNotice"));
          } catch (cause) {
            if (cause?.code === "ENTITY_CONFLICT") {
              notify("error", t("entityConflict"));
              void loadSummary();
            } else {
              notify("error", causeText(cause));
            }
          } finally {
            setBusy(false);
          }
        };
        const submitWriter = async () => {
          if (busy || loadingWriter) return;
          try {
            JSON.parse(writerForm.foreshadowing);
          } catch {
            notify("error", t("foreshadowingInvalid"));
            return;
          }
          setBusy(true);
          try {
            await call("updateWriterState", { novelId, ...writerForm, expectedToken: writerState?.token ?? void 0 });
            await loadWriter();
            notify("info", t("savedNotice"));
          } catch (cause) {
            if (cause?.code === "ENTITY_CONFLICT") {
              notify("error", t("entityConflict"));
              void loadWriter();
            } else {
              notify("error", causeText(cause));
            }
          } finally {
            setBusy(false);
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-pane" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-section-title" }, t("volumes")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: () => startVolume(null) }, "\uFF0B ", t("volumeNew"))), volumes === null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("loading")), volumes !== null && volumes.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("emptyVolumes")), (volumes ?? []).map((row) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card", key: row.id }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("h4", null, row.title), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: () => startVolume(row) }, t("edit"))), row.summary && /* @__PURE__ */ import_react.default.createElement("p", null, row.summary), row.coreConflict && /* @__PURE__ */ import_react.default.createElement("p", null, t("volumeConflict"), "\uFF1A", row.coreConflict))), volumeForm && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("volumeTitle") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: volumeForm.title, onChange: (event) => setVolumeForm((current) => ({ ...current, title: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("volumeSummary") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 3, value: volumeForm.summary, onChange: (event) => setVolumeForm((current) => ({ ...current, summary: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("volumeConflict") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: volumeForm.coreConflict, onChange: (event) => setVolumeForm((current) => ({ ...current, coreConflict: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy, onClick: () => void submitVolume() }, t("save")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => setVolumeForm(null) }, t("cancel")))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-section-title" }, t("chapterSummary")), chapterId === null ? /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("noChapterHint")) : /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("summaryText") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 3, value: summaryForm.summary, onChange: (event) => setSummaryForm((current) => ({ ...current, summary: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("keyEvents") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 2, value: summaryForm.keyEvents, onChange: (event) => setSummaryForm((current) => ({ ...current, keyEvents: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("cliffhanger") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 2, value: summaryForm.cliffhanger, onChange: (event) => setSummaryForm((current) => ({ ...current, cliffhanger: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: !writable || busy || loadingSummary, onClick: () => void submitSummary() }, t("save")), summary?.exists && /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("updatedAt"), " ", summary.updatedAt))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-section-title" }, t("writerState")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("progress") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 3, value: writerForm.progress, onChange: (event) => setWriterForm((current) => ({ ...current, progress: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("foreshadowing") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea mono", rows: 5, value: writerForm.foreshadowing, onChange: (event) => setWriterForm((current) => ({ ...current, foreshadowing: event.target.value })) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: !writable || busy || loadingWriter, onClick: () => void submitWriter() }, t("save")), writerState?.exists && /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("updatedAt"), " ", writerState.updatedAt))));
      }
      function SearchTab({ call, novelId, writable, active, notify, onOpenChapter, t }) {
        const [query, setQuery] = (0, import_react.useState)("");
        const [result, setResult] = (0, import_react.useState)(null);
        const [hits, setHits] = (0, import_react.useState)(null);
        const [stats, setStats] = (0, import_react.useState)(null);
        const [busy, setBusy] = (0, import_react.useState)(false);
        (0, import_react.useEffect)(() => {
          setResult(null);
          setHits(null);
          setStats(null);
        }, [novelId]);
        const loadStats = (0, import_react.useCallback)(async () => {
          if (novelId === null) return;
          try {
            setStats(await call("kbStats", { novelId }));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, novelId, notify]);
        (0, import_react.useEffect)(() => {
          if (active) void loadStats();
        }, [active, loadStats]);
        const run = async () => {
          const text = query.trim();
          if (!text || novelId === null || busy) return;
          setBusy(true);
          try {
            const [keyword, kb] = await Promise.all([
              call("search", { query: text, novelId }),
              call("kbQuery", { novelId, query: text, limit: 10 })
            ]);
            setResult(keyword);
            setHits(kb.hits);
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const reindex = async () => {
          if (!window.confirm(t("confirmReindex"))) return;
          try {
            setStats(await call("reindexNovel", { novelId }));
            notify("info", t("reindexedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-pane" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            className: "qibi-input",
            value: query,
            placeholder: t("searchPlaceholder"),
            onChange: (event) => setQuery(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") void run();
            }
          }
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy || !query.trim(), onClick: () => void run() }, t("search"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, stats ? `${t("kbStatsLabel")} ${stats.chunks}` : "", stats?.lastIndexed ? ` \xB7 ${t("updatedAt")} ${stats.lastIndexed}` : ""), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || busy, onClick: () => void reindex() }, t("reindex"))), result && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-section-title" }, t("searchKeyword")), result.chapters.length === 0 && result.characters.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("searchEmpty")), result.chapters.map((hit) => /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-result", key: `c${hit.id}`, onClick: () => onOpenChapter(hit.novelId, hit.id) }, /* @__PURE__ */ import_react.default.createElement("strong", null, hit.title), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, formatWords(hit.wordCount), " ", t("words")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-snippet" }, hit.snippet))), result.characters.map((hit) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-result", key: `p${hit.id}` }, /* @__PURE__ */ import_react.default.createElement("strong", null, hit.name, hit.role ? ` \xB7 ${hit.role}` : ""), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-snippet" }, hit.background)))), hits && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-section-title" }, t("searchKb")), hits.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("searchEmpty")), hits.map((hit, index) => {
          const openable = hit.kind === "chapter" && hit.sourceId !== null;
          return /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "qibi-result",
              key: `k${index}`,
              style: openable ? void 0 : { cursor: "default" },
              onClick: openable ? () => onOpenChapter(novelId, hit.sourceId) : void 0
            },
            /* @__PURE__ */ import_react.default.createElement("strong", null, hit.title),
            /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, hit.score),
            /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-snippet" }, hit.content)
          );
        })));
      }
      function RevisionsTab({ call, chapterId, writable, active, notify, onRestored, guard, t }) {
        const [revisions, setRevisions] = (0, import_react.useState)(null);
        const [busy, setBusy] = (0, import_react.useState)(false);
        const [error, setError] = (0, import_react.useState)(null);
        const load = (0, import_react.useCallback)(async () => {
          if (chapterId === null) {
            setRevisions(null);
            return;
          }
          try {
            const result = await call("revisions", { chapterId });
            setRevisions(result.revisions);
            setError(null);
          } catch (cause) {
            setError(causeText(cause));
          }
        }, [call, chapterId]);
        (0, import_react.useEffect)(() => {
          setError(null);
        }, [chapterId]);
        (0, import_react.useEffect)(() => {
          if (active) void load();
        }, [active, load]);
        const restore = async (row) => {
          if (guard) {
            const ok = await guard();
            if (!ok) return;
          }
          if (!window.confirm(t("confirmRestore"))) return;
          setBusy(true);
          try {
            const result = await call("restoreRevision", { chapterId, revisionId: row.id });
            notify("info", t("restoredNotice"));
            await load();
            if (onRestored) await onRestored(result.chapter);
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-pane" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-section-title" }, t("tabRevisions")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => void load() }, t("refresh"))), chapterId === null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("noChapterHint")), chapterId !== null && error && /* @__PURE__ */ import_react.default.createElement(LoadError, { message: error, onRetry: () => void load(), t }), chapterId !== null && !error && revisions === null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("loading")), !error && revisions !== null && revisions.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("revisionsEmpty")), /* @__PURE__ */ import_react.default.createElement("span", null, t("revisionsEmptyHint"))), !error && (revisions ?? []).map((row) => /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card", key: row.id }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("h4", null, "#", row.id, " \xB7 ", row.title || t("untitled")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, row.createdAt), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, formatWords(row.wordCount), " ", t("words")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || busy, onClick: () => void restore(row) }, t("restore"))), /* @__PURE__ */ import_react.default.createElement("p", null, row.reason || "\u2014"))));
      }
      function ExportTab({ call, novelId, notify, t }) {
        const [format, setFormat] = (0, import_react.useState)("markdown");
        const [onlyPublished, setOnlyPublished] = (0, import_react.useState)(false);
        const [result, setResult] = (0, import_react.useState)(null);
        const [busy, setBusy] = (0, import_react.useState)(false);
        (0, import_react.useEffect)(() => {
          setResult(null);
        }, [novelId]);
        const generate = async () => {
          if (novelId === null || busy) return;
          setBusy(true);
          try {
            setResult(await call("export", { novelId, format, onlyPublished }));
          } catch (cause) {
            notify("error", causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const download = () => {
          if (!result) return;
          const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = result.filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1e3);
        };
        const copy = async () => {
          if (!result) return;
          try {
            await navigator.clipboard.writeText(result.content);
            notify("info", t("exportCopied"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        };
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-pane" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("exportFormat") }, /* @__PURE__ */ import_react.default.createElement("select", { className: "qibi-select", value: format, onChange: (event) => setFormat(event.target.value) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "markdown" }, "Markdown"), /* @__PURE__ */ import_react.default.createElement("option", { value: "txt" }, "TXT"))), /* @__PURE__ */ import_react.default.createElement("label", { className: "qibi-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "checkbox", checked: onlyPublished, onChange: (event) => setOnlyPublished(event.target.checked) }), t("exportOnlyPublished")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy || novelId === null, onClick: () => void generate() }, t("exportGenerate"))), result && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, result.filename, " \xB7 ", result.chapters, " ", t("chapters"), " \xB7 ", formatWords(result.wordCount), " ", t("words")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => void copy() }, t("exportCopy")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", onClick: download }, t("exportDownload"))), /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea preview mono", readOnly: true, value: result.content })));
      }
      function dataSettingsPayload({ dataDir, mode, userId }, info) {
        const target = String(dataDir ?? "").trim();
        const payload = { dataDir: target, mode };
        const sameDirectory = target === String(info?.dataDir ?? "").trim();
        const id = Number(userId);
        if (mode === "existing" && sameDirectory && Array.isArray(info?.users) && info.users.some((row) => row.id === id && !row.disabled)) payload.userId = id;
        return payload;
      }
      function DataSettings({ call, t, initialSettings, onBeforeSave, onSaved, onCancel }) {
        const [info, setInfo] = (0, import_react.useState)(() => initialSettings ?? null);
        const [dataDir, setDataDir] = (0, import_react.useState)(() => initialSettings?.dataDir || initialSettings?.defaultDataDir || "");
        const [mode, setMode] = (0, import_react.useState)(() => initialSettings?.exists === true ? "existing" : "create");
        const [userId, setUserId] = (0, import_react.useState)(() => initialSettings?.userId == null ? "" : String(initialSettings.userId));
        const [loading, setLoading] = (0, import_react.useState)(() => !initialSettings);
        const [busy, setBusy] = (0, import_react.useState)(false);
        const [error, setError] = (0, import_react.useState)("");
        const load = (0, import_react.useCallback)(async () => {
          setLoading(true);
          setError("");
          try {
            const result = await call("dataSettings", {});
            setInfo(result);
            setDataDir((previous) => previous || result?.dataDir || result?.defaultDataDir || "");
            if (typeof result?.exists === "boolean") setMode(result.exists ? "existing" : "create");
            setUserId((previous) => previous || (result?.userId == null ? "" : String(result.userId)));
          } catch (cause) {
            setError(causeText(cause));
          } finally {
            setLoading(false);
          }
        }, [call]);
        (0, import_react.useEffect)(() => {
          if (!initialSettings) void load();
        }, [initialSettings, load]);
        const pick2 = async () => {
          if (!info?.canPick || busy) return;
          setError("");
          try {
            const result = await call("pickDataDir", {});
            if (result?.path) {
              setDataDir(result.path);
              setUserId("");
            }
          } catch (cause) {
            setError(causeText(cause));
          }
        };
        const save = async () => {
          if (busy || !info?.canSave || !dataDir.trim()) return;
          setBusy(true);
          setError("");
          try {
            if (onBeforeSave && !await onBeforeSave()) return;
            const payload = dataSettingsPayload({ dataDir, mode, userId }, info);
            const result = await call("saveDataSettings", payload);
            if (onSaved) await onSaved(result);
          } catch (cause) {
            setError(causeText(cause));
          } finally {
            setBusy(false);
          }
        };
        const users = Array.isArray(info?.users) ? info.users : [];
        const sameDirectory = Boolean(info?.dataDir) && dataDir.trim() === String(info.dataDir).trim();
        const availableUsers = sameDirectory ? users : [];
        const currentPath = info?.dbPath || info?.dataDir || "";
        const cannotSaveReason = info?.canSaveReason || info?.reason || info?.error || t("dataSettingsCannotSave");
        return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form qibi-data-settings" }, loading && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-sub" }, t("loading")), !loading && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-field" }, /* @__PURE__ */ import_react.default.createElement("label", { className: "qibi-label", htmlFor: "qibi-data-directory" }, t("dataSettingsDirectory")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            id: "qibi-data-directory",
            className: "qibi-input",
            value: dataDir,
            onChange: (event) => {
              setDataDir(event.target.value);
              setUserId("");
            },
            placeholder: info?.defaultDataDir || "",
            disabled: busy
          }
        ), info?.canPick && /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: busy, onClick: () => void pick2() }, t("dataSettingsBrowse")))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-field" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-label" }, t("dataSettingsMode")), /* @__PURE__ */ import_react.default.createElement("label", { className: "qibi-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "radio", name: "qibi-data-mode", value: "create", checked: mode === "create", disabled: busy, onChange: () => setMode("create") }), t("dataSettingsCreate")), mode === "create" && /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("dataSettingsModeHintCreate")), /* @__PURE__ */ import_react.default.createElement("label", { className: "qibi-check" }, /* @__PURE__ */ import_react.default.createElement("input", { type: "radio", name: "qibi-data-mode", value: "existing", checked: mode === "existing", disabled: busy, onChange: () => setMode("existing") }), t("dataSettingsExisting")), mode === "existing" && /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("dataSettingsModeHintExisting"))), mode === "existing" && availableUsers.length > 0 && /* @__PURE__ */ import_react.default.createElement(Field, { label: t("dataSettingsUser") }, /* @__PURE__ */ import_react.default.createElement("select", { className: "qibi-select", value: userId, disabled: busy, onChange: (event) => setUserId(event.target.value) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "" }, t("dataSettingsUserDefault")), availableUsers.map((user) => /* @__PURE__ */ import_react.default.createElement("option", { key: user.id, value: String(user.id) }, user.username || user.name || `#${user.id}`)))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card qibi-data-settings-current" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("dataSettingsCurrent")), /* @__PURE__ */ import_react.default.createElement("span", null, currentPath || t("dataSettingsNoCurrent")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("dataSettingsNoMove"))), info?.canSave === false && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-error-text" }, cannotSaveReason), error && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-error-text" }, error, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: busy, onClick: () => void load() }, t("retry"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions" }, onCancel && /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: busy, onClick: onCancel }, t("cancel")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: busy || loading || info?.canSave !== true || !dataDir.trim(), onClick: () => void save() }, busy ? t("saving") : t("dataSettingsSave")))), !loading && !info && !error && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-error-text" }, t("dataSettingsLoadFailed")));
      }
      function Workbench({ call, t }) {
        const [status, setStatus] = (0, import_react.useState)(null);
        const [phase, setPhase] = (0, import_react.useState)("loading");
        const [error, setError] = (0, import_react.useState)(null);
        const [loadEpoch, setLoadEpoch] = (0, import_react.useState)(0);
        const [dataSettingsOpen, setDataSettingsOpen] = (0, import_react.useState)(false);
        const [novels, setNovels] = (0, import_react.useState)([]);
        const [novelId, setNovelId] = (0, import_react.useState)(null);
        const [chapters, setChapters] = (0, import_react.useState)([]);
        const [chapterId, setChapterId] = (0, import_react.useState)(null);
        const [chapter, setChapter] = (0, import_react.useState)(null);
        const [draft, setDraft] = (0, import_react.useState)("");
        const [dirty, setDirty] = (0, import_react.useState)(false);
        const [saveState, setSaveState] = (0, import_react.useState)("idle");
        const [conflict, setConflict] = (0, import_react.useState)(null);
        const [characters, setCharacters] = (0, import_react.useState)([]);
        const [cast, setCast] = (0, import_react.useState)([]);
        const [tab, setTab] = (0, import_react.useState)("body");
        const [writable, setWritable] = (0, import_react.useState)(false);
        const [creating, setCreating] = (0, import_react.useState)(false);
        const [newTitle, setNewTitle] = (0, import_react.useState)("");
        const [notice, setNotice] = (0, import_react.useState)(null);
        const [novelDialog, setNovelDialog] = (0, import_react.useState)(null);
        const [chapterDialog, setChapterDialog] = (0, import_react.useState)(null);
        const [aiInfo, setAiInfo] = (0, import_react.useState)(null);
        const [aiInfoLoading, setAiInfoLoading] = (0, import_react.useState)(false);
        const aiInfoSequence = (0, import_react.useRef)(0);
        const [aiOpen, setAiOpen] = (0, import_react.useState)(false);
        const [aiSelection, setAiSelection] = (0, import_react.useState)(null);
        const [aiInitialMode, setAiInitialMode] = (0, import_react.useState)(null);
        const [findOpen, setFindOpen] = (0, import_react.useState)(false);
        const [findQuery, setFindQuery] = (0, import_react.useState)("");
        const [findReplace, setFindReplace] = (0, import_react.useState)("");
        const [findIndex, setFindIndex] = (0, import_react.useState)(0);
        const [contextMenu, setContextMenu] = (0, import_react.useState)(null);
        const [novelQuery, setNovelQuery] = (0, import_react.useState)("");
        const [chapterQuery, setChapterQuery] = (0, import_react.useState)("");
        const [chapterMenu, setChapterMenu] = (0, import_react.useState)(false);
        const [zen, setZen] = (0, import_react.useState)(() => readFlag("qibi:zen"));
        const [outlines, setOutlines] = (0, import_react.useState)([]);
        const [outlineMarkers, setOutlineMarkers] = (0, import_react.useState)(() => readJson("qibi:outline-markers", {}));
        const [markerEditing, setMarkerEditing] = (0, import_react.useState)(null);
        const editorRef = (0, import_react.useRef)(null);
        const dirtyRef = (0, import_react.useRef)(false);
        const chapterRef = (0, import_react.useRef)(null);
        const draftRef = (0, import_react.useRef)("");
        const revRef = (0, import_react.useRef)(0);
        const chapterIdRef = (0, import_react.useRef)(null);
        const saveInFlightRef = (0, import_react.useRef)(null);
        const historyRef = (0, import_react.useRef)(createHistory());
        const tabRef = (0, import_react.useRef)("body");
        (0, import_react.useEffect)(() => {
          dirtyRef.current = dirty;
        }, [dirty]);
        (0, import_react.useEffect)(() => {
          chapterRef.current = chapter;
        }, [chapter]);
        (0, import_react.useEffect)(() => {
          draftRef.current = draft;
        }, [draft]);
        (0, import_react.useEffect)(() => {
          chapterIdRef.current = chapterId;
        }, [chapterId]);
        (0, import_react.useEffect)(() => {
          tabRef.current = tab;
        }, [tab]);
        const notify = (0, import_react.useCallback)((kind, text) => setNotice({ kind, text }), []);
        const retryStatus = (0, import_react.useCallback)(() => {
          chapterRef.current = null;
          chapterIdRef.current = null;
          draftRef.current = "";
          dirtyRef.current = false;
          setStatus(null);
          setError(null);
          setNovels([]);
          setNovelId(null);
          setChapters([]);
          setChapterId(null);
          setChapter(null);
          setDraft("");
          setDirty(false);
          setConflict(null);
          setSaveState("idle");
          setPhase("loading");
          setLoadEpoch((value) => value + 1);
        }, []);
        (0, import_react.useEffect)(() => {
          if (!notice || notice.kind === "error") return void 0;
          const timer = setTimeout(() => setNotice(null), 5e3);
          return () => clearTimeout(timer);
        }, [notice]);
        (0, import_react.useEffect)(() => {
          writeFlag("qibi:zen", zen);
        }, [zen]);
        (0, import_react.useEffect)(() => {
          const onKey = (event) => {
            if (!event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key !== "f" && event.key !== "F") return;
            event.preventDefault();
            setZen((value) => !value);
            setTab("body");
          };
          window.addEventListener("keydown", onKey, true);
          return () => window.removeEventListener("keydown", onKey, true);
        }, []);
        (0, import_react.useEffect)(() => {
          let cancelled = false;
          (async () => {
            try {
              const info = await call("aiInfo", {});
              if (!cancelled) setAiInfo(info);
            } catch {
            }
          })();
          return () => {
            cancelled = true;
          };
        }, [call]);
        (0, import_react.useEffect)(() => {
          if (novelId === null) {
            setCharacters([]);
            return void 0;
          }
          let cancelled = false;
          (async () => {
            try {
              const result = await call("characters", { novelId });
              if (!cancelled) setCharacters(result.characters ?? []);
            } catch {
              if (!cancelled) setCharacters([]);
            }
          })();
          return () => {
            cancelled = true;
          };
        }, [call, novelId]);
        (0, import_react.useEffect)(() => {
          const timer = setTimeout(() => {
            if (!draft || characters.length === 0) {
              setCast([]);
              return;
            }
            const rows = [];
            for (const row of characters) {
              const names = [row.name, ...String(row.alias ?? "").split(/[,，、;；\s]+/)].map((name) => String(name ?? "").trim()).filter(Boolean);
              let count = 0;
              for (const name of names) {
                let at = draft.indexOf(name);
                while (at !== -1) {
                  count += 1;
                  at = draft.indexOf(name, at + name.length);
                }
              }
              if (count > 0) rows.push({ id: row.id, name: row.name, alias: row.alias, count });
            }
            rows.sort((a, b) => b.count - a.count);
            setCast(rows.slice(0, 12));
          }, 400);
          return () => clearTimeout(timer);
        }, [draft, characters]);
        (0, import_react.useEffect)(() => {
          if (novelId === null) {
            setOutlines([]);
            return void 0;
          }
          if (tab !== "body") return void 0;
          let cancelled = false;
          (async () => {
            try {
              const result = await call("outline", { novelId });
              if (!cancelled) setOutlines(result.outline ?? []);
            } catch {
              if (!cancelled) setOutlines([]);
            }
          })();
          return () => {
            cancelled = true;
          };
        }, [call, novelId, tab]);
        (0, import_react.useEffect)(() => {
          writeJson("qibi:outline-markers", outlineMarkers);
        }, [outlineMarkers]);
        (0, import_react.useEffect)(() => {
          if (!contextMenu) return void 0;
          const close = () => setContextMenu(null);
          window.addEventListener("click", close);
          window.addEventListener("keydown", close);
          return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("keydown", close);
          };
        }, [contextMenu]);
        (0, import_react.useEffect)(() => {
          if (!chapterMenu) return void 0;
          const close = () => setChapterMenu(false);
          window.addEventListener("click", close);
          return () => window.removeEventListener("click", close);
        }, [chapterMenu]);
        const adoptChapter = (0, import_react.useCallback)((next) => {
          setChapter(next);
          setDraft(next.content);
          setDirty(false);
          setConflict(null);
          setSaveState("idle");
          historyRef.current = { ...createHistory(), lastText: next.content };
          setChapters((previous) => previous.map((row) => row.id === next.id ? { ...row, title: next.title, status: next.status, wordCount: next.wordCount, updatedAt: next.updatedAt } : row));
        }, []);
        const refreshNovels = (0, import_react.useCallback)(async (preferred) => {
          const list = await call("novels", {});
          setNovels(list.novels);
          if (list.novels.length === 0) {
            setNovelId(null);
            setPhase("empty");
            return [];
          }
          setNovelId((previous) => {
            const wanted = preferred !== void 0 ? preferred : previous;
            return wanted !== null && list.novels.some((row) => row.id === wanted) ? wanted : list.novels[0].id;
          });
          setPhase("ready");
          return list.novels;
        }, [call]);
        const refreshChapters = (0, import_react.useCallback)(async (targetNovelId, preferred) => {
          const id = targetNovelId !== void 0 && targetNovelId !== null ? targetNovelId : novelId;
          if (id === null) {
            setChapters([]);
            setChapterId(null);
            return [];
          }
          const result = await call("chapters", { novelId: id });
          setChapters(result.chapters);
          setChapterId((previous) => {
            const wanted = preferred !== void 0 ? preferred : previous;
            return wanted !== null && result.chapters.some((row) => row.id === wanted) ? wanted : result.chapters[0]?.id ?? null;
          });
          return result.chapters;
        }, [call, novelId]);
        (0, import_react.useEffect)(() => {
          let cancelled = false;
          (async () => {
            try {
              const next = await call("status", {});
              if (cancelled) return;
              setStatus(next);
              setWritable(next.writable);
              if (!next.exists) {
                setPhase("nodb");
                return;
              }
              if (next.error) {
                setError(next.error);
                setPhase("error");
                return;
              }
              const list = await call("novels", {});
              if (cancelled) return;
              setNovels(list.novels);
              if (list.novels.length === 0) {
                setPhase("empty");
                return;
              }
              setNovelId((previous) => previous ?? list.novels[0].id);
              setPhase("ready");
            } catch (cause) {
              if (cancelled) return;
              setError({ message: causeText(cause) });
              setPhase("error");
            }
          })();
          return () => {
            cancelled = true;
          };
        }, [call, loadEpoch]);
        (0, import_react.useEffect)(() => {
          if (novelId === null) return;
          let cancelled = false;
          (async () => {
            try {
              const result = await call("chapters", { novelId });
              if (cancelled) return;
              setChapters(result.chapters);
              setChapterId((previous) => previous !== null && result.chapters.some((row) => row.id === previous) ? previous : result.chapters[0]?.id ?? null);
            } catch (cause) {
              if (!cancelled) notify("error", causeText(cause));
            }
          })();
          return () => {
            cancelled = true;
          };
        }, [call, novelId, notify]);
        (0, import_react.useEffect)(() => {
          if (chapterId === null) {
            chapterRef.current = null;
            draftRef.current = "";
            setChapter(null);
            setDraft("");
            setDirty(false);
            return;
          }
          chapterRef.current = null;
          draftRef.current = "";
          setChapter(null);
          setDraft("");
          setDirty(false);
          setConflict(null);
          setSaveState("idle");
          let cancelled = false;
          (async () => {
            try {
              const [loaded] = await Promise.all([
                call("chapter", { chapterId }),
                call("select", { novelId, chapterId }).catch(() => null)
              ]);
              if (cancelled) return;
              setChapter(loaded.chapter);
              setDraft(loaded.chapter.content);
              setDirty(false);
              setSaveState("idle");
              setConflict(null);
            } catch (cause) {
              if (!cancelled) notify("error", causeText(cause));
            }
          })();
          return () => {
            cancelled = true;
          };
        }, [call, chapterId, novelId, notify]);
        const save = (0, import_react.useCallback)(async (options = {}) => {
          if (options.force !== true && saveInFlightRef.current) {
            const previous = await saveInFlightRef.current.catch(() => false);
            if (!previous) return false;
            if (!dirtyRef.current) return true;
          }
          const current = chapterRef.current;
          if (!current || !writable) return false;
          const content = draftRef.current;
          setSaveState("saving");
          const task = (async () => {
            try {
              const result = await call("save", {
                chapterId: current.id,
                content,
                // 强乐观锁：内容+时间戳的令牌；同一秒内的并发覆盖也能发现。
                expectedToken: options.force === true ? void 0 : current.token
              });
              const unchanged = draftRef.current === content;
              if (chapterIdRef.current === result.chapter.id) {
                chapterRef.current = result.chapter;
                setChapter(result.chapter);
                if (unchanged) {
                  setDirty(false);
                  setConflict(null);
                  setSaveState("saved");
                } else {
                  setSaveState("idle");
                }
              } else {
                setSaveState("idle");
              }
              setChapters((previous) => previous.map((row) => row.id === result.chapter.id ? { ...row, title: result.chapter.title, status: result.chapter.status, wordCount: result.chapter.wordCount, updatedAt: result.chapter.updatedAt } : row));
              setNovels((previous) => previous.map((row) => row.id === current.novelId ? { ...row, wordCount: row.wordCount - current.wordCount + result.chapter.wordCount } : row));
              return true;
            } catch (cause) {
              if (cause?.code === "CHAPTER_CONFLICT") {
                if (chapterIdRef.current === current.id) {
                  setConflict({ currentUpdatedAt: cause.details?.currentUpdatedAt ?? null });
                }
                setSaveState("idle");
                return false;
              }
              setSaveState("error");
              notify("error", causeText(cause));
              return false;
            }
          })();
          saveInFlightRef.current = task;
          try {
            return await task;
          } finally {
            if (saveInFlightRef.current === task) saveInFlightRef.current = null;
          }
        }, [call, notify, writable]);
        (0, import_react.useEffect)(() => {
          if (!dirty || conflict || !writable || chapter === null) return void 0;
          const timer = setTimeout(() => {
            void save();
          }, 900);
          return () => clearTimeout(timer);
        }, [draft, dirty, conflict, writable, chapter, save]);
        (0, import_react.useEffect)(() => {
          let cancelled = false;
          let running = false;
          const timer = setInterval(async () => {
            if (running) return;
            if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
            running = true;
            try {
              const pulse = await call("pulse", {});
              if (cancelled) return;
              setWritable(pulse.writable);
              if (pulse.rev === revRef.current) return;
              revRef.current = pulse.rev;
              if (["outline", "characters", "continuity"].includes(tabRef.current)) {
                notify("info", t("externalChange"));
              }
              if (novelId === null) return;
              const [list, novelList] = await Promise.all([
                call("chapters", { novelId }),
                call("novels", {})
              ]);
              if (cancelled) return;
              setChapters(list.chapters);
              setNovels(novelList.novels);
              const target = chapterRef.current?.id ?? chapterId;
              if (target && !list.chapters.some((row) => row.id === target)) {
                chapterRef.current = null;
                chapterIdRef.current = null;
                setChapterId(null);
                setChapter(null);
                setDraft("");
                return;
              }
              if (target) {
                const loaded = await call("chapter", { chapterId: target });
                if (cancelled || chapterRef.current?.id !== target) return;
                const current = chapterRef.current;
                if (!current || loaded.chapter.token !== current.token) {
                  if (!dirtyRef.current) {
                    adoptChapter(loaded.chapter);
                  } else {
                    notify("info", t("externalChange"));
                  }
                }
              }
            } catch {
            } finally {
              running = false;
            }
          }, 2500);
          return () => {
            cancelled = true;
            clearInterval(timer);
          };
        }, [adoptChapter, call, chapterId, notify, novelId, t]);
        const guardDirty = (0, import_react.useCallback)(async () => {
          if (saveInFlightRef.current) {
            const ok = await saveInFlightRef.current.catch(() => false);
            if (!ok) return false;
          }
          if (!dirtyRef.current) return true;
          return save();
        }, [save]);
        const beforeDataSettingsSave = (0, import_react.useCallback)(async () => {
          const ok = await guardDirty();
          if (!ok) return false;
          if (["outline", "characters", "continuity"].includes(tab)) {
            return window.confirm(t("dataSettingsInfoPageConfirm"));
          }
          return true;
        }, [guardDirty, tab, t]);
        const finishDataSettingsSave = (0, import_react.useCallback)(() => {
          setDataSettingsOpen(false);
          retryStatus();
        }, [retryStatus]);
        const chooseNovel = (0, import_react.useCallback)(async (id) => {
          if (id === novelId) return;
          const ok = await guardDirty();
          if (!ok) return;
          chapterRef.current = null;
          chapterIdRef.current = null;
          draftRef.current = "";
          setNovelId(id);
          setChapterId(null);
          setChapter(null);
          setDraft("");
          setDirty(false);
          setCreating(false);
          setNewTitle("");
          setTab("body");
        }, [guardDirty, novelId]);
        const chooseChapter = (0, import_react.useCallback)(async (id) => {
          if (id === chapterId) return;
          const ok = await guardDirty();
          if (!ok) return;
          chapterRef.current = null;
          chapterIdRef.current = id;
          draftRef.current = "";
          setChapter(null);
          setDraft("");
          setDirty(false);
          setConflict(null);
          setSaveState("idle");
          setChapterId(id);
        }, [chapterId, guardDirty]);
        const reload = (0, import_react.useCallback)(async (options = {}) => {
          if (chapterId === null) return;
          if (options.force !== true) {
            const ok = await guardDirty();
            if (!ok) return;
          }
          setConflict(null);
          setNotice(null);
          try {
            const loaded = await call("chapter", { chapterId });
            adoptChapter(loaded.chapter);
            await refreshChapters(novelId, chapterId);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [adoptChapter, call, chapterId, guardDirty, novelId, notify, refreshChapters]);
        const toggleWritable = (0, import_react.useCallback)(async () => {
          if (writable && dirtyRef.current) {
            const ok = await save();
            if (!ok) return;
          }
          try {
            const result = await call("writable", { writable: !writable });
            setWritable(result.writable);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, notify, save, writable]);
        const createChapter = (0, import_react.useCallback)(async () => {
          const title = newTitle.trim();
          if (!title || novelId === null) return;
          try {
            const result = await call("createChapter", { novelId, title });
            setCreating(false);
            setNewTitle("");
            await refreshChapters(novelId, result.chapter.id);
            await refreshNovels(novelId);
            setTab("body");
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, newTitle, novelId, notify, refreshChapters, refreshNovels]);
        const moveChapter = (0, import_react.useCallback)(async (direction) => {
          const current = chapterRef.current;
          if (!current) return;
          try {
            await call("moveChapter", { chapterId: current.id, direction });
            await refreshChapters(novelId, current.id);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, novelId, notify, refreshChapters]);
        const openChapterEdit = (0, import_react.useCallback)(async () => {
          const current = chapterRef.current;
          if (!current) return;
          const ok = await guardDirty();
          if (!ok) return;
          setChapterDialog({ form: { title: current.title, status: current.status || "\u8349\u7A3F" }, busy: false });
        }, [guardDirty]);
        const submitChapter = (0, import_react.useCallback)(async () => {
          const current = chapterRef.current;
          if (!current || !chapterDialog || chapterDialog.busy) return;
          if (!chapterDialog.form.title.trim()) {
            notify("error", t("titleRequired"));
            return;
          }
          setChapterDialog((previous) => previous ? { ...previous, busy: true } : previous);
          try {
            const result = await call("updateChapter", {
              chapterId: current.id,
              title: chapterDialog.form.title,
              status: chapterDialog.form.status
            });
            adoptChapter(result.chapter);
            setChapterDialog(null);
            notify("info", t("savedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
            setChapterDialog((previous) => previous ? { ...previous, busy: false } : previous);
          }
        }, [adoptChapter, call, chapterDialog, notify, t]);
        const deleteChapter = (0, import_react.useCallback)(async () => {
          const current = chapterRef.current;
          if (!current) return;
          const ok = await guardDirty();
          if (!ok) return;
          if (!window.confirm(t("confirmDeleteChapter"))) return;
          try {
            setChapterDialog(null);
            const result = await call("deleteChapter", { chapterId: current.id, confirm: true });
            chapterRef.current = null;
            chapterIdRef.current = null;
            setChapter(null);
            setDraft("");
            setDirty(false);
            await refreshChapters(novelId);
            await refreshNovels(novelId);
            notify("info", result?.backupPath ? `${t("deletedNotice")} \xB7 ${result.backupPath}` : t("deletedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, guardDirty, novelId, notify, refreshChapters, refreshNovels, t]);
        const openNovelCreate = (0, import_react.useCallback)(() => {
          setNovelDialog({
            mode: "create",
            form: { title: "", author: status?.user?.username ?? "", genre: "\u7384\u5E7B", status: "\u8FDE\u8F7D\u4E2D", intro: "" },
            busy: false
          });
        }, [status]);
        const openNovelEdit = (0, import_react.useCallback)(() => {
          const row = novels.find((novel) => novel.id === novelId);
          if (!row) return;
          setNovelDialog({
            mode: "edit",
            form: { title: row.title, author: row.author, genre: row.genre, status: row.status, intro: row.intro ?? "" },
            busy: false
          });
        }, [novelId, novels]);
        const setNovelField = (0, import_react.useCallback)((key, value) => {
          setNovelDialog((current) => current ? { ...current, form: { ...current.form, [key]: value } } : current);
        }, []);
        const submitNovel = (0, import_react.useCallback)(async () => {
          if (!novelDialog || novelDialog.busy || !writable) return;
          if (!novelDialog.form.title.trim()) {
            notify("error", t("titleRequired"));
            return;
          }
          setNovelDialog((previous) => previous ? { ...previous, busy: true } : previous);
          try {
            if (novelDialog.mode === "create") {
              const result = await call("createNovel", novelDialog.form);
              await refreshNovels(result.novel?.id);
              setChapterId(null);
              setChapter(null);
              setDraft("");
              setTab("body");
              notify("info", t("createdNotice"));
            } else {
              await call("updateNovel", { novelId, ...novelDialog.form });
              await refreshNovels(novelId);
              notify("info", t("savedNotice"));
            }
            setNovelDialog(null);
          } catch (cause) {
            notify("error", causeText(cause));
            setNovelDialog((previous) => previous ? { ...previous, busy: false } : previous);
          }
        }, [call, novelDialog, novelId, notify, refreshNovels, t]);
        const deleteNovel = (0, import_react.useCallback)(async () => {
          if (novelId === null || !writable) return;
          const ok = await guardDirty();
          if (!ok) return;
          if (!window.confirm(t("confirmDeleteNovel"))) return;
          try {
            await call("deleteNovel", { novelId, confirm: true });
            setNovelDialog(null);
            await refreshNovels();
            setChapterId(null);
            setChapter(null);
            setDraft("");
            setTab("body");
            notify("info", t("deletedNotice"));
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [call, guardDirty, novelId, notify, refreshNovels, t, writable]);
        const openChapterFromSearch = (0, import_react.useCallback)(async (targetNovelId, targetChapterId) => {
          const ok = await guardDirty();
          if (!ok) return;
          chapterRef.current = null;
          chapterIdRef.current = targetChapterId;
          draftRef.current = "";
          setChapter(null);
          setDraft("");
          setDirty(false);
          setConflict(null);
          setSaveState("idle");
          if (targetNovelId !== novelId) setNovelId(targetNovelId);
          setChapterId(targetChapterId);
          setTab("body");
        }, [guardDirty, novelId]);
        const onChapterRestored = (0, import_react.useCallback)(async () => {
          if (chapterId === null) return;
          try {
            const loaded = await call("chapter", { chapterId });
            adoptChapter(loaded.chapter);
            await refreshChapters(novelId, chapterId);
            await refreshNovels(novelId);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [adoptChapter, call, chapterId, novelId, notify, refreshChapters, refreshNovels]);
        const findMatches = (0, import_react.useMemo)(() => {
          const query = findQuery;
          if (!query) return [];
          const list = [];
          let from = 0;
          while (list.length < 1e3) {
            const at = draft.indexOf(query, from);
            if (at < 0) break;
            list.push(at);
            from = at + Math.max(1, query.length);
          }
          return list;
        }, [draft, findQuery]);
        const applyDraft = (0, import_react.useCallback)((next) => {
          draftRef.current = next;
          setDraft(next);
          setDirty(next !== (chapterRef.current?.content ?? ""));
        }, []);
        const editDraft = (0, import_react.useCallback)((next) => {
          pushHistory(historyRef.current, draftRef.current, next);
          applyDraft(next);
        }, [applyDraft]);
        const undo = (0, import_react.useCallback)(() => {
          const previous = undoHistory(historyRef.current, draftRef.current);
          if (previous === null) return false;
          applyDraft(previous);
          return true;
        }, [applyDraft]);
        const redo = (0, import_react.useCallback)(() => {
          const next = redoHistory(historyRef.current, draftRef.current);
          if (next === null) return false;
          applyDraft(next);
          return true;
        }, [applyDraft]);
        const autoFormat = (0, import_react.useCallback)(() => {
          const doc = draftRef.current;
          if (!doc) return;
          const formatted = doc.split(/\r?\n/).map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            if (/^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|^>\s|^```|^---\s*$|^\|/.test(trimmed)) return trimmed;
            return `\u3000\u3000${trimmed}`;
          }).join("\n");
          if (formatted !== doc) editDraft(formatted);
        }, [editDraft]);
        const selectMatch = (0, import_react.useCallback)((index) => {
          const editor = editorRef.current;
          if (!editor || findMatches.length === 0) return;
          const normalized = (index % findMatches.length + findMatches.length) % findMatches.length;
          const at = findMatches[normalized];
          editor.focus();
          editor.setSelectionRange(at, at + findQuery.length);
          editor.scrollTop = Math.max(0, (draft.length ? at / draft.length : 0) * editor.scrollHeight - editor.clientHeight / 2);
        }, [draft.length, findMatches, findQuery.length]);
        const openFind = (0, import_react.useCallback)((focusReplace) => {
          setFindOpen(true);
          setFindIndex(0);
          const editor = editorRef.current;
          if (editor && editor.selectionStart !== editor.selectionEnd) {
            const selected = draft.slice(editor.selectionStart, editor.selectionEnd);
            if (selected && !selected.includes("\n")) {
              setFindQuery(selected);
              return;
            }
          }
          if (focusReplace) setTimeout(() => {
            editor?.focus();
          }, 0);
        }, [draft]);
        const findStep = (0, import_react.useCallback)((direction) => {
          if (findMatches.length === 0) return;
          const next = findIndex + direction;
          setFindIndex(next);
          selectMatch(next);
        }, [findIndex, findMatches.length, selectMatch]);
        const replaceOne = (0, import_react.useCallback)(() => {
          if (findMatches.length === 0) return;
          const at = findMatches[Math.min(Math.max(findIndex, 0), findMatches.length - 1)];
          const next = `${draft.slice(0, at)}${findReplace}${draft.slice(at + findQuery.length)}`;
          editDraft(next);
          setTimeout(() => selectMatch(findIndex), 0);
          notify("info", t("findReplacedOne"));
        }, [draft, editDraft, findIndex, findMatches, findQuery.length, findReplace, notify, selectMatch, t]);
        const replaceAll = (0, import_react.useCallback)(() => {
          if (findMatches.length === 0) return;
          const count = findMatches.length;
          editDraft(draft.split(findQuery).join(findReplace));
          setFindIndex(0);
          notify("info", t("findReplacedAll").replace("{n}", String(count)));
        }, [draft, editDraft, findMatches.length, findQuery, findReplace, notify, t]);
        const onEditorContextMenu = (0, import_react.useCallback)((event) => {
          const editor = editorRef.current;
          if (!editor) return;
          const { selectionStart, selectionEnd } = editor;
          if (selectionStart === selectionEnd) return;
          const text = draft.slice(selectionStart, selectionEnd);
          if (!text.trim()) return;
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY, from: selectionStart, to: selectionEnd, text });
        }, [draft]);
        const openAi = (0, import_react.useCallback)((selection, initialMode) => {
          setAiSelection(selection ?? null);
          setAiInitialMode(initialMode ?? null);
          setAiOpen(true);
          setContextMenu(null);
          const sequence = ++aiInfoSequence.current;
          setAiInfoLoading(true);
          void call("aiInfo", {}).then((next) => {
            if (sequence === aiInfoSequence.current) setAiInfo(next);
          }).catch((cause) => {
            if (sequence === aiInfoSequence.current) {
              setAiInfo(null);
              notify("error", causeText(cause));
            }
          }).finally(() => {
            if (sequence === aiInfoSequence.current) setAiInfoLoading(false);
          });
        }, [call, notify]);
        const showUndo = (0, import_react.useCallback)((previous, appliedChapterId, messageKey) => {
          setNotice({
            kind: "info",
            text: t(messageKey),
            action: {
              label: t("undo"),
              onClick: () => {
                if (chapterIdRef.current !== appliedChapterId) {
                  setNotice({ kind: "error", text: t("undoWrongChapter") });
                  return;
                }
                editDraft(previous);
                setNotice({ kind: "info", text: t("undone") });
              }
            }
          });
        }, [editDraft, t]);
        const recordAiRevision = (0, import_react.useCallback)((text, label) => {
          const target = chapterIdRef.current;
          if (target == null || !String(text ?? "").trim()) return;
          void call("addRevision", {
            chapterId: target,
            content: String(text),
            reason: `AI \u751F\u6210 \xB7 ${label || "\u6B63\u6587"}`
          }).catch((cause) => notify("error", causeText(cause)));
        }, [call, notify]);
        const applyAi = (0, import_react.useCallback)(async ({ mode, modeLabel, text, rewrite, report, selection }) => {
          const result = String(text ?? "").trim();
          if (!result) return;
          if (report) {
            try {
              await call("createOutline", {
                novelId,
                chapterId: mode === "outline" ? chapterId : null,
                title: `AI ${t("aiOutlineTitle")} \xB7 ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
                content: result
              });
              notify("info", t("aiSavedOutline"));
            } catch (cause) {
              notify("error", causeText(cause));
            }
            return;
          }
          if (selection) {
            const current2 = draftRef.current;
            if (current2.slice(selection.from, selection.to) !== selection.text) {
              notify("error", t("aiSelectionStale"));
              return;
            }
            const next2 = `${current2.slice(0, selection.from)}${result}${current2.slice(selection.to)}`;
            editDraft(next2);
            recordAiRevision(result, modeLabel);
            setAiOpen(false);
            setAiSelection(null);
            showUndo(current2, chapterIdRef.current, "aiAppliedSelection");
            return;
          }
          const current = draftRef.current;
          const next = rewrite === false ? `${current}${current ? "\n" : ""}${result}` : result;
          editDraft(next);
          recordAiRevision(result, modeLabel);
          setAiOpen(false);
          showUndo(current, chapterIdRef.current, "aiAppliedHint");
        }, [call, chapterId, editDraft, novelId, notify, recordAiRevision, showUndo, t]);
        const copySelection = (0, import_react.useCallback)(async () => {
          if (!contextMenu) return;
          try {
            await navigator.clipboard.writeText(contextMenu.text);
            setContextMenu(null);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [contextMenu, notify]);
        const cutSelection = (0, import_react.useCallback)(async () => {
          if (!contextMenu) return;
          try {
            await navigator.clipboard.writeText(contextMenu.text);
            const current = draftRef.current;
            editDraft(`${current.slice(0, contextMenu.from)}${current.slice(contextMenu.to)}`);
            setContextMenu(null);
          } catch (cause) {
            notify("error", causeText(cause));
          }
        }, [contextMenu, editDraft, notify]);
        const activeNovel = novels.find((row) => row.id === novelId) ?? null;
        const wordCount = draft.length;
        const editable = writable && conflict === null && chapter !== null;
        const saveLabel = saveState === "saving" ? t("saving") : saveState === "error" ? t("saveFailed") : dirty ? t("unsaved") : saveState === "saved" ? t("saved") : "";
        const visibleNovels = (0, import_react.useMemo)(() => {
          const query = novelQuery.trim().toLowerCase();
          const rows = query ? novels.filter((row) => String(row.title ?? "").toLowerCase().includes(query) || String(row.genre ?? "").toLowerCase().includes(query)) : novels;
          return rows.slice().sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
        }, [novels, novelQuery]);
        const visibleChapters = (0, import_react.useMemo)(() => {
          const query = chapterQuery.trim().toLowerCase();
          if (!query) return chapters;
          return chapters.filter((row) => String(row.title ?? "").toLowerCase().includes(query));
        }, [chapters, chapterQuery]);
        const anchors = (0, import_react.useMemo)(
          () => matchOutlineAnchors(draft, outlines, outlineMarkers, chapterId),
          [draft, outlines, outlineMarkers, chapterId]
        );
        const chapterPosition = chapters.findIndex((row) => row.id === chapterId);
        const previousChapter = chapterPosition > 0 ? chapters[chapterPosition - 1] : null;
        const nextChapter = chapterPosition >= 0 && chapterPosition < chapters.length - 1 ? chapters[chapterPosition + 1] : null;
        const locateChapter = () => {
          setChapterQuery("");
          if (typeof document !== "undefined") {
            requestAnimationFrame(() => {
              document.querySelector(".qibi-chapter.active")?.scrollIntoView({ block: "center" });
            });
          }
        };
        const insertCastName = (name) => {
          const editor = editorRef.current;
          if (!editor || !editable) return;
          const current = draftRef.current;
          const at = typeof editor.selectionStart === "number" ? editor.selectionStart : current.length;
          editDraft(`${current.slice(0, at)}${name}${current.slice(at)}`);
          requestAnimationFrame(() => {
            editor.focus();
            const next = at + name.length;
            editor.setSelectionRange(next, next);
          });
        };
        const jumpToAnchor = (anchor) => {
          const editor = editorRef.current;
          const text = draftRef.current;
          if (!editor) return;
          if (!anchor.marker) {
            setNotice({ kind: "error", text: t("anchorNoMarker") });
            return;
          }
          const pos = text.indexOf(anchor.marker);
          if (pos < 0) {
            setNotice({
              kind: "info",
              text: t("anchorMissing").replace("{marker}", anchor.marker),
              action: { label: t("anchorSet"), onClick: () => setMarkerEditing({ id: anchor.id, value: "" }) }
            });
            return;
          }
          editor.focus();
          editor.setSelectionRange(pos, pos + anchor.marker.length);
          editor.scrollTop = Math.max(0, (text.length ? pos / text.length : 0) * editor.scrollHeight - editor.clientHeight / 2);
        };
        const saveMarker = () => {
          if (!markerEditing) return;
          const value = markerEditing.value.trim();
          setOutlineMarkers((previous) => {
            const next = { ...previous };
            if (value) next[markerEditing.id] = value;
            else delete next[markerEditing.id];
            return next;
          });
          setMarkerEditing(null);
        };
        const onTabKey = (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const index = TABS.findIndex(([key]) => key === tab);
          const step = event.key === "ArrowRight" ? 1 : -1;
          const nextKey = TABS[(index + step + TABS.length) % TABS.length][0];
          setTab(nextKey);
          if (typeof document !== "undefined") {
            requestAnimationFrame(() => document.getElementById(`qibi-tab-${nextKey}`)?.focus());
          }
        };
        const novelDialogNode = novelDialog ? /* @__PURE__ */ import_react.default.createElement(
          Dialog,
          {
            title: novelDialog.mode === "create" ? t("newNovel") : t("novelSettings"),
            onClose: () => {
              if (!novelDialog.busy) setNovelDialog(null);
            },
            footer: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, novelDialog.mode === "edit" && /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small danger", disabled: !writable || novelDialog.busy, onClick: () => void deleteNovel() }, t("delete")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: novelDialog.busy, onClick: () => setNovelDialog(null) }, t("cancel")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: !writable || novelDialog.busy, onClick: () => void submitNovel() }, t("save")))
          },
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("novelTitle") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: novelDialog.form.title, onChange: (event) => setNovelField("title", event.target.value) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("novelAuthor") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: novelDialog.form.author, onChange: (event) => setNovelField("author", event.target.value) })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-row" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("novelGenre") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: novelDialog.form.genre, onChange: (event) => setNovelField("genre", event.target.value) })), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("novelStatus") }, /* @__PURE__ */ import_react.default.createElement("input", { className: "qibi-input", value: novelDialog.form.status, onChange: (event) => setNovelField("status", event.target.value) }))), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("novelIntro") }, /* @__PURE__ */ import_react.default.createElement("textarea", { className: "qibi-textarea", rows: 4, value: novelDialog.form.intro, onChange: (event) => setNovelField("intro", event.target.value) })))
        ) : null;
        const chapterDialogNode = chapterDialog && chapter ? /* @__PURE__ */ import_react.default.createElement(
          Dialog,
          {
            title: t("chapterSettings"),
            onClose: () => {
              if (!chapterDialog.busy) setChapterDialog(null);
            },
            footer: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: chapterDialog.busy, onClick: () => setChapterDialog(null) }, t("cancel")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", disabled: chapterDialog.busy, onClick: () => void submitChapter() }, t("save")))
          },
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-form" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: t("chapterTitle") }, /* @__PURE__ */ import_react.default.createElement(
            "input",
            {
              className: "qibi-input",
              value: chapterDialog.form.title,
              onChange: (event) => setChapterDialog((current) => current ? { ...current, form: { ...current.form, title: event.target.value } } : current)
            }
          )), /* @__PURE__ */ import_react.default.createElement(Field, { label: t("chapterStatus") }, /* @__PURE__ */ import_react.default.createElement(
            "select",
            {
              className: "qibi-select",
              value: chapterDialog.form.status,
              onChange: (event) => setChapterDialog((current) => current ? { ...current, form: { ...current.form, status: event.target.value } } : current)
            },
            chapterStatusOptions(chapter.status).map((option) => /* @__PURE__ */ import_react.default.createElement("option", { key: option, value: option }, option))
          )))
        ) : null;
        const dataSettingsDialogNode = dataSettingsOpen ? /* @__PURE__ */ import_react.default.createElement(Dialog, { title: t("dataSettingsTitle"), onClose: () => setDataSettingsOpen(false) }, /* @__PURE__ */ import_react.default.createElement(
          DataSettings,
          {
            key: `data-settings-${loadEpoch}`,
            call,
            t,
            onBeforeSave: beforeDataSettingsSave,
            onSaved: finishDataSettingsSave,
            onCancel: () => setDataSettingsOpen(false)
          }
        )) : null;
        if (phase === "loading") {
          return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-root" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, t("loading")));
        }
        if (phase === "nodb") {
          return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-root qibi-setup-root" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("noDb")), /* @__PURE__ */ import_react.default.createElement("span", null, t("noDbHint").replace("{path}", status?.dbPath ?? status?.dataDir ?? "")), /* @__PURE__ */ import_react.default.createElement("code", { className: "qibi-code" }, status?.dbPath)), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-card" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("dataSettingsTitle")), /* @__PURE__ */ import_react.default.createElement(
            DataSettings,
            {
              key: `data-settings-inline-${loadEpoch}`,
              call,
              t,
              onBeforeSave: beforeDataSettingsSave,
              onSaved: finishDataSettingsSave
            }
          )), dataSettingsDialogNode);
        }
        if (phase === "error") {
          return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-root" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("error")), /* @__PURE__ */ import_react.default.createElement("span", null, error?.message ?? ""), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-actions", style: { marginTop: 12 } }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn", onClick: retryStatus }, t("retry")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn primary", onClick: () => setDataSettingsOpen(true) }, t("dataSettingsOpen")))), dataSettingsDialogNode);
        }
        if (phase === "empty") {
          return /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-root" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-title" }, t("panel")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "qibi-chip",
              "aria-pressed": writable,
              onClick: () => void toggleWritable(),
              disabled: !status?.configWritable,
              title: status?.configWritable ? t("writeToggleHint") : "config.allowWrite = false"
            },
            /* @__PURE__ */ import_react.default.createElement("span", { className: `qibi-chip-dot${writable ? " on" : ""}` }),
            writable ? t("writeOn") : t("writeOff")
          ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => setDataSettingsOpen(true) }, t("dataSettingsOpen")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: openNovelCreate }, "\uFF0B ", t("newNovel"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("emptyNovel")), /* @__PURE__ */ import_react.default.createElement("span", null, t("emptyNovelHint")), /* @__PURE__ */ import_react.default.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn", disabled: !writable, onClick: openNovelCreate }, t("newNovel")))), novelDialogNode, dataSettingsDialogNode);
        }
        return /* @__PURE__ */ import_react.default.createElement("div", { className: `qibi-root${zen ? " zen" : ""}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-title" }, t("panel")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, activeNovel ? `\u300A${activeNovel.title}\u300B\xB7 ${activeNovel.chapterCount} ${t("chapters")} \xB7 ${formatWords(activeNovel.wordCount)} ${t("words")}` : ""), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: async () => {
          if (await guardDirty()) setDataSettingsOpen(true);
        } }, t("dataSettingsOpen")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !activeNovel, onClick: openNovelEdit }, t("novelSettings")), /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-chip",
            "aria-pressed": writable,
            onClick: () => void toggleWritable(),
            disabled: !status?.configWritable,
            title: status?.configWritable ? t("writeToggleHint") : "config.allowWrite = false"
          },
          /* @__PURE__ */ import_react.default.createElement("span", { className: `qibi-chip-dot${writable ? " on" : ""}` }),
          writable ? t("writeOn") : t("writeOff")
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => void reload() }, t("reload"))), conflict && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-banner" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("conflict")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("conflictHint")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small",
            onClick: () => {
              if (dirtyRef.current && !window.confirm(t("discardDraftConfirm"))) return;
              void reload({ force: true });
            }
          },
          t("reload")
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", onClick: () => {
          void save({ force: true });
        } }, t("overwrite"))), notice && /* @__PURE__ */ import_react.default.createElement(
          "div",
          {
            className: `qibi-notice${notice.kind === "error" ? " error" : ""}`,
            role: notice.kind === "error" ? "alert" : "status"
          },
          /* @__PURE__ */ import_react.default.createElement("span", null, notice.text),
          notice.action && /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              className: "qibi-btn small",
              onClick: () => notice.action.onClick()
            },
            notice.action.label
          ),
          /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", "aria-label": t("close"), onClick: () => setNotice(null) }, "\xD7")
        ), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-body" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-block novels" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-head" }, /* @__PURE__ */ import_react.default.createElement("span", null, t("novels")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable, onClick: openNovelCreate, title: t("newNovel") }, "\uFF0B")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-search" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            className: "qibi-input",
            value: novelQuery,
            placeholder: t("filterNovels"),
            onChange: (event) => setNovelQuery(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Escape") setNovelQuery("");
            }
          }
        )), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-list" }, visibleNovels.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-note" }, t("noMatch")), visibleNovels.map((novel) => /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            key: novel.id,
            type: "button",
            className: `qibi-novel${novel.id === novelId ? " active" : ""}`,
            onClick: () => {
              void chooseNovel(novel.id);
            }
          },
          /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-novel-name" }, "\u300A", novel.title, "\u300B"),
          /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-novel-meta" }, novel.genre, " \xB7 ", formatWords(novel.wordCount), " ", t("words"))
        )))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-block chapters" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-subhead" }, /* @__PURE__ */ import_react.default.createElement("span", null, t("chapters")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, chapters.length), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: locateChapter, title: t("locateChapter"), "aria-label": t("locateChapter") }, "\u25CE"), /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small",
            disabled: !writable,
            onClick: () => {
              setCreating((value) => !value);
              setNewTitle("");
            },
            title: t("newChapter")
          },
          "\uFF0B"
        )), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-search" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            className: "qibi-input",
            value: chapterQuery,
            placeholder: t("filterChapters"),
            onChange: (event) => setChapterQuery(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Escape") setChapterQuery("");
            }
          }
        )), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-list" }, visibleChapters.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-side-note" }, chapters.length === 0 ? t("emptyChapter") : t("noMatch")), visibleChapters.map((row) => /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            key: row.id,
            type: "button",
            className: `qibi-chapter${row.id === chapterId ? " active" : ""}`,
            onClick: () => {
              void chooseChapter(row.id);
            }
          },
          /* @__PURE__ */ import_react.default.createElement("span", { className: `qibi-dot${row.status === "\u5DF2\u53D1\u5E03" ? " published" : ""}` }),
          /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-chapter-name" }, row.title),
          /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-chapter-words" }, formatWords(row.wordCount))
        )))), creating && novelId !== null && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-newrow" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            autoFocus: true,
            className: "qibi-input",
            value: newTitle,
            placeholder: t("newChapterPrompt"),
            onChange: (event) => setNewTitle(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") void createChapter();
              if (event.key === "Escape") {
                setCreating(false);
                setNewTitle("");
              }
            }
          }
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", onClick: () => {
          void createChapter();
        } }, "\u2713"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-main" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-main-head" }, chapter ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-chapter-title", title: chapter.title }, chapter.title), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-chip" }, chapter.status || t("statusDraft")), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, formatWords(wordCount), " ", t("words"), saveLabel ? ` \xB7 ${saveLabel}` : "", " \xB7 ", chapter.updatedAt), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), aiInfo?.available && /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", onClick: () => openAi(null) }, t("aiButton")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => openFind(false), title: t("findTitle") }, t("findTitle")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: autoFormat, title: t("formatTitle"), disabled: !draft }, t("format")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => {
          setZen((value) => !value);
          setTab("body");
        }, title: t("zenHint") }, zen ? t("zenOff") : t("zen")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-menu-wrap" }, /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-btn small",
            "aria-haspopup": "menu",
            "aria-expanded": chapterMenu,
            "aria-label": t("more"),
            onClick: (event) => {
              event.stopPropagation();
              setChapterMenu((value) => !value);
            }
          },
          "\u22EF"
        ), chapterMenu && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-menu", role: "menu", onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !editable, onClick: () => {
          setChapterMenu(false);
          undo();
          editorRef.current?.focus();
        } }, t("undo"), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, " Ctrl+Z")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !editable, onClick: () => {
          setChapterMenu(false);
          redo();
          editorRef.current?.focus();
        } }, t("redo"), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, " Ctrl+Y")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-menu-sep" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !previousChapter, onClick: () => {
          setChapterMenu(false);
          if (previousChapter) void chooseChapter(previousChapter.id);
        } }, t("previousChapter")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !nextChapter, onClick: () => {
          setChapterMenu(false);
          if (nextChapter) void chooseChapter(nextChapter.id);
        } }, t("nextChapter")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-menu-sep" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !writable, onClick: () => {
          setChapterMenu(false);
          void moveChapter("up");
        } }, t("moveUp")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !writable, onClick: () => {
          setChapterMenu(false);
          void moveChapter("down");
        } }, t("moveDown")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", disabled: !writable, onClick: () => {
          setChapterMenu(false);
          void openChapterEdit();
        } }, t("edit")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-menu-sep" }), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", role: "menuitem", className: "danger", disabled: !writable, onClick: () => {
          setChapterMenu(false);
          void deleteChapter();
        } }, t("delete"))))) : /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("noChapterSelected"))), chapter && !editable && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-readonly-bar" }, !writable ? t("readonlyWriteOff") : t("readonlyConflict")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabs", role: "tablist", "aria-label": t("panel"), onKeyDown: onTabKey }, TABS.map(([key, labelKey]) => /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            key,
            id: `qibi-tab-${key}`,
            type: "button",
            role: "tab",
            "aria-selected": tab === key,
            "aria-controls": `qibi-pane-${key}`,
            tabIndex: tab === key ? 0 : -1,
            className: `qibi-tab${tab === key ? " active" : ""}`,
            onClick: () => setTab(key)
          },
          t(labelKey)
        ))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-body", role: "tabpanel", "aria-labelledby": "qibi-tab-body", style: { display: tab === "body" ? "flex" : "none" } }, chapter ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, findOpen && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-find" }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            autoFocus: true,
            className: "qibi-input",
            value: findQuery,
            placeholder: t("findPlaceholder"),
            onChange: (event) => {
              setFindQuery(event.target.value);
              setFindIndex(0);
            },
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                findStep(event.shiftKey ? -1 : 1);
              }
              if (event.key === "Escape") setFindOpen(false);
            }
          }
        ), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub qibi-find-count" }, findMatches.length ? `${Math.min(Math.abs(findIndex) % findMatches.length + 1, findMatches.length)}/${findMatches.length}` : "0/0"), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !findMatches.length, onClick: () => findStep(-1), title: t("findPrev") }, "\u2191"), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !findMatches.length, onClick: () => findStep(1), title: t("findNext") }, "\u2193"), /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            className: "qibi-input",
            value: findReplace,
            placeholder: t("findReplacePlaceholder"),
            onChange: (event) => setFindReplace(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Escape") setFindOpen(false);
            }
          }
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || !findMatches.length, onClick: replaceOne }, t("findReplaceOne")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", disabled: !writable || !findMatches.length, onClick: replaceAll }, t("findReplaceAll")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", onClick: () => setFindOpen(false) }, "\xD7")), cast.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-cast" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("castThisChapter")), cast.map((row) => /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            key: row.id,
            className: "qibi-chip",
            disabled: !editable,
            title: row.alias ? `${row.name} \xB7 ${row.alias}` : row.name,
            onClick: () => insertCastName(row.name)
          },
          row.name,
          " \xD7",
          row.count
        ))), anchors.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-anchors" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-sub" }, t("outlineAnchors")), anchors.map((anchor) => markerEditing?.id === anchor.id ? /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-anchor-form", key: anchor.id }, /* @__PURE__ */ import_react.default.createElement(
          "input",
          {
            autoFocus: true,
            className: "qibi-input",
            value: markerEditing.value,
            placeholder: anchor.title.slice(0, 8) || t("anchorPlaceholder"),
            onChange: (event) => setMarkerEditing({ id: anchor.id, value: event.target.value }),
            onKeyDown: (event) => {
              if (event.key === "Enter") saveMarker();
              if (event.key === "Escape") setMarkerEditing(null);
            }
          }
        ), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small primary", onClick: saveMarker }, "\u2713"), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "qibi-btn small", "aria-label": t("cancel"), onClick: () => setMarkerEditing(null) }, "\xD7")) : /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-anchor", key: anchor.id }, /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: `qibi-chip${anchor.done ? " done" : ""}`,
            title: anchor.done ? t("anchorDoneHint") : t("anchorTodoHint"),
            onClick: () => jumpToAnchor(anchor)
          },
          /* @__PURE__ */ import_react.default.createElement("span", { className: `qibi-dot${anchor.done ? " published" : ""}` }),
          anchor.title || anchor.marker || `#${anchor.id}`
        ), /* @__PURE__ */ import_react.default.createElement(
          "button",
          {
            type: "button",
            className: "qibi-anchor-edit",
            title: t("anchorSet"),
            "aria-label": t("anchorSet"),
            onClick: () => setMarkerEditing({ id: anchor.id, value: anchor.custom ? anchor.marker : "" })
          },
          "\u270E"
        )))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-editor-wrap" }, /* @__PURE__ */ import_react.default.createElement(
          "textarea",
          {
            ref: editorRef,
            className: "qibi-editor",
            value: draft,
            readOnly: !editable,
            spellCheck: false,
            placeholder: t("emptyBody"),
            onChange: (event) => {
              const next = event.target.value;
              pushTypingHistory(historyRef.current, draftRef.current, next, Date.now());
              draftRef.current = next;
              setDraft(next);
              setDirty(next !== (chapterRef.current?.content ?? ""));
            },
            onBlur: () => {
              if (dirtyRef.current && !conflict) void save();
            },
            onContextMenu: onEditorContextMenu,
            onKeyDown: (event) => {
              const mod = event.ctrlKey || event.metaKey;
              if (mod && !event.altKey) {
                const key = event.key.toLowerCase();
                if (key === "z") {
                  event.preventDefault();
                  if (event.shiftKey) redo();
                  else undo();
                  return;
                }
                if (key === "y") {
                  event.preventDefault();
                  redo();
                  return;
                }
              }
              if (mod && (event.key === "f" || event.key === "F")) {
                event.preventDefault();
                openFind(false);
              } else if (mod && (event.key === "h" || event.key === "H")) {
                event.preventDefault();
                openFind(true);
              } else if (event.key === "Escape" && findOpen) {
                setFindOpen(false);
              }
            }
          }
        ))) : /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-empty" }, /* @__PURE__ */ import_react.default.createElement("strong", null, t("emptyChapter")), /* @__PURE__ */ import_react.default.createElement("span", null, t("noChapterHint")))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-outline", role: "tabpanel", "aria-labelledby": "qibi-tab-outline", style: { display: tab === "outline" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(OutlineTab, { call, novelId, chapters, writable, active: tab === "outline", notify, t })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-characters", role: "tabpanel", "aria-labelledby": "qibi-tab-characters", style: { display: tab === "characters" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(CharactersTab, { call, novelId, writable, active: tab === "characters", notify, t })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-distill", role: "tabpanel", "aria-labelledby": "qibi-tab-distill", style: { display: tab === "distill" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(DistillTab, { call, novelId, writable, active: tab === "distill", notify, t })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-continuity", role: "tabpanel", "aria-labelledby": "qibi-tab-continuity", style: { display: tab === "continuity" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(ContinuityTab, { call, novelId, chapterId, writable, active: tab === "continuity", notify, t })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-search", role: "tabpanel", "aria-labelledby": "qibi-tab-search", style: { display: tab === "search" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(SearchTab, { call, novelId, writable, active: tab === "search", notify, onOpenChapter: openChapterFromSearch, t })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-revisions", role: "tabpanel", "aria-labelledby": "qibi-tab-revisions", style: { display: tab === "revisions" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(RevisionsTab, { key: chapterId ?? "none", call, chapterId, writable, active: tab === "revisions", notify, onRestored: onChapterRestored, guard: guardDirty, t })), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-tabpane", id: "qibi-pane-export", role: "tabpanel", "aria-labelledby": "qibi-tab-export", style: { display: tab === "export" ? "flex" : "none" } }, /* @__PURE__ */ import_react.default.createElement(ExportTab, { call, novelId, notify, t })))), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-foot" }, /* @__PURE__ */ import_react.default.createElement("span", null, status?.dataDir), /* @__PURE__ */ import_react.default.createElement("span", { className: "qibi-spacer" }), /* @__PURE__ */ import_react.default.createElement("span", null, status?.user ? `${status.user.username}` : "")), contextMenu && /* @__PURE__ */ import_react.default.createElement(
          "div",
          {
            className: "qibi-context",
            style: { left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 260) },
            onClick: (event) => event.stopPropagation()
          },
          /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-context-label" }, "\u201C", contextMenu.text.slice(0, 16), contextMenu.text.length > 16 ? "\u2026" : "", "\u201D"),
          aiInfo?.available && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", onClick: () => openAi({ ...contextMenu }, "deslop-selection") }, t("aiDeslop")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", onClick: () => openAi({ ...contextMenu }, "polish-selection") }, t("aiPolish")), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", onClick: () => openAi({ ...contextMenu }, "expand-selection") }, t("aiExpand")), /* @__PURE__ */ import_react.default.createElement("div", { className: "qibi-context-sep" })),
          /* @__PURE__ */ import_react.default.createElement("button", { type: "button", onClick: () => void copySelection() }, t("copySelection")),
          /* @__PURE__ */ import_react.default.createElement("button", { type: "button", onClick: () => void cutSelection() }, t("cutSelection")),
          /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                setFindQuery(contextMenu.text);
                setFindOpen(true);
                setContextMenu(null);
              }
            },
            t("findSelected")
          )
        ), aiOpen && /* @__PURE__ */ import_react.default.createElement(
          AiDrawer,
          {
            call,
            novelId,
            chapterId,
            draft,
            selection: aiSelection,
            initialMode: aiInitialMode,
            writable,
            info: aiInfo,
            modelLoading: aiInfoLoading,
            hasOutline: outlines.some((row) => row.chapterId === chapterId),
            t,
            notify,
            onApply: applyAi,
            onClose: () => {
              setAiOpen(false);
              setAiSelection(null);
              setAiInitialMode(null);
            }
          }
        ), novelDialogNode, chapterDialogNode, dataSettingsDialogNode);
      }
      function installStyles() {
        if (typeof document === "undefined") return () => {
        };
        const id = "dsh-qibi-styles";
        if (!document.getElementById(id)) {
          const element = document.createElement("style");
          element.id = id;
          element.textContent = STYLES;
          document.head.appendChild(element);
        }
        return () => {
          const element = document.getElementById(id);
          if (element) element.remove();
        };
      }
      var inject = ["slots", "locale", "layout"];
      function apply(ctx) {
        try {
          ctx.effect(() => ctx.locale.register(NS, dictionaries), "qibi: dictionaries");
          const t = ctx.locale.bind(NS);
          ctx.effect(installStyles, "qibi: styles");
          const call = (endpoint, payload) => callHost(endpoint, payload);
          ctx.effect(() => ctx.slots.inject("main", () => ctx.slots.register({
            name: "main",
            key: PANEL_ID,
            locale: NS,
            inject: () => ({ call, t })
          }, Workbench)), "qibi: main panel");
          ctx.effect(() => ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
            name: "sidebar.panellist",
            id: PANEL_ID,
            order: 20,
            label: () => t("panel"),
            locale: NS
          }, QibiIcon)), "qibi: sidebar entry");
        } catch (error) {
          console.error("[qibi] \u6D4F\u89C8\u5668\u7AEF\u6CE8\u518C\u5931\u8D25\uFF1A", error);
        }
      }
      function pick(row) {
        const form = {};
        for (const key of CHARACTER_FIELDS) form[key] = row?.[key] ?? "";
        return form;
      }

    return module.exports
  },
})
