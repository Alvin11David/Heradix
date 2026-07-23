import { Injectable, signal } from '@angular/core';

export interface EditorState {
  uploadedDesignUrl: string | null;
  brightness: number;
  contrast: number;
  opacity: number;
  bgColor: string;
  bgGradient: boolean;
  showShadow: boolean;
  showReflection: boolean;
  showGloss: boolean;
  finishType: 'matte' | 'glossy' | 'metallic';
  scaleX: number;
  scaleY: number;
  rotation: number;
  posX: number;
  posY: number;
}

export const DEFAULT_EDITOR: EditorState = {
  uploadedDesignUrl: null,
  brightness: 100,
  contrast: 100,
  opacity: 100,
  bgColor: '#FFFFFF',
  bgGradient: false,
  showShadow: true,
  showReflection: false,
  showGloss: false,
  finishType: 'matte',
  scaleX: 100,
  scaleY: 100,
  rotation: 0,
  posX: 50,
  posY: 50,
};

@Injectable({ providedIn: 'root' })
export class MockupsEditorService {
  readonly showEditor = signal(false);
  readonly editorState = signal<EditorState>({ ...DEFAULT_EDITOR });

  open(): void {
    this.editorState.set({ ...DEFAULT_EDITOR });
    this.showEditor.set(true);
  }

  close(): void {
    this.showEditor.set(false);
  }

  update(patch: Partial<EditorState>): void {
    this.editorState.update(s => ({ ...s, ...patch }));
  }

  reset(): void {
    this.editorState.set({ ...DEFAULT_EDITOR });
  }
}
