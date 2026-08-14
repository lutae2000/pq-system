from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import pandas as pd
import pdfplumber


DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
ROW_NO_RE = re.compile(r"\d+")
NUMBER_RE = re.compile(r"[\d,]+")
CONTENT_TOP_MIN = 60.0
CONTENT_TOP_MAX = 790.0


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def compact(text: str) -> str:
    return re.sub(r"\s+", "", text).strip()


def group_words_by_line(words: Sequence[dict], top_tol: float = 2.0) -> list[list[dict]]:
    lines: list[list[dict]] = []
    current: list[dict] = []
    current_top: float | None = None

    for word in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if current_top is None or abs(word["top"] - current_top) <= top_tol:
            current.append(word)
            current_top = word["top"] if current_top is None else (current_top + word["top"]) / 2.0
        else:
            lines.append(sorted(current, key=lambda w: w["x0"]))
            current = [word]
            current_top = word["top"]

    if current:
        lines.append(sorted(current, key=lambda w: w["x0"]))

    return lines


def collapse_words(words: Iterable[dict]) -> str:
    return normalize(" ".join(word["text"] for word in sorted(words, key=lambda w: (w["top"], w["x0"]))))


def reconstruct_text(words: Sequence[dict], gap_threshold: float = 1.5) -> str:
    lines = group_words_by_line(words)
    parts: list[str] = []

    for line in lines:
        if not line:
            continue
        line_text = line[0]["text"]
        prev = line[0]
        for word in line[1:]:
            gap = word["x0"] - prev["x1"]
            if gap > gap_threshold:
                line_text += " "
            line_text += word["text"]
            prev = word
        parts.append(line_text)

    return "".join(part for part in parts if part).strip()


def first_number_line(words: Sequence[dict]) -> dict | None:
    candidates = [
        word
        for word in words
        if word["x0"] < 60 and ROW_NO_RE.fullmatch(word["text"]) and word["text"] not in {"0", "00"}
    ]
    return min(candidates, key=lambda w: (w["top"], w["x0"])) if candidates else None


def extract_marker_top(words: Sequence[dict], marker: str) -> float | None:
    tops = [word["top"] for word in words if word["text"].startswith(marker)]
    return min(tops) if tops else None


def token_dates(words: Sequence[dict], x_min: float, x_max: float) -> list[str]:
    dates: list[str] = []
    for word in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if not (x_min <= word["x0"] < x_max):
            continue
        match = DATE_RE.search(word["text"])
        if match:
            dates.append(match.group(0))
    return dates


def extract_execution_rate(words: Sequence[dict]) -> str:
    combined = compact(" ".join(word["text"] for word in sorted(words, key=lambda w: (w["top"], w["x0"]))))
    match = re.search(r"(?:※|\*)?이행비율\(지분율\)[:：]?(?:\(지분율\))?([0-9]+(?:\.[0-9]+)?%?)", combined)
    if match:
        return match.group(1)
    match = re.search(r"이행비율\(지분율\)[:：]?\s*([0-9]+(?:\.[0-9]+)?%?)", combined)
    return match.group(1) if match else ""


def clean_overview_text(text: str) -> str:
    text = re.sub(r"※\s*이행비율\(지분율\)\s*[:：]?\s*[0-9]+(?:\.[0-9]+)?%?", "", text)
    text = re.sub(r"공사기간[:：]?\s*\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2}", "", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+,", ",", text)
    return text.strip(" ,~")


def extract_overview(words: Sequence[dict]) -> str:
    lines = group_words_by_line(words)
    parts: list[str] = []
    for line in lines:
        texts = [word["text"] for word in line]
        joined = "".join(texts)
        if not joined:
            continue
        if any(token in joined for token in ("공사종류", "공사기간", "이행비율", "발주처", "용역비")):
            continue
        overview_words = [
            word
            for word in line
            if 285 <= word["x0"] < 465
            and not DATE_RE.fullmatch(word["text"])
            and not NUMBER_RE.fullmatch(word["text"])
            and word["text"] != "~"
        ]
        if not overview_words:
            continue
        parts.append(reconstruct_text(overview_words, gap_threshold=1.2))
    return clean_overview_text(" ".join(part for part in parts if part))


def stitch_overview_overlap(previous: ParsedRecord, current: ParsedRecord) -> tuple[ParsedRecord, ParsedRecord]:
    if not previous.overview or not current.overview:
        return previous, current

    current_starts_with_amount = re.match(r"^\d+(?:\.\d+)?억원", current.overview)
    amount_matches = list(re.finditer(r"\d+(?:\.\d+)?억원", previous.overview))
    if current_starts_with_amount or len(amount_matches) < 2:
        return previous, current

    split_at = amount_matches[-1].start()
    head = previous.overview[:split_at].rstrip(" ,")
    tail = previous.overview[split_at:].lstrip(" ,")
    if not tail:
        return previous, current

    separator = "" if tail.endswith(("관", "-", "D", "L", "ㅁ")) or current.overview.startswith((",", ":", ".")) else " "

    return (
        ParsedRecord(
            row_no=previous.row_no,
            service_name=previous.service_name,
            industry_type=previous.industry_type,
            client=previous.client,
            contract_from=previous.contract_from,
            contract_to=previous.contract_to,
            amount=previous.amount,
            construction_from=previous.construction_from,
            construction_to=previous.construction_to,
            execution_rate=previous.execution_rate,
            overview=head,
        ),
        ParsedRecord(
            row_no=current.row_no,
            service_name=current.service_name,
            industry_type=current.industry_type,
            client=current.client,
            contract_from=current.contract_from,
            contract_to=current.contract_to,
            amount=current.amount,
            construction_from=current.construction_from,
            construction_to=current.construction_to,
            execution_rate=current.execution_rate,
            overview=clean_overview_text(f"{tail}{separator}{current.overview}"),
        ),
    )


def extract_industry_type(words: Sequence[dict]) -> str:
    lines = group_words_by_line(words)
    candidate = ""
    for idx, line in enumerate(lines):
        texts = [word["text"] for word in line]
        marker_idx = next((i for i, text in enumerate(texts) if text.startswith("공사종류")), None)
        if marker_idx is None:
            continue

        same_line_value = [
            word["text"]
            for word in line[marker_idx + 1 :]
            if word["x0"] >= 330 and word["text"] not in {":", "："}
        ]
        value = collapse_words({"text": part, "top": 0, "x0": 0} for part in same_line_value)
        if value:
            candidate = value
            continue

        if idx + 1 < len(lines):
            next_line = lines[idx + 1]
            next_texts = [word["text"] for word in next_line]
            if any(text.startswith(("발주처", "용역비")) for text in next_texts):
                candidate = ""
                continue
            next_value = collapse_words(
                word for word in next_line if word["x0"] >= 330 and word["text"] not in {":", "："}
            )
            if next_value:
                candidate = next_value
                continue

    return candidate


def sanitize_industry_type(text: str) -> str:
    if not text:
        return ""
    if any(ch.isdigit() for ch in text):
        return ""
    if any(token in text for token in ("억원", "공사기간", "이행비율", "용역비", "발주처")):
        return ""
    return text


def format_yyyymmdd(value: str) -> str:
    return value.replace("-", "") if DATE_RE.fullmatch(value) else value


@dataclass
class ParsedRecord:
    row_no: str
    service_name: str
    industry_type: str
    client: str
    contract_from: str
    contract_to: str
    amount: str
    construction_from: str
    construction_to: str
    execution_rate: str
    overview: str

    def as_dict(self) -> dict[str, str]:
        return {
            "일련번호": self.row_no,
            "용역명": self.service_name,
            "공종(사업개요 내 공사종류)": self.industry_type,
            "발주처": self.client,
            "계약기간(from)": format_yyyymmdd(self.contract_from),
            "계약기간(to)": format_yyyymmdd(self.contract_to),
            "용역비(기본금액)": self.amount,
            "공사기간(from)": format_yyyymmdd(self.construction_from),
            "공사기간(to)": format_yyyymmdd(self.construction_to),
            "이행비율(지분율)": self.execution_rate,
            "사업개요": self.overview,
        }


def merge_text(left: str, right: str) -> str:
    left = left.strip()
    right = right.strip()
    if not left:
        return right
    if not right or left == right:
        return left
    if right in left:
        return left
    if left in right:
        return right
    return f"{left}{right}"


def merge_records(left: ParsedRecord, right: ParsedRecord) -> ParsedRecord:
    return ParsedRecord(
        row_no=left.row_no,
        service_name=merge_text(left.service_name, right.service_name),
        industry_type=merge_text(left.industry_type, right.industry_type),
        client=merge_text(left.client, right.client),
        contract_from=left.contract_from or right.contract_from,
        contract_to=left.contract_to or right.contract_to,
        amount=left.amount or right.amount,
        construction_from=left.construction_from or right.construction_from,
        construction_to=left.construction_to or right.construction_to,
        execution_rate=left.execution_rate or right.execution_rate,
        overview=merge_text(left.overview, right.overview),
    )


def parse_record(words: Sequence[dict]) -> ParsedRecord | None:
    row_word = first_number_line(words)
    if row_word is None:
        return None

    row_no = row_word["text"]

    contract_dates = token_dates(words, 230, 290)
    contract_from = contract_dates[0] if len(contract_dates) >= 1 else ""
    contract_to = contract_dates[1] if len(contract_dates) >= 2 else ""

    construction_dates = token_dates(words, 320, 410)
    construction_from = construction_dates[0] if len(construction_dates) >= 1 else ""
    construction_to = construction_dates[1] if len(construction_dates) >= 2 else ""

    service_name = reconstruct_text(
        word
        for word in words
        if 110 <= word["x0"] < 235 and not NUMBER_RE.fullmatch(word["text"])
    )

    industry_type = sanitize_industry_type(extract_industry_type(words))

    overview = extract_overview(words)

    client = collapse_words(
        word
        for word in words
        if 465 <= word["x0"] < 540 and not DATE_RE.fullmatch(word["text"]) and not NUMBER_RE.fullmatch(word["text"])
    )

    amounts = [
        word["text"]
        for word in sorted(words, key=lambda w: (w["top"], w["x0"]))
        if word["x0"] >= 540 and NUMBER_RE.fullmatch(word["text"])
    ]
    amount = amounts[-1] if amounts else ""
    execution_rate = extract_execution_rate(words)

    return ParsedRecord(
        row_no=row_no,
        service_name=service_name,
        industry_type=industry_type,
        client=client,
        contract_from=contract_from,
        contract_to=contract_to,
        amount=amount,
        construction_from=construction_from,
        construction_to=construction_to,
        execution_rate=execution_rate,
        overview=overview,
    )


def extract_records(pdf_path: Path, start_page: int = 1, end_page: int = 30) -> list[dict[str, str]]:
    rows: list[ParsedRecord] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        total_pages = len(pdf.pages)
        end_page = min(end_page, total_pages)

        for page_number in range(start_page, end_page + 1):
            page = pdf.pages[page_number - 1]
            words = [
                word
                for word in page.extract_words(use_text_flow=True, keep_blank_chars=False)
                if CONTENT_TOP_MIN <= word["top"] < CONTENT_TOP_MAX
            ]
            if not words:
                continue

            row_starts = sorted(
                (
                    word
                    for word in words
                    if word["x0"] < 60 and ROW_NO_RE.fullmatch(word["text"])
                ),
                key=lambda w: (w["top"], w["x0"]),
            )
            if not row_starts:
                continue

            first_top = row_starts[0]["top"]
            boundaries: list[tuple[float, float]] = []
            for idx, start_word in enumerate(row_starts):
                start_top = first_top - 30 if idx == 0 else (row_starts[idx - 1]["top"] + start_word["top"]) / 2.0
                end_top = (
                    (start_word["top"] + row_starts[idx + 1]["top"]) / 2.0
                    if idx + 1 < len(row_starts)
                    else page.height
                )
                boundaries.append((start_top, end_top))

            for start_top, end_top in boundaries:
                record_words = [word for word in words if start_top <= word["top"] < end_top]
                parsed = parse_record(record_words)
                if parsed is None:
                    continue
                if rows and rows[-1].row_no == parsed.row_no:
                    rows[-1] = merge_records(rows[-1], parsed)
                else:
                    rows.append(parsed)

    stitched: list[ParsedRecord] = []
    for row in rows:
        if stitched:
            prev, current = stitch_overview_overlap(stitched[-1], row)
            stitched[-1] = prev
            row = current
        stitched.append(row)

    return [row.as_dict() for row in stitched]


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract completed service rows from the CEMS inspection PDF and save them as CSV."
    )
    parser.add_argument(
        "--pdf",
        type=Path,
        default=Path(r"C:\Users\cheil\Documents\OfficeMessenger Files\Received Files\제일 실적.pdf"),
        help="Input PDF path.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output CSV path. Defaults to the input PDF name with .csv.",
    )
    parser.add_argument("--start-page", type=int, default=1, help="First page to parse.")
    parser.add_argument("--end-page", type=int, default=30, help="Last page to parse.")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()
    pdf_path: Path = args.pdf
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    output_path = args.output or Path(r"C:\Users\cheil\Documents") / f"{pdf_path.stem}.csv"
    rows = extract_records(pdf_path, start_page=args.start_page, end_page=args.end_page)
    frame = pd.DataFrame(rows, columns=[
        "일련번호",
        "용역명",
        "공종(사업개요 내 공사종류)",
        "발주처",
        "계약기간(from)",
        "계약기간(to)",
        "용역비(기본금액)",
        "공사기간(from)",
        "공사기간(to)",
        "이행비율(지분율)",
        "사업개요",
    ])
    frame.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Saved {len(frame)} rows to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
