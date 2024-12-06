import { vec3, vec2 } from "gl-matrix";

export class ObjMesh {

    buffer!: GPUBuffer
    bufferLayout!: GPUVertexBufferLayout

    v: vec3[];
    vt: vec2[];
    vn: vec3[];

    vertices!: Float32Array;
    vertexCount!: number;

    constructor() {
        this.v = [];
        this.vt = [];
        this.vn = [];
    }

    async initialize(device: GPUDevice, url: string) {

        // x y z u v
        await this.readFile(url);
        this.vertexCount = this.vertices.length / 5;

        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
        //VERTEX: the buffer can be used as a vertex buffer
        //COPY_DST: data can be copied to the buffer

        const descriptor: GPUBufferDescriptor = {
            size: this.vertices.byteLength,
            usage: usage,
            mappedAtCreation: true // similar to HOST_VISIBLE, allows buffer to be written by the CPU
        };

        this.buffer = device.createBuffer(descriptor);

        //Buffer has been created, now load in the vertices
        new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
        this.buffer.unmap();

        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: 20,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x2",
                    offset: 12
                }
            ]
        }

    }

    async readFile(url: string) {
        var result: number[] = [];

        const response: Response = await fetch(url);
        const blob: Blob = await response.blob();
        const file_contents = (await blob.text());
        const lines = file_contents.split("\n");

        lines.forEach(
            (line) => {
                const [c0, c1, ...rest] = line;

                if (c0 === "v") {
                    if (c1 === " ") {
                        this.read_vertex_line(line);
                    } else if (c1 === "t") {
                        this.read_texture_line(line);
                    } else if (c1 === "n") {
                        this.read_normal_line(line);
                    }
                } else if (c0 === "f") {
                    this.read_face_line(line, result);
                }

            }
        )

        this.vertices = new Float32Array(result);
        console.log(this.vertices)
    }

    read_vertex_line(line: string) {
        //This line will give as an array with the following strings: ["v", vx, vy, vz]
        const components = line.split(" ");

        const new_vertex: vec3 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
            Number(components[3]).valueOf()
        ];

        this.v.push(new_vertex);
    }

    read_texture_line(line: string) {
        const components = line.split(" ");

        const new_textcoord: vec2 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
        ];

        this.vt.push(new_textcoord);
    }

    read_normal_line(line: string) {
        const components = line.split(" ");

        const new_vertex_normal: vec3 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
            Number(components[3]).valueOf()
        ];

        this.vn.push(new_vertex_normal);
    }

    read_face_line(line: string, result: number[]) {
        line = line.replace("\n", "");
        const vertex_descriptors = line.split(" ");

        //Number of triangles in the face line
        const triangle_count = vertex_descriptors.length - 3;

        for (var i = 0; i < triangle_count; i++){
            this.read_corner(vertex_descriptors[1], result);
            this.read_corner(vertex_descriptors[2 + i], result);
            this.read_corner(vertex_descriptors[3] + i, result);
        }
    }

    read_corner(vertex_description: string, result: number[]){
        const [v_idx, vt_idx, vn_idx] = vertex_description.split("/");
        const v = this.v[Number(v_idx).valueOf() - 1];
        const vt = this.vt[Number(v_idx).valueOf() - 1];

        result.push(v[0]);
        result.push(v[1]);
        result.push(v[2]);
        result.push(vt[0]);
        result.push(vt[1]);

    }
}