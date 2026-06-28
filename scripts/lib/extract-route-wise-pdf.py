#!/usr/bin/env python3
"""Extract route-wise student rows from IDPS transport PDF report."""

import json
import re
import sys
from typing import Dict, List, Optional, Set

try:
    import fitz  # PyMuPDF
except ImportError:
    print(json.dumps({"error": "PyMuPDF not installed. Run: pip install pymupdf"}), file=sys.stderr)
    sys.exit(1)


SKIP_LINES = {
    "SR",
    "ADM",
    "NO",
    "NAME",
    "FATHER'S NAME",
    "CLASS",
    "CONTACT NO",
    "ADDRESS",
    "ROUTE",
    "IDPS",
    "ROUTE WISE STUDENT LIST",
}


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_key(value: str) -> str:
    return normalize_space(value).replace("(CO- SPARK)", "(CO-SPARK)").upper()


def merge_buffer_lines(lines: List[str]) -> List[str]:
    merged: List[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.search(r"\(CO-\s*$", line, re.I) and i + 1 < len(lines):
            merged.append(normalize_space(f"{line} {lines[i + 1]}"))
            i += 2
            continue
        merged.append(line)
        i += 1
    return merged


def parse_buffer(lines: List[str]) -> Optional[Dict[str, str]]:
    merged = merge_buffer_lines([normalize_space(line) for line in lines if line])
    if not merged:
        return None

    # If first line still contains admission+name merged, peel leading name tokens after digits.
    if merged and re.match(r"^\d", merged[0]):
        merged[0] = re.sub(r"^\d+\s*", "", merged[0]).strip()
        if not merged[0] and len(merged) > 1:
            merged = merged[1:]

    class_idx = None
    for idx, line in enumerate(merged):
        if re.search(r"^(I{1,3}|IV|VI{0,3}|IX|X{1,2}|XI{1,2}|XII|PP2\s*\(UKG\))\s*-", line, re.I):
            class_idx = idx
            break

    if class_idx is None:
        # Try inline class anywhere in joined text
        joined = normalize_space(" ".join(merged))
        inline = re.search(
            r"(I{1,3}|IV|VI{0,3}|IX|X{1,2}|XI{1,2}|XII|PP2\s*\(UKG\))\s*-\s*[A-Z0-9()\- ]+",
            joined,
            re.I,
        )
        if not inline:
            return None
        before = joined[: inline.start()].strip()
        class_label = normalize_space(inline.group(0))
        tail = joined[inline.end() :].strip()
        name = before.split(" ", 2)[0] if before else ""
        father = normalize_space(before[len(name) :]) if before else ""
    else:
        name = merged[0]
        father = normalize_space(" ".join(merged[1:class_idx])) if class_idx > 1 else ""
        class_label = normalize_space(merged[class_idx])
        tail = normalize_space(" ".join(merged[class_idx + 1 :]))

    class_label = re.sub(r"\s*-\s*$", "", class_label).strip()
    class_label = re.sub(r"\s+\d{10}.*$", "", class_label).strip()

    phones = re.findall(r"\d{10}", tail)
    address = tail
    for phone in phones:
        address = address.replace(phone, " ")
    address = normalize_space(address)

    return {
        "name": name,
        "fatherName": father,
        "classLabel": class_label,
        "phones": phones,
        "contactNo": phones[0] if phones else "",
        "address": address,
    }


def parse_section(body: str, route: str, driver_name: str, driver_mobile: str) -> List[Dict]:
    students: List[Dict] = []

    starts = list(re.finditer(r"\n(\d{1,3})\n(\d{1,4})(?:\n|\s+)", body))
    for idx, match in enumerate(starts):
        sr = match.group(1)
        adm = match.group(2)
        start = match.end()
        end = starts[idx + 1].start() if idx + 1 < len(starts) else len(body)
        chunk = body[start:end]
        chunk = re.sub(rf"\n{re.escape(route)}\s*$", "", chunk.strip(), flags=re.I)

        lines = [normalize_space(line) for line in chunk.split("\n") if normalize_space(line)]
        if not lines and chunk.strip():
            lines = [normalize_space(chunk)]

        parsed = parse_buffer(lines)
        if not parsed:
            continue

        students.append(
            {
                "sr": sr,
                "admissionNo": str(int(adm)) if adm.isdigit() else adm,
                "route": route.upper(),
                "driverName": driver_name,
                "driverMobile": driver_mobile,
                **parsed,
            }
        )

    return students


def extract_pdf(pdf_path: str, adm_hints: Set[str]) -> Dict:
    del adm_hints  # reserved for future validation hints
    doc = fitz.open(pdf_path)
    text = "".join(page.get_text() for page in doc)

    sections = re.split(
        r"ROUTE\s*:\s*(R\d{1,2})\s*\|\s*DRIVER NAME\s*:\s*([^|]+?)\|\s*DRIVER MOBILE NO\.\s*:\s*(\d+)",
        text,
        flags=re.IGNORECASE,
    )

    routes = []
    students: List[Dict] = []
    i = 1
    while i + 3 < len(sections):
        route = sections[i].upper()
        driver_name = normalize_space(sections[i + 1])
        driver_mobile = normalize_space(sections[i + 2])
        body = sections[i + 3]
        i += 4

        route_students = parse_section(body, route, driver_name, driver_mobile)
        students.extend(route_students)
        routes.append(
            {
                "route": route,
                "driverName": driver_name,
                "driverMobile": driver_mobile,
                "studentCount": len(route_students),
            }
        )

    return {"routes": routes, "students": students}


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: extract-route-wise-pdf.py <pdf-path> [admission-numbers-json]", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    adm_hints: Set[str] = set()
    if len(sys.argv) >= 3:
        with open(sys.argv[2], encoding="utf-8") as handle:
            payload = json.load(handle)
            adm_hints = {str(item).strip() for item in payload if str(item).strip()}

    result = extract_pdf(pdf_path, adm_hints)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
