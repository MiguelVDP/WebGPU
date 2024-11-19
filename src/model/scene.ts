import { Triangle } from "./triangle";
import { Camera } from "./camera";
import { vec3 } from "gl-matrix";

export class Scene {
    
    triangles : Triangle[];
    player: Camera;

    constructor(){
        this.triangles = [];
        this.triangles.push(
            new Triangle([0, 0, -2], 0)
        );

        this.player = new Camera([0, 0, 2], Math.PI/2, 0, 0.001);
    }

    update(){
        this.triangles.forEach(
            (t) => t.update()
        )

        this.player.update();
    }

    spin_player(dx: number, dy: number){

        this.player.theta += dx * this.player.rotation_speed;
        this.player.theta %= 2*Math.PI;

        this.player.phi += dy * this.player.rotation_speed;
        this.player.phi = Math.min(3.12, Math.max(0.02, this.player.phi));
        // if(this.phi < 0.02) {this.phi =0.02;}
        // else if( this.phi > 3.12) {this.phi = 3.12;}
    }

    move_player(forwards_amount: number, right_amount: number){
        vec3.scaleAndAdd(
            this.player.position, this.player.position, 
            this.player.forward, forwards_amount
        );
        vec3.scaleAndAdd(
            this.player.position, this.player.position, 
            this.player.right, right_amount
        );
    }

    get_player() : Camera{
        return this.player;
    }

    get_triangles() : Triangle[]{
        return this.triangles;
    }

}