# HairMatch Virtual Haircut Try-On

This folder contains a separate local proof of concept for trying hairstyles on a user photo. It does not modify or depend on the main Cloudflare Worker HairMatch app.

The implementation is software-configured and headless. There is no ComfyUI workflow, no visual node graph, and no hosted AI API. The Gradio page sends a request to a local Python service, which either runs a cheap mock backend or runs SDXL inpainting directly through Hugging Face Diffusers and PyTorch.

## Current Status

The working path is:

```text
Gradio upload -> FastAPI -> OpenCV hair mask -> Diffusers SDXL inpainting -> output image
```

The default real-generation setup uses:

```env
TRYON_BACKEND=diffusers
DIFFUSERS_MODEL=diffusers/stable-diffusion-xl-1.0-inpainting-0.1
DIFFUSERS_DEVICE=cuda
DIFFUSERS_WIDTH=768
DIFFUSERS_HEIGHT=768
IP_ADAPTER_REPO=
IP_ADAPTER_WEIGHT_NAME=
```

IP-Adapter is intentionally disabled in the current working config. The first attempted SDXL IP-Adapter setup produced an embedding shape mismatch, so the stable baseline is plain SDXL inpainting with face preservation handled by the mask.

## Quick Start In Mock Mode

Mock mode starts the page without downloading AI model weights. It is useful for checking upload, mask preview, prompt fields, and output display.

### Windows PowerShell

```powershell
cd haircut-tryon
.\run.ps1
```

### macOS And Linux

```bash
cd haircut-tryon
chmod +x run.sh
./run.sh
```

Then open:

```text
http://127.0.0.1:7860
```

To stop the server, press `Ctrl+C` in the terminal where it is running.

## Installing The Real AI Backend

Mock mode only needs `requirements.txt`. Real generation also needs PyTorch CUDA and Diffusers model dependencies.

Use Python 3.10 or 3.11 for the least painful PyTorch compatibility path.

### Windows With NVIDIA CUDA

```powershell
cd haircut-tryon
.\install-diffusers.ps1
```

### Linux With NVIDIA CUDA

```bash
cd haircut-tryon
chmod +x install-diffusers.sh
./install-diffusers.sh
```

The Linux installer uses PyTorch CUDA wheels by default. If your machine needs a different CUDA/PyTorch combo, use the PyTorch install selector and replace the install command in `install-diffusers.sh`.

### macOS

```bash
cd haircut-tryon
chmod +x install-diffusers.sh
./install-diffusers.sh
```

On macOS, the script installs regular PyTorch wheels. Apple Silicon users can try:

```env
DIFFUSERS_DEVICE=mps
DIFFUSERS_VARIANT=
```

The project is currently tuned on CUDA first. macOS/MPS may require smaller image sizes, lower steps, or small code adjustments depending on the installed PyTorch/Diffusers versions.

The install scripts install:

- PyTorch with CUDA wheels
- `diffusers`
- `transformers`
- `accelerate`
- `safetensors`
- supporting packages from `requirements-diffusers.txt`

After installation, run:

```powershell
.\run.ps1
```

## Configuration

Configuration lives in `.env`. `.env` is ignored by git because it may contain local paths or tokens.

### Server

```env
TRYON_HOST=127.0.0.1
TRYON_PORT=7860
```

### Backend

```env
TRYON_BACKEND=mock
```

Supported values:

- `mock`: no AI model; creates a tinted preview using the generated mask.
- `diffusers`: runs SDXL inpainting locally through PyTorch.

### Hugging Face

```env
HF_TOKEN=
```

Most public models can download without a token. Some models are gated and require accepting a license on Hugging Face. If a download fails with an authentication or access error, create a read token and either log in:

```powershell
.\.venv\Scripts\huggingface-cli.exe login
```

or set:

```env
HF_TOKEN=hf_...
```

### Diffusers Model Settings

```env
DIFFUSERS_MODEL=diffusers/stable-diffusion-xl-1.0-inpainting-0.1
DIFFUSERS_DEVICE=cuda
DIFFUSERS_VARIANT=fp16
DIFFUSERS_WIDTH=768
DIFFUSERS_HEIGHT=768
DIFFUSERS_STRENGTH=0.86
```

`DIFFUSERS_MODEL` is the Hugging Face model repo. The current model is an SDXL inpainting model.

`DIFFUSERS_DEVICE=cuda` means generation runs on the NVIDIA GPU. If CUDA is not working, the app will fail clearly rather than silently falling back to very slow CPU.

`DIFFUSERS_VARIANT=fp16` loads half-precision weights, which reduces VRAM use.

`DIFFUSERS_WIDTH` and `DIFFUSERS_HEIGHT` are the generated canvas size. They must be multiples of 8; the code rounds down if needed. `768x768` is the current practical default. `1024x1024` is higher quality but uses more VRAM and time.

`DIFFUSERS_STRENGTH` controls how much the masked area is regenerated. Higher values allow bigger hairstyle changes but can look less faithful. Lower values preserve more of the original hair.

### Optional IP-Adapter

```env
IP_ADAPTER_REPO=
IP_ADAPTER_SUBFOLDER=
IP_ADAPTER_WEIGHT_NAME=
IP_ADAPTER_SCALE=0.45
```

IP-Adapter is optional image guidance. It lets a diffusion model use an image as a reference, not only text. For this project, the intended use is to condition generation on the uploaded face photo so the person stays visually consistent.

The current working config leaves IP-Adapter blank. The earlier attempted adapter:

```env
IP_ADAPTER_REPO=h94/IP-Adapter
IP_ADAPTER_SUBFOLDER=sdxl_models
IP_ADAPTER_WEIGHT_NAME=ip-adapter-plus_sdxl_vit-h.safetensors
```

loaded but failed at runtime with:

```text
RuntimeError: mat1 and mat2 shapes cannot be multiplied (514x1664 and 1280x1280)
```

That means the image embedding shape did not match what the SDXL inpainting UNet expected. This is a model/adapter compatibility problem, not a photo-upload problem.

## What Each Part Does

### FastAPI

`app.py` creates the web server and exposes:

```text
GET /api/health
```

It also mounts the Gradio UI at:

```text
/
```

The health endpoint is useful for checking which backend is active:

```json
{
  "ok": true,
  "backend": "diffusers",
  "model": "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
  "device": "cuda",
  "ipAdapterEnabled": false
}
```

### Gradio

`tryon/ui.py` builds the browser UI:

- face photo upload
- optional manual mask upload
- haircut prompt
- negative prompt
- seed
- steps
- CFG
- generated output gallery
- hair mask preview

Gradio is used because this is a local PoC. It lets us test image upload and output display without building a full React interface.

### Service Layer

`tryon/service.py` is the orchestration layer. It:

1. validates that an image and prompt exist
2. saves the uploaded image to `data/inputs`
3. creates or normalizes the mask
4. chooses `mock` or `diffusers`
5. saves the final result to `data/outputs`
6. returns the result path, mask preview, and status text to Gradio

### Masking

`tryon/masking.py` creates the edit mask.

The mask is a black-and-white image:

- white means "the model may edit this"
- black means "preserve this"

For a haircut try-on, the mask should include hair, hairline, and side/top head regions, while excluding eyes, nose, mouth, jaw, and most of the face.

The current automatic mask is intentionally lightweight:

1. OpenCV detects the largest frontal face.
2. The code estimates a hair region above and around the detected face.
3. It subtracts a face-lock ellipse to protect central facial features.
4. It cleans the mask with morphology and blur.

This is not production-grade segmentation. It is enough to prove the generation pipeline.

For better results, replace this with:

- SAM / Segment Anything
- BiRefNet
- MediaPipe face landmarks plus custom mask geometry
- a dedicated hair segmentation model

### Mock Backend

`tryon/mock.py` exists so the UI can be tested without AI model weights. It composites a brown tint into the mask region and writes an output image. If mock works, upload, saving, mask creation, gallery output, and Gradio wiring are working.

### Diffusers Backend

`tryon/diffusers_backend.py` is the real generation backend.

On the first generation in a Python process, it:

1. imports `torch` and Diffusers lazily
2. loads the SDXL inpainting pipeline
3. moves it to CUDA
4. enables VAE slicing to reduce memory use
5. enables attention slicing only when IP-Adapter is not active
6. caches the loaded pipeline in memory for the next request

Then every generation:

1. resizes the uploaded image to the configured canvas size
2. resizes the mask to the same size
3. creates a deterministic or random PyTorch generator from the seed
4. calls the inpainting pipeline with:

```python
pipe(
    prompt=prompt,
    negative_prompt=negative_prompt,
    image=image,
    mask_image=mask,
    num_inference_steps=steps,
    guidance_scale=cfg,
    strength=strength,
    generator=generator,
)
```

5. saves the first generated image to `data/outputs`

## What Diffusers Is

Diffusers is Hugging Face's Python library for running diffusion models. It provides model-loading, scheduler, pipeline, inpainting, adapter, and optimization APIs.

In this project, Diffusers replaces a visual tool like ComfyUI. Instead of dragging nodes and exporting JSON, we configure and call the model in Python.

## What SDXL Is

SDXL is Stable Diffusion XL, a stronger image-generation model family than older Stable Diffusion 1.5/2.x models. We use an inpainting version of SDXL so the model edits a specific masked region of an existing photo instead of generating a whole image from scratch.

## What Inpainting Is

Inpainting is image editing with a mask. The model sees:

- the original image
- the mask
- the prompt
- the negative prompt

It then regenerates the masked area while using the surrounding pixels as context. That makes it appropriate for trying new haircuts, because the face, clothes, and background can remain mostly intact.

## What IP-Adapter Is

IP-Adapter is an adapter that lets a diffusion model take an image prompt. Instead of only following text, the model also receives image features from a reference image.

For haircut try-on, the hoped-for use is:

```text
text prompt: "messy textured fringe haircut"
image prompt: uploaded face photo
mask: hair region only
```

The text says what hair to create. The image prompt nudges the model to keep the person visually consistent.

FaceID-style adapters are more specialized. They use face embeddings, often through InsightFace, to preserve identity more strongly. They are more finicky because the adapter, image encoder, base model, and pipeline all need to agree on tensor dimensions and expected conditioning.

## Current Identity Preservation Strategy

The current stable implementation relies on mask protection:

- central face is black in the mask
- only the hair region is white
- negative prompt discourages changed face, distorted eyes, and warped mouth

This works well enough for a baseline. It is not as strong as FaceID identity guidance, but it is simpler and currently stable.

## Model Download And Cache Behavior

The first real generation downloads model files from Hugging Face. SDXL has multiple files:

- tokenizer configs
- text encoders
- VAE
- UNet
- scheduler configs
- safetensors weight files

This can be several GB. It should not redownload every time. Files are cached by Hugging Face, usually under:

```text
<user-home>\.cache\huggingface\hub
```

Restarting the server reloads the model into memory, but should reuse the local disk cache.

## Runtime Behavior

The first generation after server start is slower because the model is loaded into GPU memory.

After the model is loaded, later generations in the same server process are faster because the pipeline is cached in `DiffusersBackend._pipe`.

If you stop the server, the GPU memory is released. Starting again requires loading the model into memory again, but not downloading it again.

## Output Folders

Generated and intermediate files are written here:

```text
data/inputs   uploaded source images
data/masks    generated or uploaded masks
data/outputs  mock and generated try-on outputs
```

These folders are git-ignored except for `.gitkeep` placeholders.

## Useful Commands

Start:

Windows:

```powershell
.\run.ps1
```

macOS/Linux:

```bash
./run.sh
```

Stop with `Ctrl+C` in the terminal running the server.

Check health:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:7860/api/health
```

Or on macOS/Linux:

```bash
curl http://127.0.0.1:7860/api/health
```

Run a syntax check:

```powershell
python -m compileall tryon
```

## Troubleshooting

### The app downloads a lot of files

That is normal the first time. SDXL is large. Let it finish. Later runs should use the Hugging Face cache.

### CUDA is not available

Run:

```powershell
.\.venv\Scripts\python.exe -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'no cuda')"
```

If this prints `False`, reinstall PyTorch using the official CUDA wheel command for your GPU/Python version.

### IP-Adapter shape mismatch

Example:

```text
RuntimeError: mat1 and mat2 shapes cannot be multiplied
```

Disable IP-Adapter:

```env
IP_ADAPTER_REPO=
IP_ADAPTER_SUBFOLDER=
IP_ADAPTER_WEIGHT_NAME=
```

Then validate the base inpainting path first.

### Out of memory

Try:

```env
DIFFUSERS_WIDTH=640
DIFFUSERS_HEIGHT=640
```

Also reduce steps.

### The generated haircut barely changes

Increase:

```env
DIFFUSERS_STRENGTH=0.9
```

Use a more explicit prompt.

### The face changes too much

Decrease:

```env
DIFFUSERS_STRENGTH=0.72
```

Improve the mask so facial features are black/protected.

### The wrong area is edited

Inspect the mask shown in the UI. If the mask is wrong, the model is doing what it was told. Upload a manual mask or improve `tryon/masking.py`.

## Recommended Next Improvements

1. Replace the heuristic OpenCV mask with a proper hair segmentation model.
2. Add a mask editor in the UI so users can paint corrections.
3. Add prompt presets from selected HairMatch styles.
4. Add before/after comparison.
5. Add batch generation: 4 seeds per prompt.
6. Reintroduce identity guidance with a confirmed compatible SDXL FaceID/IP-Adapter setup.
7. Save generation metadata next to output images for reproducibility.
