from __future__ import annotations

import argparse
import re
import sys
import threading
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import pdfplumber
import tkinter as tk
from tkinter import filedialog, messagebox, ttk


DEFAULT_INPUT_DIR = Path(r"C:\Users\cheil\Documents\pqpdf")
DEFAULT_OUTPUT_NAME = "pdf_extract_result.xlsx"

DATE = r"\d{4}\.\d{2}\.\d{2}"
DATE_RE = re.compile(DATE)
DATE_LINE_RE = re.compile(rf"^{DATE}$")
DURATION_RE = re.compile(r"\(\s*[\d,]+\s*일\s*\)")

SHEETS = [
    "기본정보",
    "국가기술자격",
    "학력",
    "교육훈련",
    "상훈",
    "기술경력",
]


def clean(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).replace("\x00", " ")).strip()


def split_lines(value: Any) -> list[str]:
    if value is None:
        return []
    return [clean(line) for line in str(value).splitlines() if clean(line)]


def pdf_lines(page: pdfplumber.page.Page) -> list[str]:
    return [clean(line) for line in (page.extract_text() or "").splitlines() if clean(line)]


def is_empty_or_header(row: dict[str, str]) -> bool:
    values = [value for value in row.values() if value]
    if not values:
        return True
    joined = " ".join(values)
    return "** 해당없음 **" in joined or "해당없음" == joined


def add_common(rows: list[dict[str, str]], file_name: str, person_name: str) -> list[dict[str, str]]:
    for row in rows:
        row.setdefault("파일명", file_name)
        row.setdefault("성명(한글)", person_name)
    return rows


def parse_basic_info(all_text: str, file_name: str) -> dict[str, str]:
    row = {
        "파일명": file_name,
        "관리정보": "",
        "관리번호": "",
        "발급번호": "",
        "성명(한글)": "",
        "생년월일": "",
        "주소": "",
        "문서확인번호": "",
        "발급일": "",
    }

    m = re.search(r"문서확인번호\s*:\s*([0-9-]+)", all_text)
    if m:
        row["문서확인번호"] = m.group(1)

    m = re.search(r"(\d{4}년\s*\d{2}월\s*\d{2}일)", all_text)
    if m:
        row["발급일"] = clean(m.group(1))

    m = re.search(r"관리번호\s+(.+?)\s+발급번호\s+([0-9]{8}\s*-\s*[A-Z0-9]+)", all_text)
    if m:
        row["관리번호"] = re.sub(r"\s+", "", m.group(1))
        row["관리정보"] = row["관리번호"]
        row["발급번호"] = re.sub(r"\s+", "", m.group(2))

    m = re.search(r"성명\(한글\)\s*(.+?)\s+\(한자\).*?생년월일\s+([\d.]+)", all_text)
    if m:
        row["성명(한글)"] = clean(m.group(1))
        row["생년월일"] = clean(m.group(2))
    else:
        m = re.search(r"성명\s*:\s*(\S+)", all_text)
        if m:
            row["성명(한글)"] = clean(m.group(1))

    m = re.search(r"주소\s+(.+)", all_text)
    if m:
        row["주소"] = clean(m.group(1))

    return row


def parse_qualifications(all_lines: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    for line in all_lines:
        if "해당없음" in line:
            continue
        m = re.match(rf"^(.+?)\s+({DATE})\s+([A-Z0-9]+)$", line)
        if not m:
            continue
        name, passed_at, reg_no = [clean(group) for group in m.groups()]
        if any(skip in name for skip in ["교육기간", "수여일", "졸업일", "근무기간"]):
            continue
        key = (name, passed_at, reg_no)
        if key in seen:
            continue
        seen.add(key)
        rows.append({"종목 및 등급": name, "합격일": passed_at, "등록번호": reg_no})

    return rows


def parse_education(all_lines: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str]] = set()

    for line in all_lines:
        if "해당없음" in line:
            continue
        if not re.match(rf"^{DATE}\s+", line):
            continue
        if "~" in line:
            continue
        m = re.match(rf"^({DATE})\s+(.+)$", line)
        if not m:
            continue
        graduated_at = clean(m.group(1))
        body = clean(m.group(2))
        parts = body.rsplit(" ", 2)
        if len(parts) != 3:
            continue
        school, major, degree = [clean(part) for part in parts]
        if "[" not in degree or "]" not in degree:
            continue
        key = (graduated_at, school, major, degree)
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "졸업일": graduated_at,
                "학교명": school,
                "학과(전공)": major,
                "학위": degree,
            }
        )

    return rows


def parse_training(all_lines: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str, str]] = set()

    for line in all_lines:
        line = re.sub(r"^교육훈련\s+", "", line)
        m = re.match(rf"^({DATE})\s*~\s*({DATE})\s+(.+?)\s+(\S+)(?:\s+(\S+))?$", line)
        if not m:
            continue
        start_at, end_at, course, org, recognition = [clean(group) for group in m.groups()]
        key = (start_at, end_at, course, org, recognition)
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "교육기간 시작일": start_at,
                "교육기간 종료일": end_at,
                "과정명": course,
                "교육기관명": org,
                "교육인정여부": recognition,
            }
        )

    return rows


def parse_awards(all_lines: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    capture = False

    for line in all_lines:
        if line.startswith("수여일 수여기관 종류 및 근거"):
            capture = True
            continue
        if capture and (line == "상훈" or line.startswith("벌점") or line.startswith("제재사항")):
            capture = False
            continue
        if not capture:
            continue
        if "해당없음" in line:
            continue
        m = re.match(rf"^({DATE})\s+(\S+)\s+(.+)$", line)
        if not m:
            continue
        awarded_at, org, detail = [clean(group) for group in m.groups()]
        if any(token in detail for token in ["교육", "전문교육", "과정"]):
            continue
        key = (awarded_at, org, detail)
        if key in seen:
            continue
        seen.add(key)
        rows.append({"수여일": awarded_at, "수여기관": org, "종류 및 근거": detail})

    return rows


def career_periods(page_lines: list[str]) -> list[dict[str, str]]:
    start = next((idx for idx, line in enumerate(page_lines) if line.startswith("사업명 직무분야 담당업무")), None)
    if start is None:
        return []

    stop = len(page_lines)
    for idx in range(start + 1, len(page_lines)):
        if page_lines[idx].startswith("「건설기술 진흥법 시행규칙」") or page_lines[idx].startswith("3. 배치금지"):
            stop = idx
            break

    body = page_lines[start + 1 : stop]
    dates = [(idx, line) for idx, line in enumerate(body) if DATE_LINE_RE.match(line)]
    periods: list[dict[str, str]] = []
    idx = 0

    while idx < len(dates):
        start_pos, start_at = dates[idx]
        if idx + 1 < len(dates):
            _, end_at = dates[idx + 1]
            next_start_pos = dates[idx + 2][0] if idx + 2 < len(dates) else len(body)
            window = body[start_pos:next_start_pos]
            idx += 2
        else:
            end_at = "근무 중" if any("근 무 중" in line or "근무 중" in line for line in body[start_pos:]) else ""
            window = body[start_pos:]
            idx += 1

        durations: list[str] = []
        for line in window:
            durations.extend(DURATION_RE.findall(line))

        periods.append(
            {
                "참여시작일": start_at,
                "참여종료일": end_at,
                "참여기간(인정일)": durations[0] if len(durations) >= 1 else "",
                "참여기간(참여일)": durations[1] if len(durations) >= 2 else (durations[0] if durations else ""),
            }
        )

    return periods


def career_rows_from_table(table: list[list[Any]]) -> list[dict[str, str]]:
    rows = [[clean(cell) for cell in row] for row in table]
    if len(rows) < 5:
        return []

    result: list[dict[str, str]] = []
    body = rows[4:]
    for idx in range(0, len(body), 4):
        chunk = body[idx : idx + 4]
        while len(chunk) < 4:
            chunk.append(["", "", "", ""])
        if not any(chunk[0]) or "사업명" in " ".join(chunk[0]):
            continue
        result.append(
            {
                "사업명": chunk[0][0] if len(chunk[0]) > 0 else "",
                "발주자": chunk[1][0] if len(chunk[1]) > 0 else "",
                "공사종류": chunk[1][1] if len(chunk[1]) > 1 else "",
                "공사(용역)개요": chunk[2][0] if len(chunk[2]) > 0 else "",
                "직무분야": chunk[0][2] if len(chunk[0]) > 2 else "",
                "전문분야": chunk[1][2] if len(chunk[1]) > 2 else "",
                "담당업무": chunk[0][3] if len(chunk[0]) > 3 else "",
                "직위": chunk[1][3] if len(chunk[1]) > 3 else "",
                "책임정도": chunk[2][2] if len(chunk[2]) > 2 else "",
                "공사(용역)금액(백만원)": chunk[2][3] if len(chunk[2]) > 3 else "",
                "적용 공법": chunk[3][0] if len(chunk[3]) > 0 else "",
                "적용 융ㆍ복합건설기술": chunk[3][1] if len(chunk[3]) > 1 else "",
                "적용 신기술 등": chunk[3][2] if len(chunk[3]) > 2 else "",
                "시설물 종류": chunk[3][3] if len(chunk[3]) > 3 else "",
            }
        )

    return result


def parse_careers(page: pdfplumber.page.Page, page_no: int) -> list[dict[str, str]]:
    lines = pdf_lines(page)
    if not any("기술경력" in line or "건설사업관리 및 감리경력" in line for line in lines):
        return []

    career_table = None
    for table in page.extract_tables():
        if table and any("사업명" in clean(cell) for cell in table[0] if cell):
            career_table = table
            break
    if not career_table:
        return []

    rows = career_rows_from_table(career_table)
    periods = career_periods(lines)
    for row, period in zip(rows, periods, strict=False):
        row.update(period)
    for row in rows:
        row["페이지"] = str(page_no)
    return rows


def parse_pdf(path: Path) -> dict[str, list[dict[str, str]]]:
    data = {sheet: [] for sheet in SHEETS}

    with pdfplumber.open(str(path)) as pdf:
        page_lines = [pdf_lines(page) for page in pdf.pages]
        all_lines = [line for lines in page_lines for line in lines]
        all_text = "\n".join(all_lines)

        basic = parse_basic_info(all_text, path.name)
        person_name = basic.get("성명(한글)", "")
        data["기본정보"].append(basic)

        data["국가기술자격"].extend(add_common(parse_qualifications(all_lines), path.name, person_name))
        data["학력"].extend(add_common(parse_education(all_lines), path.name, person_name))
        data["교육훈련"].extend(add_common(parse_training(all_lines), path.name, person_name))
        data["상훈"].extend(add_common(parse_awards(all_lines), path.name, person_name))

        for page_no, page in enumerate(pdf.pages, start=1):
            career_rows = parse_careers(page, page_no)
            for row in career_rows:
                row["성명(한글)"] = person_name
            data["기술경력"].extend(career_rows)

    return data


def collect_pdfs(input_dir: Path) -> list[Path]:
    return sorted(path for path in input_dir.glob("*.pdf") if path.is_file())


def merge_data(pdf_files: list[Path]) -> dict[str, list[dict[str, str]]]:
    merged = {sheet: [] for sheet in SHEETS}
    for pdf_file in pdf_files:
        parsed = parse_pdf(pdf_file)
        for sheet in SHEETS:
            merged[sheet].extend(parsed[sheet])
    return merged


def dedupe_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    seen: set[tuple[tuple[str, str], ...]] = set()
    for row in rows:
        if is_empty_or_header(row):
            continue
        key = tuple(sorted((key, clean(value)) for key, value in row.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(row)
    return result


def safe_output_path(output_path: Path) -> Path:
    try:
        with output_path.open("ab"):
            pass
        return output_path
    except PermissionError:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return output_path.with_name(f"{output_path.stem}_{timestamp}{output_path.suffix}")


def write_excel(data: dict[str, list[dict[str, str]]], output_path: Path) -> Path:
    output_path = safe_output_path(output_path)

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for sheet in SHEETS:
            rows = data.get(sheet, [])
            if sheet != "원문텍스트":
                rows = dedupe_rows(rows)
            df = pd.DataFrame(rows)
            if df.empty:
                df = pd.DataFrame(columns=["파일명"])
            df.to_excel(writer, sheet_name=sheet, index=False)

            worksheet = writer.sheets[sheet]
            worksheet.freeze_panes = "A2"
            for column_cells in worksheet.columns:
                values = [str(cell.value or "") for cell in column_cells[:100]]
                width = min(max((len(value) for value in values), default=8) + 2, 60)
                worksheet.column_dimensions[column_cells[0].column_letter].width = width

    return output_path


def run_conversion(input_dir: Path, output_path: Path | None = None) -> Path:
    input_dir = Path(input_dir)
    if not input_dir.exists():
        raise FileNotFoundError(f"입력 폴더가 없습니다: {input_dir}")

    pdf_files = collect_pdfs(input_dir)
    if not pdf_files:
        raise FileNotFoundError(f"PDF 파일이 없습니다: {input_dir}")

    resolved_output = output_path or (input_dir / DEFAULT_OUTPUT_NAME)
    return write_excel(merge_data(pdf_files), resolved_output)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PDF 문서를 추출해 엑셀 파일로 정리합니다.")
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT_DIR, help="PDF 파일이 있는 폴더")
    parser.add_argument("--output", type=Path, default=None, help="저장할 엑셀 파일 경로")
    return parser


class PdfToExcelApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("PDF to Excel")
        self.root.resizable(False, False)

        self.input_dir_var = tk.StringVar(value=str(DEFAULT_INPUT_DIR))
        self.output_path_var = tk.StringVar(value=str(DEFAULT_INPUT_DIR / DEFAULT_OUTPUT_NAME))
        self.status_var = tk.StringVar(value="폴더를 선택한 뒤 변환을 실행하세요.")
        self.output_customized = False
        self.running = False

        container = ttk.Frame(root, padding=12)
        container.grid(row=0, column=0, sticky="nsew")

        ttk.Label(container, text="입력 폴더").grid(row=0, column=0, sticky="w", pady=(0, 4))
        input_row = ttk.Frame(container)
        input_row.grid(row=1, column=0, sticky="ew")
        self.input_entry = ttk.Entry(input_row, textvariable=self.input_dir_var, width=52)
        self.input_entry.grid(row=0, column=0, sticky="ew")
        ttk.Button(input_row, text="찾기", command=self.select_input_dir).grid(row=0, column=1, padx=(8, 0))

        ttk.Label(container, text="저장 위치").grid(row=2, column=0, sticky="w", pady=(12, 4))
        output_row = ttk.Frame(container)
        output_row.grid(row=3, column=0, sticky="ew")
        self.output_entry = ttk.Entry(output_row, textvariable=self.output_path_var, width=52)
        self.output_entry.grid(row=0, column=0, sticky="ew")
        ttk.Button(output_row, text="찾기", command=self.select_output_path).grid(row=0, column=1, padx=(8, 0))

        action_row = ttk.Frame(container)
        action_row.grid(row=4, column=0, sticky="ew", pady=(14, 0))
        self.run_button = ttk.Button(action_row, text="변환 실행", command=self.start_conversion)
        self.run_button.grid(row=0, column=0, sticky="w")
        ttk.Label(action_row, textvariable=self.status_var).grid(row=0, column=1, sticky="w", padx=(12, 0))

        input_row.columnconfigure(0, weight=1)
        output_row.columnconfigure(0, weight=1)

    def select_input_dir(self) -> None:
        initial_dir = self.input_dir_var.get().strip() or str(DEFAULT_INPUT_DIR)
        selected = filedialog.askdirectory(parent=self.root, title="PDF 폴더 선택", initialdir=initial_dir)
        if not selected:
            return

        self.input_dir_var.set(selected)
        if not self.output_customized:
            self.output_path_var.set(str(Path(selected) / DEFAULT_OUTPUT_NAME))

    def select_output_path(self) -> None:
        initial_path = self.output_path_var.get().strip()
        selected = filedialog.asksaveasfilename(
            parent=self.root,
            title="저장할 엑셀 파일 선택",
            initialfile=Path(initial_path).name if initial_path else DEFAULT_OUTPUT_NAME,
            initialdir=str(Path(initial_path).parent) if initial_path else str(Path(self.input_dir_var.get() or DEFAULT_INPUT_DIR)),
            defaultextension=".xlsx",
            filetypes=[("Excel 파일", "*.xlsx")],
        )
        if not selected:
            return

        self.output_path_var.set(selected)
        self.output_customized = True

    def start_conversion(self) -> None:
        if self.running:
            return

        input_dir = Path(self.input_dir_var.get().strip())
        output_raw = self.output_path_var.get().strip()
        output_path = Path(output_raw) if output_raw else None

        self.running = True
        self.run_button.configure(state="disabled")
        self.status_var.set("변환 중...")

        thread = threading.Thread(target=self._worker, args=(input_dir, output_path), daemon=True)
        thread.start()

    def _worker(self, input_dir: Path, output_path: Path | None) -> None:
        try:
            saved_path = run_conversion(input_dir, output_path)
        except Exception as exc:  # noqa: BLE001
            error_text = f"{exc}\n\n{traceback.format_exc()}"
            self.root.after(0, self.on_failure, error_text)
        else:
            self.root.after(0, self.on_success, saved_path)

    def on_success(self, saved_path: Path) -> None:
        self.running = False
        self.run_button.configure(state="normal")
        self.status_var.set("완료")
        messagebox.showinfo("변환 완료", f"엑셀 파일 저장이 완료되었습니다.\n\n{saved_path}", parent=self.root)

    def on_failure(self, error_text: str) -> None:
        self.running = False
        self.run_button.configure(state="normal")
        self.status_var.set("실패")
        messagebox.showerror("변환 실패", error_text, parent=self.root)


def run_gui() -> None:
    root = tk.Tk()
    PdfToExcelApp(root)
    root.mainloop()


def entrypoint() -> None:
    if len(sys.argv) > 1:
        args = build_parser().parse_args()
        saved_path = run_conversion(args.input_dir, args.output)
        print(f"완료: {saved_path}")
        return

    run_gui()


def main() -> None:
    parser = argparse.ArgumentParser(description="PDF 문구를 추출해 엑셀 파일로 정리합니다.")
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT_DIR, help="PDF 파일이 있는 폴더")
    parser.add_argument("--output", type=Path, default=None, help="저장할 엑셀 파일 경로")
    args = parser.parse_args()

    input_dir = args.input_dir
    if not input_dir.exists():
        raise SystemExit(f"입력 폴더가 없습니다: {input_dir}")

    pdf_files = collect_pdfs(input_dir)
    if not pdf_files:
        raise SystemExit(f"PDF 파일이 없습니다: {input_dir}")

    output_path = args.output or (input_dir / DEFAULT_OUTPUT_NAME)
    saved_path = write_excel(merge_data(pdf_files), output_path)
    print(f"완료: {saved_path}")


if __name__ == "__main__":
    entrypoint()
