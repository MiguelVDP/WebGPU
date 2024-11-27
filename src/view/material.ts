export class Material {

    texture!: GPUTexture
    view!: GPUTextureView
    sampler!: GPUSampler
    bindGroup!: GPUBindGroup

    async initialize(device: GPUDevice, url: string, bindGropuLayout: GPUBindGroupLayout) {
        //Extract the data from an image into a format readable for a texture
        const response: Response = await fetch(url);
        const blob: Blob = await response.blob();
        const imageData: ImageBitmap = await createImageBitmap(blob);

        await this.loadImageBitmap(device, imageData);

        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "rgba8unorm",
            dimension: "2d",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1,
        }

        this.view = this.texture.createView(viewDescriptor);

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        }
        this.sampler = device.createSampler(samplerDescriptor);

        this.bindGroup = device.createBindGroup({
            layout: bindGropuLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.view
                },
                {
                    binding: 1,
                    resource: this.sampler
                }
            ]
        });
    }

    //Function to load the data into a texture
    async loadImageBitmap(device: GPUDevice, imageData: ImageBitmap) {

        //First create a texture specifying its use and characteristics
        const textureDesc: GPUTextureDescriptor = {
            size: {
                width: imageData.width,
                height: imageData.height
            },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };
        this.texture = device.createTexture(textureDesc);

        //Then load the image data (or whatever data is being used) into de texture
        device.queue.copyExternalImageToTexture(
            { source: imageData },
            { texture: this.texture },
            textureDesc.size
        );



    }
}