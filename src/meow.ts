import * as vscode from 'vscode';

function objectToCssString(settings: any): string {
    let value = '';
    const cssString = Object.keys(settings)
        .map((setting) => {
            value = settings[setting];
            if (typeof value === 'string' || typeof value === 'number') {
                return `${setting}: ${value};`;
            }
        })
        .join(' ');

    return cssString;
}

export class MeowController {
    private timer: NodeJS.Timer | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.activate();
    }

    private createTutorial = () => {
        const editor = vscode.window.activeTextEditor;
        const baseStyle = {
            position: 'absolute',
            top: '40vh',
            left: '0px',
            ['z-index']: 1,
            ['font-weight']: '900',
            ['pointer-events']: 'none',
            ['text-align']: 'center',
            ['font-size']: '96px',
        };

        const createDecoration = (): vscode.DecorationRenderOptions => {
            const base = objectToCssString(baseStyle);
            return {
                after: {
                    margin: '0 auto',
                    contentText: 'yay',
                    color: '#fff',
                    textDecoration: `none; ${base}`,
                },
            };
        };

        const decorationType = vscode.window.createTextEditorDecorationType({
            ...createDecoration(),
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            light: createDecoration(),
            dark: createDecoration(),
        });

        const first = [
            new vscode.Range(
                new vscode.Position(0, 0),
                new vscode.Position(0, 0)
            ),
        ];
        const firstVisibleRange = first;

        console.log(firstVisibleRange);
        editor?.setDecorations(decorationType, firstVisibleRange);
    };

    private activate = () => {
        this.timer = setTimeout(() => {}, 3000);

        const listener = vscode.window.onDidChangeTextEditorVisibleRanges(
            (event) => {
                console.log(event.visibleRanges);
            }
        );
        this.disposables.push(listener);
    };

    public dispose = () => {
        clearTimeout(this.timer);
        while (this.disposables.length) {
            this.disposables.shift()?.dispose();
        }
    };
}
