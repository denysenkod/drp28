from __future__ import annotations

import gradio as gr

from .config import Settings
from .service import DEFAULT_NEGATIVE_PROMPT, TryOnService


def build_ui(settings: Settings) -> gr.Blocks:
    service = TryOnService(settings)

    css = """
    .hairmatch-shell { max-width: 1180px; margin: 0 auto; }
    .hairmatch-note { color: #7a6f64; font-size: 14px; }
    .hairmatch-title h1 { font-size: 44px; line-height: 1.04; margin-bottom: 4px; }
    .hairmatch-title em { color: #cf9400; font-family: Georgia, serif; font-weight: 400; }
    """

    with gr.Blocks(
        title="HairMatch Try-On",
        theme=gr.themes.Soft(primary_hue="amber", neutral_hue="stone"),
        css=css,
    ) as demo:
        with gr.Column(elem_classes=["hairmatch-shell"]):
            gr.Markdown(
                """
                <div class="hairmatch-title">
                  <h1>Virtual haircut <em>try-on</em></h1>
                  <p class="hairmatch-note">Upload a face photo, preview the generated hair mask, then run local SDXL inpainting directly through Python. This page is separate from the main HairMatch app.</p>
                </div>
                """
            )

            with gr.Row():
                with gr.Column(scale=1):
                    source = gr.Image(label="Face photo", type="pil", image_mode="RGB")
                    manual_mask = gr.Image(
                        label="Optional manual hair mask",
                        type="pil",
                        image_mode="L",
                        sources=["upload", "clipboard"],
                    )
                with gr.Column(scale=1):
                    prompt = gr.Textbox(
                        label="Haircut prompt",
                        value="messy textured fringe fade haircut, realistic salon photo, natural hairline, highly detailed",
                        lines=3,
                    )
                    negative_prompt = gr.Textbox(label="Negative prompt", value=DEFAULT_NEGATIVE_PROMPT, lines=3)
                    with gr.Row():
                        seed = gr.Number(label="Seed (-1 random)", value=-1, precision=0)
                        steps = gr.Slider(label="Steps", minimum=8, maximum=45, value=24, step=1)
                        cfg = gr.Slider(label="CFG", minimum=1, maximum=12, value=6.5, step=0.5)
                    generate = gr.Button("Generate try-on", variant="primary")

            with gr.Row():
                gallery = gr.Gallery(label="Generated outputs", columns=2, height=520)
                mask_preview = gr.Image(label="Hair mask preview", type="pil", image_mode="L")

            status = gr.Markdown(
                "Mock backend is enabled."
                if settings.mock_mode
                else f"Diffusers backend enabled. Model: `{settings.diffusers_model}` on `{settings.diffusers_device}`."
            )

            generate.click(
                fn=service.generate,
                inputs=[source, manual_mask, prompt, negative_prompt, seed, steps, cfg],
                outputs=[gallery, mask_preview, status],
            )

    return demo
