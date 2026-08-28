import os
import json
import numpy as np
from pypdf import PdfReader
import imageio.v2 as imageio
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
VIDEO_PATH = os.path.join(DATA_DIR, "projectile.mp4")
PDF_PATH = os.path.join(DATA_DIR, "projectile.pdf")
FRAMES_DIR = os.path.join(DATA_DIR, "frames")
KB_PATH = os.path.join(DATA_DIR, "knowledge_base.json")

os.makedirs(FRAMES_DIR, exist_ok=True)

def extract_video_frames(interval_seconds=10):
    print(f"Checking video: {VIDEO_PATH}")
    if not os.path.exists(VIDEO_PATH):
        print(f"Warning: {VIDEO_PATH} not found.")
        return []

    print(f"Extracting keyframes every {interval_seconds}s from video...")
    frames_metadata = []
    try:
        reader = imageio.get_reader(VIDEO_PATH, format="ffmpeg")
        fps = reader.get_meta_data().get("fps", 30)
        duration = reader.get_meta_data().get("duration", 0)
        total_frames = reader.count_frames()
        print(f"Video FPS: {fps}, Duration: {duration:.1f}s, Total Frames: {total_frames}")

        frame_step = int(fps * interval_seconds)
        if frame_step < 1:
            frame_step = int(fps) or 1

        frame_idx = 0
        saved_count = 0
        for i, frame in enumerate(reader):
            if i % frame_step == 0:
                timestamp = i / fps
                frame_filename = f"frame_{saved_count:03d}.jpg"
                frame_path = os.path.join(FRAMES_DIR, frame_filename)
                
                img = Image.fromarray(frame)
                # Resize if very large for fast web delivery
                img.thumbnail((1280, 720))
                img.save(frame_path, quality=85)
                
                frames_metadata.append({
                    "id": f"frame_{saved_count}",
                    "type": "video_frame",
                    "filename": frame_filename,
                    "timestamp": round(timestamp, 2),
                    "description": f"Kinematics Lecture Visual at {int(timestamp//60)}m {int(timestamp%60)}s"
                })
                saved_count += 1
        reader.close()
        print(f"Extracted {saved_count} keyframes to {FRAMES_DIR}")
    except Exception as e:
        print(f"Error processing video frames: {e}")

    return frames_metadata

def extract_pdf_content():
    print(f"Reading PDF: {PDF_PATH}")
    if not os.path.exists(PDF_PATH):
        print(f"Warning: {PDF_PATH} not found.")
        return []

    chunks = []
    try:
        reader = PdfReader(PDF_PATH)
        print(f"Found {len(reader.pages)} pages in PDF.")
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = text.strip()
            if not text:
                continue
            
            # Split into reasonable topic paragraphs
            paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            if not paragraphs:
                paragraphs = [text]

            for p_idx, para in enumerate(paragraphs):
                chunks.append({
                    "id": f"pdf_p{page_num+1}_{p_idx}",
                    "type": "pdf_note",
                    "page": page_num + 1,
                    "text": para
                })
        print(f"Extracted {len(chunks)} text chunks from PDF.")
    except Exception as e:
        print(f"Error reading PDF: {e}")

    return chunks

def build_knowledge_base():
    video_frames = extract_video_frames(interval_seconds=8)
    pdf_chunks = extract_pdf_content()

    # Link chunks to relevant frames sequentially or by concept
    curriculum_items = []
    
    # Pair PDF chunks with frames
    num_frames = len(video_frames)
    for i, chunk in enumerate(pdf_chunks):
        associated_frame = video_frames[min(i, num_frames - 1)]["filename"] if num_frames > 0 else ""
        curriculum_items.append({
            "id": chunk["id"],
            "topic": "Kinematics & Projectile Motion",
            "text": chunk["text"],
            "page": chunk["page"],
            "frame_to_display": associated_frame
        })

    # Also register standalone visual keyframes
    for frame in video_frames:
        curriculum_items.append({
            "id": frame["id"],
            "topic": "Video Lecture Visual",
            "text": frame["description"],
            "timestamp": frame["timestamp"],
            "frame_to_display": frame["filename"]
        })

    kb_data = {
        "course_title": "Kinematics: 1D & 2D Projectile Motion",
        "total_items": len(curriculum_items),
        "total_frames": len(video_frames),
        "items": curriculum_items
    }

    with open(KB_PATH, "w", encoding="utf-8") as f:
        json.dump(kb_data, f, indent=2)

    print(f"\nKnowledge base generated successfully with {len(curriculum_items)} grounded multimodal items!")
    print(f"Saved to: {KB_PATH}")

if __name__ == "__main__":
    build_knowledge_base()
