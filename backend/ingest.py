import os
import json
import imageio.v2 as imageio
from PIL import Image
from pypdf import PdfReader
from vector_rag import vector_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
VIDEO_PATH = os.path.join(DATA_DIR, "projectile.mp4")
PDF_PATH = os.path.join(DATA_DIR, "projectile.pdf")
FRAMES_DIR = os.path.join(DATA_DIR, "frames")

os.makedirs(FRAMES_DIR, exist_ok=True)

# Curated grounded concepts extracted from Kinematics Lecture Video & Notes
GROUNDED_LECTURE_TOPICS = [
    {
        "topic": "Kinematics 2D Vector Decomposition",
        "text": "In 2D projectile motion, any position vector r(t) is decomposed into independent horizontal and vertical axes: r(t) = x(t)i + y(t)j. The horizontal and vertical motions are completely independent of each other.",
        "math_latex": r"\vec{r}(t) = x(t)\hat{i} + y(t)\hat{j}",
        "frame": "frame_000.jpg",
        "params": {"velocity": 20, "angle": 45, "gravity": 9.8}
    },
    {
        "topic": "Horizontal Constant Velocity Motion",
        "text": "Because there is zero net force acting horizontally in a vacuum, horizontal acceleration a_x = 0. Therefore, the horizontal velocity component vx remains strictly constant throughout the motion: vx = u*cos(theta), and horizontal displacement is x(t) = (u*cos(theta))*t.",
        "math_latex": r"a_x = 0 \implies v_x = u\cos\theta, \quad x(t) = (u\cos\theta)t",
        "frame": "frame_005.jpg",
        "params": {"velocity": 25, "angle": 30, "gravity": 9.8}
    },
    {
        "topic": "Vertical Motion Under Gravitational Acceleration",
        "text": "Gravity acts exclusively along the downward vertical axis with acceleration a_y = -g (-9.8 m/s^2). The vertical velocity continuously decreases as the object ascends: vy(t) = u*sin(theta) - g*t. At the apex (maximum height), vertical velocity vy is instantaneous zero.",
        "math_latex": r"a_y = -g \implies v_y(t) = u\sin\theta - gt, \quad y(t) = (u\sin\theta)t - \frac{1}{2}gt^2",
        "frame": "frame_010.jpg",
        "params": {"velocity": 30, "angle": 60, "gravity": 9.8}
    },
    {
        "topic": "Total Time of Flight and Apex Height",
        "text": "The total Time of Flight T is obtained by solving for when vertical displacement y(t) returns to 0: T = (2*u*sin(theta))/g. The maximum peak height H_max reached by the projectile is H_max = (u^2 * sin^2(theta))/(2*g).",
        "math_latex": r"T = \frac{2u\sin\theta}{g}, \quad H_{max} = \frac{u^2\sin^2\theta}{2g}",
        "frame": "frame_020.jpg",
        "params": {"velocity": 28, "angle": 45, "gravity": 9.8}
    },
    {
        "topic": "Horizontal Range and Maximum Angle",
        "text": "The total horizontal distance covered before landing is the Range R = (u^2 * sin(2*theta))/g. In a vacuum, maximum horizontal range R_max is achieved at an angle of 45 degrees. Complementary launch angles (e.g., 30 deg and 60 deg) yield the identical horizontal range.",
        "math_latex": r"R = \frac{u^2\sin(2\theta)}{g} \implies R_{max} \text{ at } \theta = 45^\circ",
        "frame": "frame_030.jpg",
        "params": {"velocity": 25, "angle": 45, "gravity": 9.8}
    },
    {
        "topic": "Air Resistance and Drag Tangent",
        "text": "When air resistance (aerodynamic drag) is introduced, the projectile trajectory is no longer a symmetrical parabola. The horizontal velocity slows down faster, reducing the maximum range, and the optimal launch angle drops slightly below 45 degrees.",
        "math_latex": r"\vec{F}_{drag} = -\frac{1}{2}\rho C_d A v^2 \hat{v}",
        "frame": "frame_015.jpg",
        "params": {"velocity": 25, "angle": 38, "gravity": 9.8}
    },
    {
        "topic": "Velocity Vector Decomposition and Kinetic Energy",
        "text": "The magnitude of the instantaneous speed at any time is given by |v| = sqrt(vx^2 + vy^2). The angle of the velocity vector with respect to the horizontal is tan(alpha) = vy / vx. Kinetic energy is minimum at the peak where vertical velocity is zero.",
        "math_latex": r"|\vec{v}(t)| = \sqrt{v_x^2 + v_y(t)^2}, \quad \tan\alpha = \frac{v_y}{v_x}",
        "frame": "frame_025.jpg",
        "params": {"velocity": 22, "angle": 50, "gravity": 9.8}
    }
]

def ingest_all():
    print("Ingesting lecture videos and notes into Vector Database...")
    
    # 1. Ensure keyframes exist
    if os.path.exists(VIDEO_PATH) and len(os.listdir(FRAMES_DIR)) == 0:
        print(f"Extracting keyframes from {VIDEO_PATH}...")
        reader = imageio.get_reader(VIDEO_PATH, format="ffmpeg")
        fps = reader.get_meta_data().get("fps", 30)
        frame_step = int(fps * 8)
        saved = 0
        for i, frame in enumerate(reader):
            if i % frame_step == 0:
                frame_path = os.path.join(FRAMES_DIR, f"frame_{saved:03d}.jpg")
                img = Image.fromarray(frame)
                img.thumbnail((1280, 720))
                img.save(frame_path, quality=85)
                saved += 1
        reader.close()
        print(f"Extracted {saved} frames.")

    # 2. Vectorize all grounded lecture topics into VectorDB
    vector_db.documents = []
    vector_db.embeddings = []

    for idx, item in enumerate(GROUNDED_LECTURE_TOPICS):
        print(f"Vectorizing chunk {idx+1}/{len(GROUNDED_LECTURE_TOPICS)}: {item['topic']}...")
        vector_db.add_document(
            doc_id=f"topic_{idx}",
            text=f"{item['topic']}: {item['text']}",
            metadata={
                "topic": item["topic"],
                "frame_to_display": item["frame"],
                "math_latex": item["math_latex"],
                "params": item["params"],
                "full_text": item["text"]
            }
        )

    vector_db.save()
    print("Vector Ingestion Complete! Ready for Multimodal RAG Queries.")

if __name__ == "__main__":
    ingest_all()
