import './styles/core.scss'
import 'flowbite';
import {subtle} from "uncrypto";

const imageUploader = <HTMLInputElement>document.getElementById('uploader');
const settingsForm = <HTMLInputElement>document.getElementById('settingsForm');
const projectKey = <HTMLInputElement>document.getElementById('projectKey');
const framework = <HTMLInputElement>document.getElementById('framework');
const canvas = <HTMLCanvasElement>document.getElementById('canvas');
const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

interface preparedRenderingOptions {
    baseImage: HTMLImageElement
    icons: {
        [key: string]: HTMLImageElement
        lightning: HTMLImageElement
        terraform: HTMLImageElement
        kubernetes: HTMLImageElement
    }
    projectColor: string
}

async function generate(event: Event) {
    event.preventDefault();


    if (!imageUploader.files || !imageUploader.files[0]) {
        alert('No file selected!');
        throw new Error('No file selected!');
    }
    const file = imageUploader.files[0]
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
        if (typeof reader.result !== 'string') return;
        const preparedParameters = await prepareRendering(reader.result);
        drawBase();
        ctx.drawImage(preparedParameters.baseImage, 0, 0, canvas.width, canvas.height);
        drawOverlay(preparedParameters);
    }

}

settingsForm.addEventListener('submit', generate);

async function prepareRendering(baseImage: string): Promise<preparedRenderingOptions> {
    return {
        baseImage: await loadBlobToImageObject(await loadSvgToImage(baseImage)),
        icons: {
            lightning: await loadBlobToImageObject(await loadSvgToImage('/overlay/lightning.png')),
            terraform: await loadBlobToImageObject(await loadSvgToImage('/overlay/terraform.svg')),
            kubernetes: await loadBlobToImageObject(await loadSvgToImage('/overlay/kubernetes.svg')),
        },
        projectColor: await stringToColor(projectKey.value)
    }
}

function loadBlobToImageObject(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
            resolve(img);
        }
        img.src = URL.createObjectURL(blob);
    });
}

function drawBase() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawOverlay(options: preparedRenderingOptions) {
    let padding: number = 5;
    // ProjectColor
    const cardWidth = canvas.width * .33;
    const cardHeight = canvas.height * .33;
    drawRightTopCorner(options, cardWidth, cardHeight);

    // cards
    ctx.roundRect(0, 0, cardWidth + padding, cardHeight + padding, [0, 0, 20, 0]);
    ctx.roundRect(canvas.width - cardWidth - padding, canvas.height - cardHeight - padding, cardWidth + padding, cardHeight + padding, [20, 0, 0, 0]);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();

    // Brand
    ctx.drawImage(options.icons.lightning, 0, 0, cardWidth, cardHeight);

    // Code Style
    /// Terraform
    switch (framework.value) {
        case 'terraform':
            ctx.drawImage(options.icons.terraform, canvas.width - cardWidth, canvas.height - cardHeight, cardWidth, cardHeight);
            break;
        case 'kubernetes':
            ctx.drawImage(options.icons.kubernetes, canvas.width - cardWidth, canvas.height - cardHeight, cardWidth, cardHeight);
            break;
    }

    /// Kubernetes

    // Platform
    /// GCP
    /// AWS
    console.log('overlay rendered')
}

async function loadSvgToImage(path: string) {
    const file = await fetch(path);
    return  await file.blob();
}

function drawRightTopCorner(options: preparedRenderingOptions, width: number, height: number) {
    const path = new Path2D();
    path.moveTo(canvas.width - width, 0);
    path.lineTo(canvas.width, 0);
    path.lineTo(canvas.width, height);

    ctx.stroke(path);

    ctx.fillStyle = options.projectColor;
    console.log(options.projectColor)
    ctx.fill(path);
}

async function stringToColor(value: string) {
    const msgUint8 = new TextEncoder().encode(value.toLowerCase());
    const hashBuffer = await subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    console.log(hash);
    return '#' + hash.substring(0, 6);
}