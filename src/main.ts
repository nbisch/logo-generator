import './styles/core.scss'
import 'flowbite';
import {subtle} from "uncrypto";

const imageUploader = <HTMLInputElement>document.getElementById('uploader');
const settingsForm = <HTMLInputElement>document.getElementById('settingsForm');
const projectKey = <HTMLInputElement>document.getElementById('projectKey');
const canvas = <HTMLCanvasElement>document.getElementById('canvas');
const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

interface preparedRenderingOptions {
    baseImage: HTMLImageElement
    icons: {
        [key: string]: HTMLImageElement
        lightning: HTMLImageElement
        terraform: HTMLImageElement
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
            terraform: await loadBlobToImageObject(await loadSvgToImage('/overlay/terraform.svg')),
            lightning: await loadBlobToImageObject(await loadSvgToImage('/overlay/lightning.png')),
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
    let posX: number, posY: number, padding: number = 5;
    // ProjectColor
    drawRightTopCorner(options);

    // cards
    ctx.roundRect(0, 0, 100 + padding, 100 + padding, [0, 0, 20, 0]);
    posX = .55;
    posY = .55;
    ctx.roundRect(canvas.width * posX - padding, canvas.height * posY - padding, canvas.width * (1 - posX) + padding, canvas.height * (1 - posY) + padding, [20, 0, 0, 0]);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Brand
    ctx.drawImage(options.icons.lightning, 0, 0, 100, 100);

    // Code Style
    /// Terraform
    ctx.drawImage(options.icons.terraform, canvas.width * posX, canvas.height * posY, canvas.width * (1 - posX), canvas.height * (1 - posY));
    //await drawBlobToCanvas(options.icons.terraform, canvas.width * posX, canvas.height * posY, canvas.width * (1 - posX), canvas.height * (1 - posY));
    /// Kubernetes

    // Platform
    /// GCP
    /// AWS
    console.log('overlay rendered')
}

async function loadSvgToImage(path: string) {
    const file = await fetch(path);
    const blob = await file.blob();
    return blob
}

function drawRightTopCorner(options: preparedRenderingOptions) {
    const path = new Path2D();
    path.moveTo(canvas.width * .8, 0);
    path.lineTo(canvas.width, 0);
    path.lineTo(canvas.width, canvas.height * .2);

    ctx.stroke();

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