import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "./math_stuff";

export class Triangle {
    position: vec3;     //Triangle position
    eulers: vec3;        //Triangle orientation in Euler angles
    model!: mat4;        //Triangle model matrix

    /**
     * 
     * @param position Triangle initial position
     * @param theta Triangle initial rotation along the Z axis
     */
    constructor(position: vec3, theta: number) {
        this.position = position;
        this.eulers = vec3.create();
        this.eulers[1] = theta; //We only rotate the objetc around one axis
    }

    update() {
        this.eulers[1] += 0;
        this.eulers[1] %= 360;

        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);

        mat4.rotateY(this.model, this.model, Deg2Rad(this.eulers[1]));
    }

    get_model(): mat4 {
        return this.model;
    }
}