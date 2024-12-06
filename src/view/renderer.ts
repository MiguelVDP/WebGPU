import shader from "./shaders/shader.wgsl"
import { TriangleMesh } from "./triangle_mesh";
import { QuadMesh } from "./quad_mesh";
import { mat4 } from "gl-matrix";
import { Material } from "./material";
import { Camera } from "../model/camera";
import { object_types, RenderData } from "../model/definitions";
import { ObjMesh } from "./ojectc_mesh";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipeline objects
    uniformBuffer!: GPUBuffer;
    // triangle_bindGroup!: GPUBindGroup;
    // quad_bindGroup!: GPUBindGroup;
    frameBindGroup!: GPUBindGroup;
    pipeline!: GPURenderPipeline;
    frameBindGroupLayout!: GPUBindGroupLayout;
    materialBindGroupLayout!: GPUBindGroupLayout;

    // Assets
    triangleMesh!: TriangleMesh;
    quadMesh!: QuadMesh;
    statue_mesh!: ObjMesh;
    triangle_material!: Material;
    quad_material!: Material;
    object_buffer!: GPUBuffer;

    //Depth Stencil stuff
    depthStencilState!: GPUDepthStencilState;
    depthStencilBuffer!: GPUTexture;
    depthStencilView!: GPUTextureView;
    depthStencilAtachment!: GPURenderPassDepthStencilAttachment;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async Initialize() {

        await this.setupDevice();

        await this.makeBindGroupLayouts();

        await this.makeDepthBufferResources();

        await this.createAssets();

        await this.makePipeline();

        await this.makeBindGroups();
    }

    async setupDevice() {

        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        this.device = <GPUDevice>await this.adapter?.requestDevice();
        //context: similar to vulkan instance (or OpenGL context)
        this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

    }

    async makeBindGroupLayouts() {
        this.frameBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
            ]

        });

        this.materialBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
            ]

        });

    }

    async makeDepthBufferResources() {
        //Create the depthStencilState to define how te renderpass will affect the depthStencilAtachment
        this.depthStencilState = {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less-equal",
        }

        //Define the texture the depth buffer will be using
        const size: GPUExtent3D = {
            width: this.canvas.width,
            height: this.canvas.height,
            depthOrArrayLayers: 1
        }
        const textureDescriptor: GPUTextureDescriptor = {
            size: size,
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }
        this.depthStencilBuffer = this.device.createTexture(textureDescriptor);

        //Define a view for the created texture
        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "depth24plus-stencil8",
            dimension: "2d",
            aspect: "all"
        }
        this.depthStencilView = this.depthStencilBuffer.createView(viewDescriptor);

        //Finally create the depthStencilAtachment
        this.depthStencilAtachment = {
            view: this.depthStencilView,
            depthClearValue: 1,
            depthLoadOp: "clear",
            depthStoreOp: "store",

            stencilLoadOp: "clear",
            stencilStoreOp: "discard"
        };
    }

    async createAssets() {
        this.triangleMesh = new TriangleMesh(this.device);
        this.quadMesh = new QuadMesh(this.device);
        this.statue_mesh = new ObjMesh()
        await this.statue_mesh.initialize(this.device, 'dist/models/statue.obj');
        this.triangle_material = new Material();
        this.quad_material = new Material();

        const bufferDescriptor: GPUBufferDescriptor = {
            size: 64 * 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        };
        this.object_buffer = this.device.createBuffer(bufferDescriptor);

        await this.triangle_material.initialize(this.device, "dist/img/brocode.png", this.materialBindGroupLayout);
        await this.quad_material.initialize(this.device, "dist/img/Grass.jpg", this.materialBindGroupLayout);
    }

    async makePipeline() {

        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 2,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //TODO: Read the material layouts too
        const pipelineLayout = this.device.createPipelineLayout({
            // bindGroupLayouts: [this.frameBindGroupLayout]
            bindGroupLayouts: [this.frameBindGroupLayout, this.materialBindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "vs_main",
                buffers: [this.triangleMesh.bufferLayout,]
            },

            fragment: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "fs_main",
                targets: [{
                    format: this.format
                }]
            },

            primitive: {
                topology: "triangle-list"
            },

            layout: pipelineLayout,

            depthStencil: this.depthStencilState
        });

    }

    async makeBindGroups(){
        this.frameBindGroup = this.device.createBindGroup({
            layout: this.frameBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.object_buffer
                    }
                }
            ]
        });
    }

    async render(renderData: RenderData) {

        //make transforms
        const projection = mat4.create();
        mat4.perspective(projection, Math.PI / 4, 800 / 600, 0.1, 50);
        const view = renderData.view_transform;

        this.device.queue.writeBuffer(this.object_buffer, 0,
            renderData.model_transforms, 0,
            renderData.model_transforms.length)
        this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);

        //command encoder: records draw commands for submission
        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        //texture view: image view to the color buffer in this case
        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAtachment
        });

        renderpass.setPipeline(this.pipeline);
        renderpass.setBindGroup(0, this.frameBindGroup);

        var objects_drawn: number = 0;
        //Triangles
        renderpass.setVertexBuffer(0, this.triangleMesh.buffer);
        renderpass.setBindGroup(1, this.triangle_material.bindGroup);
        renderpass.draw(3, renderData.object_counts[object_types.TRIANGLE], 0, objects_drawn);
        objects_drawn += renderData.object_counts[object_types.TRIANGLE];

        //Quads
        renderpass.setVertexBuffer(0, this.quadMesh.buffer);
        renderpass.setBindGroup(1, this.quad_material.bindGroup);
        renderpass.draw(6, renderData.object_counts[object_types.QUAD], 0, objects_drawn);
        objects_drawn += renderData.object_counts[object_types.QUAD];

        //Statue
        renderpass.setVertexBuffer(0, this.statue_mesh.buffer);
        renderpass.setBindGroup(1, this.triangle_material.bindGroup);
        renderpass.draw(this.statue_mesh.vertexCount, 1, 0, objects_drawn)
        objects_drawn += 1;

        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);

    }

}