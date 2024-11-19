import { App } from "./control/app";

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("gfx-main");

const app = new App(canvas);
await app.initialize();

app.run();