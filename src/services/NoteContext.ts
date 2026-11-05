import { App, MarkdownView, WorkspaceLeaf } from "obsidian";

export interface NoteContextData {
  path: string;
  baseName: string;
  content: string;
  truncated: boolean;
}

const MAX_NOTE_CONTEXT_CHARS = 20000;

export async function buildNoteContext(
  app: App,
  lastActiveNoteLeaf: WorkspaceLeaf | null
): Promise<NoteContextData | null> {
  const view =
    lastActiveNoteLeaf?.view instanceof MarkdownView ? lastActiveNoteLeaf.view : null;
  const file = view?.file ?? app.workspace.getActiveFile();

  if (!file || file.extension !== "md") return null;

  let content: string;
  if (view && view.getMode() === "source" && view.editor) {
    content = view.editor.getValue();
  } else {
    content = await app.vault.cachedRead(file);
  }

  if (!content.trim()) return null;

  const truncated = content.length > MAX_NOTE_CONTEXT_CHARS;
  if (truncated) content = content.slice(0, MAX_NOTE_CONTEXT_CHARS);

  return { path: file.path, baseName: file.name, content, truncated };
}
