import { Renderer } from "../view/renderer";
import { Scene } from "../model/scene";
import $ from "jquery";

export class App {
    canvas: HTMLCanvasElement;
    renderer: Renderer;
    scene: Scene;

    keyLabel: JQuery<HTMLElement>;
    mouseXLabel: JQuery<HTMLElement>;
    mouseYLabel: JQuery<HTMLElement>;

    forwards_amount: number;
    right_amount: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.scene = new Scene();

        this.keyLabel = $("#key-label")
        this.mouseXLabel = $("#mouse-x-label")
        this.mouseYLabel = $("#mouse-y-label")

        $(document).on("keydown", (event) => { this.handle_keypress(event) });
        $(document).on("keyup", (event) => { this.handle_keyrelease(event) });

        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }

        this.canvas.addEventListener(
            "mousemove",
            (event: MouseEvent) => {
                this.handle_mouse_move(event);
            }
        )

        this.right_amount = 0;
        this.forwards_amount = 0;
    }

    async initialize() {
        await this.renderer.Initialize();
    }

    run = () => {
        var running: boolean = true;

        this.scene.update();
        this.scene.move_player(this.forwards_amount, this.right_amount);

        this.renderer.render(
            this.scene.get_player(),
            this.scene.get_triangles(),
            this.scene.triangle_count
        );

        if (running) {
            requestAnimationFrame(this.run)
        }
    }

    handle_keypress(event: JQuery.KeyDownEvent) {
        this.keyLabel.text(event.code);

        if (event.code == "KeyW") {
            this.forwards_amount = 0.02;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = -0.02;
        }
        if (event.code == "KeyA") {
            this.right_amount = -0.02;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0.02;
        }

    }

    handle_keyrelease(event: JQuery.KeyUpEvent) {
        this.keyLabel.text(event.code);

        if (event.code == "KeyW") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyA") {
            this.right_amount = 0;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0;
        }

    }

    handle_mouse_move(event: MouseEvent) {
        this.mouseXLabel.text(event.screenX);
        this.mouseYLabel.text(event.screenY);

        this.scene.spin_player(event.movementX, event.movementY);
    }
}