import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "./math_stuff";
import { lookup } from "dns";

export class Camera {
    position!: vec3;      //Camera position
    phi: number;          //Spherical coordinate
    theta: number;        //Camera rotation on the Y axis
    view!: mat4;          //Camera view Matrix (calculated with lookAt, up and right)
    forward: vec3;
    right: vec3;
    up: vec3;
    rotation_speed: number;


    /**
     * 
     * @param position Camera initial position
     * @param phi Angle formed between the positive Y axis and the forward vector
     * @param theta Camera initial rotation along the Y axis
     */
    constructor(position: vec3, phi: number, theta: number, rot_speed: number) {
        this.position = position;
        this.phi = phi;
        this.theta = theta;
        this.forward = vec3.create();
        this.right = vec3.create();
        this.up = vec3.create();
        this.rotation_speed = rot_speed;
    }

    update() {

        this.forward = [
            Math.sin(Deg2Rad(this.theta)) * Math.sin(Deg2Rad(this.phi)),
            Math.cos(Deg2Rad(this.phi)),
            - Math.cos(Deg2Rad(this.theta)) * Math.sin(Deg2Rad(this.phi)) //Negate the Z to have a camera pointing to [0, 0, -1] by default
        ]

        vec3.cross(this.right, this.forward, [0, 1, 0]);
        vec3.cross(this.up, this.right, this.forward);

        var target = vec3.create()
        vec3.add(target, this.position, this.forward);

        this.view = mat4.create();
        mat4.lookAt(this.view, this.position, target, this.up);

    }


    get_view(): mat4 {
        return this.view;
    }
}