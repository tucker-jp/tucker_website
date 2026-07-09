from __future__ import annotations

import argparse
import os
import stat
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


try:
    from workflowpy.compiler import Compiler
    from workflowpy.models.shortcuts import Action, Shortcut
    from workflowpy.utils import sign_shortcut
except ImportError as exc:  # pragma: no cover - helper script
    raise SystemExit(
        "This script needs `workflowpy-shortcuts` installed. "
        "Try: pip install workflowpy-shortcuts"
    ) from exc


DEFAULT_ENDPOINT = "https://tuckerpippin.com/api/tracker/capture"
TOKEN_ENV_VAR = "TRACKER_CAPTURE_TOKEN"


@dataclass(frozen=True, slots=True)
class PromptSpec:
    variable: str
    prompt: str
    field_name: str
    required: bool = False


@dataclass(frozen=True, slots=True)
class ShortcutSpec:
    name: str
    category: str
    prompts: tuple[PromptSpec, ...] = ()
    share_field: str | None = None
    share_content_types: tuple[str, ...] = ()


SHORTCUT_SPECS: tuple[ShortcutSpec, ...] = (
    ShortcutSpec(
        name="Book Capture for Tracker",
        category="books",
        prompts=(
            PromptSpec("title", "Book title", "title", required=True),
            PromptSpec("author", "Author (optional)", "author"),
        ),
    ),
    ShortcutSpec(
        name="Movie Capture for Tracker",
        category="movies",
        prompts=(
            PromptSpec("title", "Movie title", "title", required=True),
            PromptSpec("director", "Director (optional)", "director"),
        ),
    ),
    ShortcutSpec(
        name="Restaurant Capture for Tracker",
        category="restaurants",
        prompts=(
            PromptSpec("name", "Restaurant name", "name", required=True),
            PromptSpec("location", "Location (optional)", "location"),
        ),
    ),
    ShortcutSpec(
        name="Idea Capture for Tracker",
        category="ideas",
        prompts=(
            PromptSpec("title", "Idea", "title", required=True),
            PromptSpec("body", "Details (optional)", "body"),
        ),
    ),
    ShortcutSpec(
        name="To-do Capture for Tracker",
        category="todos",
        prompts=(
            PromptSpec("title", "To-do", "title", required=True),
            PromptSpec("body", "Details (optional)", "body"),
        ),
    ),
    ShortcutSpec(
        name="Quote Capture for Tracker",
        category="quotes",
        prompts=(
            PromptSpec("quote", "Quote", "quote", required=True),
            PromptSpec("speaker", "Speaker (optional)", "speaker"),
            PromptSpec("source", "Source (optional)", "source"),
        ),
    ),
    ShortcutSpec(
        name="Quote From Selection for Tracker",
        category="quotes",
        prompts=(
            PromptSpec("speaker", "Speaker (optional)", "speaker"),
            PromptSpec("source", "Source (optional)", "source"),
        ),
        share_field="quote",
        share_content_types=("WFStringContentItem", "WFRichTextContentItem"),
    ),
    ShortcutSpec(
        name="Save Clip to Tracker",
        category="clips",
        share_field="url",
        share_content_types=("WFURLContentItem",),
    ),
)


def _validate_endpoint(endpoint: str) -> str:
    parsed = urlparse(endpoint)
    if parsed.scheme != "https" or not parsed.netloc:
        raise SystemExit("The capture endpoint must be a complete HTTPS address.")
    return endpoint.rstrip("/")


def _source_for(spec: ShortcutSpec, endpoint: str, token: str) -> str:
    lines = ["from workflowpy.magic import *"]
    payload_parts = [f"'category': {spec.category!r}"]
    authorization = f"Bearer {token}"

    if spec.share_field:
        lines.extend(
            [
                "shared_input: str = shortcut_input()",
                "if shared_input == '':",
                "    exit()",
            ]
        )
        payload_parts.append(f"{spec.share_field!r}: shared_input")

    for prompt in spec.prompts:
        lines.append(f"{prompt.variable} = input({prompt.prompt!r})")
        if prompt.required:
            lines.extend(
                [
                    f"if {prompt.variable} == '':",
                    "    exit()",
                ]
            )
        payload_parts.append(f"{prompt.field_name!r}: {prompt.variable}")

    payload = "{" + ", ".join(payload_parts) + "}"
    lines.append(
        "fetch("
        f"{endpoint!r}, method='POST', "
        f"headers={{'Authorization': {authorization!r}}}, "
        f"json={payload})"
    )
    return "\n".join(lines)


def _append_success_notification(shortcut: Shortcut, spec: ShortcutSpec) -> None:
    shortcut.WFWorkflowActions.append(
        Action(
            WFWorkflowActionIdentifier="is.workflow.actions.notification",
            WFWorkflowActionParameters={
                "WFNotificationActionTitle": "Tracker",
                "WFNotificationActionBody": f"Saved {spec.category.rstrip('s')} to Tracker.",
                "WFNotificationActionSound": False,
            },
        )
    )


def build_shortcut(spec: ShortcutSpec, endpoint: str, token: str) -> Shortcut:
    shortcut = Compiler().compile(_source_for(spec, endpoint, token))
    _append_success_notification(shortcut, spec)

    if spec.share_field:
        shortcut.WFWorkflowHasShortcutInputVariables = True
        shortcut.WFWorkflowInputContentItemClasses = list(spec.share_content_types)
        shortcut.WFWorkflowTypes = [
            "ActionExtension",
            "QuickActions",
            "ReceivesOnScreenContent",
        ]
    return shortcut


def write_shortcut(spec: ShortcutSpec, output_dir: Path, endpoint: str, token: str) -> Path:
    output_path = output_dir / f"{spec.name}.shortcut"
    output_path.write_bytes(sign_shortcut(build_shortcut(spec, endpoint, token)))
    output_path.chmod(stat.S_IRUSR | stat.S_IWUSR)
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate signed Tracker shortcuts that save directly to the private website."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("dist/direct-shortcuts"),
        help="Where to write the signed .shortcut files.",
    )
    parser.add_argument(
        "--endpoint",
        default=DEFAULT_ENDPOINT,
        help="The Tracker capture endpoint.",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help="Generate only shortcuts whose names contain this text (repeatable).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    token = os.environ.get(TOKEN_ENV_VAR, "").strip()
    if not token:
        raise SystemExit(f"Set {TOKEN_ENV_VAR} to a capture-only device token first.")

    endpoint = _validate_endpoint(args.endpoint)
    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    output_dir.chmod(stat.S_IRWXU)

    filters = [value.casefold() for value in args.only]
    specs = [
        spec
        for spec in SHORTCUT_SPECS
        if not filters or any(value in spec.name.casefold() for value in filters)
    ]
    if not specs:
        raise SystemExit("No Shortcut names matched --only.")

    for spec in specs:
        print(write_shortcut(spec, output_dir, endpoint, token))
    return 0


if __name__ == "__main__":  # pragma: no cover - helper script
    raise SystemExit(main())
