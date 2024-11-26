import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "./math_stuff";

export class Quad {
    position: vec3;     //Triangle position
    model!: mat4;        //Triangle model matrix

    /**
     * 
     * @param position Triangle initial position
     * @param theta Triangle initial rotation along the Z axis
     */
    constructor(position: vec3) {
        this.position = position;
    }

    update() {

        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
    }

    get_model(): mat4 {
        return this.model;
    }
}