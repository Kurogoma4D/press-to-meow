import * as vscode from 'vscode';
import * as sound from 'sound-play';
import path = require('path');

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
    private timer: NodeJS.Timeout | undefined;
    private disposables: vscode.Disposable[] = [];
    private decoration: vscode.TextEditorDecorationType | undefined;
    private isActive: Boolean = false;
    private frameCount: number = 0;
    private visibleRange: readonly vscode.Range[] | undefined;

    private _maxFrame = 5000;

    private baseStyle = (opacity: number): object => {
        return {
            position: 'absolute',
            top: '40vh',
            left: '0px',
            width: '100%',
            margin: '0 auto',
            opacity: opacity,
            ['z-index']: 1,
            ['font-weight']: '900',
            ['pointer-events']: 'none',
            ['text-align']: 'center',
            ['font-size']: '48px',
        };
    };

    private createDecoration = (
        opacity: number
    ): vscode.DecorationRenderOptions => {
        const base = objectToCssString(this.baseStyle(opacity));
        return {
            after: {
                margin: '0 auto',
                contentText: 'ニャーと鳴くには <any key> を押す',
                color: '#fff',
                textDecoration: `none; ${base}`,
            },
        };
    };

    public fireMeow = () => {
        this.isActive = true;
        this.frameCount = 0;
        this.activate();
    };

    private calculateOpacity = (count: number): number => {
        if (count < 200) {
            return count / 200;
        }

        if (count > 4800) {
            return (this._maxFrame - count) / 200;
        }

        return 1.0;
    };

    private createTutorial = () => {
        this.decoration?.dispose();

        const opacity = this.calculateOpacity(this.frameCount);

        const visibleRange = this.visibleRange;
        if (!visibleRange) {
            return;
        }

        const first = [...visibleRange].sort().find((range) => !range.isEmpty);
        const isOutOfFrame = this.frameCount >= this._maxFrame;
        if (!first || isOutOfFrame) {
            this.dismiss();
            return;
        }

        const editor = vscode.window.activeTextEditor;

        this.decoration = vscode.window.createTextEditorDecorationType({
            ...this.createDecoration(opacity),
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            light: this.createDecoration(opacity),
            dark: this.createDecoration(opacity),
        });

        const position = first.start;
        const range = new vscode.Range(position, position);

        editor?.setDecorations(this.decoration, [range]);

        if (this.isActive) {
            this.frameCount++;
        }
    };

    private activate = () => {
        const listener = vscode.window.onDidChangeTextEditorVisibleRanges(
            (event) => {
                if (this.isActive) {
                    this.decoration?.dispose();
                }
                this.visibleRange = event.visibleRanges;
            }
        );
        this.disposables.push(listener);

        const keyEvent = vscode.commands.registerCommand('type', (event) => {
            sound.play(path.join(__dirname, 'meow.wav'));
            console.log(`Pressed <${event.text}> key to meow.`);
        });
        this.disposables.push(keyEvent);

        this.visibleRange = vscode.window.activeTextEditor?.visibleRanges;
        if (this.visibleRange) {
            this.timer = setInterval(() => {
                this.frameCount++;
                this.createTutorial();
            }, 1);
        }
    };

    private dismiss = () => {
        this.isActive = false;
        clearTimeout(this.timer);
        this.decoration?.dispose();

        while (this.disposables.length) {
            this.disposables.shift()?.dispose();
        }
    };

    public dispose = () => {
        this.dismiss();
    };
}
