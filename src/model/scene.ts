import { Triangle } from "./triangle";
import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";

export class Scene {

    triangles: Triangle[];
    player: Camera;
    object_data: Float32Array;
    triangle_count: number;

    constructor() {
        this.triangles = [];
        this.object_data = new Float32Array(16 * 1024);
        this.triangle_count = 0;

        var i: number = 0;
        for (var y: number = -5; y < 5; y++) {
            this.triangles.push(
                new Triangle([0, y, -2], 0)
            );

            var balnk_matrix = mat4.create();
            for (var j = 0; j < 16; j++) {
                this.object_data[16 * i + j] = <number>balnk_matrix.at(j);
            }
            i++;
            this.triangle_count++;
        }

        this.player = new Camera([0, 0, 2], 90, 0, 0.1);
    }

    update() {

        var i: number = 0;
        this.triangles.forEach(
            (t) => {
                t.update();
                var model = t.get_model();
                for (let j = 0; j < 16; j++) {
                    this.object_data[16 * i + j] = model[j];
                }
                i++;
            }
        )

        this.player.update();
    }

    spin_player(dx: number, dy: number) {

        this.player.theta += dx * this.player.rotation_speed;
        this.player.theta %= 360;

        this.player.phi += dy * this.player.rotation_speed;
        this.player.phi = Math.min(178, Math.max(5, this.player.phi));
        // if(this.phi < 0.02) {this.phi =0.02;}
        // else if( this.phi > 3.12) {this.phi = 3.12;}
    }

    move_player(forwards_amount: number, right_amount: number) {
        vec3.scaleAndAdd(
            this.player.position, this.player.position,
            this.player.forward, forwards_amount
        );
        vec3.scaleAndAdd(
            this.player.position, this.player.position,
            this.player.right, right_amount
        );
    }

    get_player(): Camera {
        return this.player;
    }

    get_triangles(): Float32Array {
        return this.object_data;
    }

}