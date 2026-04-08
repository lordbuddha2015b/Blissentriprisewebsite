import argparse
import hashlib
import os
from pathlib import Path

import fitz


def extract_images(pdf_path: Path, output_folder: Path) -> list[str]:
    output_folder.mkdir(parents=True, exist_ok=True)

    saved_files: list[str] = []
    seen_hashes: set[str] = set()
    img_count = 1

    with fitz.open(pdf_path) as doc:
        for page_index in range(len(doc)):
            page = doc[page_index]
            image_list = page.get_images(full=True)

            for img in image_list:
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)

                if pix.alpha or pix.colorspace is None or pix.colorspace.n > 3:
                    pix = fitz.Pixmap(fitz.csRGB, pix)

                image_bytes = pix.tobytes("png")
                image_hash = hashlib.sha256(image_bytes).hexdigest()

                if image_hash in seen_hashes:
                    continue

                seen_hashes.add(image_hash)
                image_filename = output_folder / f"image_{img_count}.png"
                pix.save(image_filename)
                saved_files.append(str(image_filename))
                img_count += 1

    return saved_files


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract embedded images from a PDF into sequential PNG files."
    )
    parser.add_argument(
        "pdf_path",
        nargs="?",
        default="company_profile.pdf",
        help="Path to the source PDF. Defaults to company_profile.pdf",
    )
    parser.add_argument(
        "--output",
        default="images",
        help="Output directory for extracted images. Defaults to images",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path).resolve()
    output_folder = Path(args.output).resolve()

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    saved_files = extract_images(pdf_path, output_folder)

    if saved_files:
        print("Saved files:")
        for file_path in saved_files:
            print(file_path)
        print(f"Images extracted successfully: {len(saved_files)} file(s)")
    else:
        print("No embedded images found in the PDF.")


if __name__ == "__main__":
    main()
