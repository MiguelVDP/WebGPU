import { Triangle } from "./triangle";
import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";
import { Quad } from "./quad";
import { object_types, RenderData } from "./definitions";

export class Scene {

    triangles: Triangle[];
    quads: Quad[]
    player: Camera;
    object_data: Float32Array;
    triangle_count: number;
    quad_count: number

    constructor() {
        this.triangles = [];
        this.quads = [];
        this.object_data = new Float32Array(16 * 1024);
        this.triangle_count = 0;
        this.quad_count = 0;

        this.make_triangles();
        this.make_quads();


        this.player = new Camera([0, 1, 2], 90, 0, 0.1);
    }

    make_triangles() {
        var i: number = 0;
        for (var x: number = -5; x <= 5; x++) {
            this.triangles.push(
                new Triangle([x, 0, -2], 0)
            );

            var balnk_matrix = mat4.create();
            for (var j = 0; j < 16; j++) {
                this.object_data[16 * i + j] = <number>balnk_matrix.at(j);
            }
            i++;
            this.triangle_count++;
        }
    }

    make_quads() {
        var i: number = this.triangle_count;
        for (var z = -10; z <= 10; z++) {
            for (var x: number = -10; x <= 10; x++) {
                this.quads.push(
                    new Quad([x, 0, z])
                );

                var balnk_matrix = mat4.create();
                for (var j = 0; j < 16; j++) {
                    this.object_data[16 * i + j] = <number>balnk_matrix.at(j);
                }
                i++;
                this.quad_count++;
            }
        }
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

        this.quads.forEach(
            (q) => {
                q.update();
                var model = q.get_model();
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

    get_render_data(): RenderData{
        return {
            view_transform: this.player.get_view(),
            model_transforms: this.object_data,
            // object_counts: [this.triangle_count, this.quad_count]
            object_counts: {
                [object_types.TRIANGLE]: this.triangle_count,
                [object_types.QUAD]: this.quad_count
            }
        }
    }

}