import type { XmlSchema } from '@selenite/commons';
import type { Action } from 'svelte/action';

export interface ICodeEditor {
	destroy(): void;
	createModel(params: { language?: string; value?: string }): void;
	setLightTheme(light: boolean): void;
	getText(): { text: string; cursorOffset: number | null };
	setText(params: { text: string; cursorOffset?: number | null }): void;
	setup_(params: { container: HTMLElement }): void;
	getSelectedText(): string;
}

export type codeEditorBackends = 'monaco';

export function makeCodeEditor(params: { backend: codeEditorBackends; geosSchema: XmlSchema }): {
	codeEditor: ICodeEditor | undefined;
	codeEditorPromise: Promise<ICodeEditor>;
	codeEditorAction: Action<HTMLDivElement>;
} {
	const codeEditorPromise = createCodeEditor(params);
	let resolvePostSetupEditorPromise: (value: ICodeEditor) => void;
	const postSetupEditorPromise = new Promise<ICodeEditor>((resolve) => {
		resolvePostSetupEditorPromise = resolve;
	});
	let codeEditor =$state<ICodeEditor>();
	return {
		get codeEditor() {
			return codeEditor;
		},
		set codeEditor(value) {
			codeEditor = value;
		},
		codeEditorPromise,
		codeEditorAction: (node) => {
			codeEditorPromise.then((editor) => {
				editor.setup_({ container: node });
				resolvePostSetupEditorPromise(editor);
				codeEditor = editor;
			});

			return {
				destroy() {
					codeEditorPromise.then((codeEditor) => {
						codeEditor.destroy();
					});
				}
			};
		}
	};
}

export async function createCodeEditor(params: {
	backend: codeEditorBackends;
	geosSchema: XmlSchema;
}): Promise<ICodeEditor> {
	switch (params.backend) {
		case 'monaco':
			return await (
				await import('./backends/monaco/MonacoCodeEditor')
			).default.create({ geosSchema: params.geosSchema });
		default:
			throw new Error('Not implemented');
	}
}