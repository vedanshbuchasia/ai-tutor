import os
from qdrant_rag import qdrant_rag

GROUNDED_CHUNKS = [
    {
        "topic": "2D Vector Decomposition",
        "text": "In two dimensional projectile motion, position and velocity are broken down into independent x and y vector components: r(t) = x(t)i + y(t)j. Horizontal motion does not affect vertical fall time.",
        "math_latex": r"\vec{r}(t) = x(t)\hat{i} + y(t)\hat{j}",
        "frame": "frame_000.jpg",
        "params": {"velocity": 20, "angle": 45, "gravity": 9.8}
    },
    {
        "topic": "Horizontal Constant Velocity (ax = 0)",
        "text": "Because there is no horizontal acceleration (ax = 0), horizontal velocity vx remains constant throughout flight: vx = u*cos(theta), and displacement is x = (u*cos(theta))*t.",
        "math_latex": r"a_x = 0 \implies v_x = u\cos\theta, \quad x(t) = (u\cos\theta)t",
        "frame": "frame_005.jpg",
        "params": {"velocity": 25, "angle": 30, "gravity": 9.8}
    },
    {
        "topic": "Vertical Motion & Gravitational Deceleration",
        "text": "Gravity pulls downward with acceleration ay = -g (-9.8 m/s^2). The vertical velocity continuously decreases: vy(t) = u*sin(theta) - g*t. At the maximum height peak (apex), vertical velocity vy is zero.",
        "math_latex": r"a_y = -g \implies v_y(t) = u\sin\theta - gt, \quad y(t) = (u\sin\theta)t - \frac{1}{2}gt^2",
        "frame": "frame_010.jpg",
        "params": {"velocity": 30, "angle": 60, "gravity": 9.8}
    },
    {
        "topic": "Time of Flight and Maximum Apex Height",
        "text": "Total flight time is T = (2*u*sin(theta))/g when the projectile lands. Peak maximum height is H_max = (u^2 * sin^2(theta))/(2*g).",
        "math_latex": r"T = \frac{2u\sin\theta}{g}, \quad H_{max} = \frac{u^2\sin^2\theta}{2g}",
        "frame": "frame_020.jpg",
        "params": {"velocity": 28, "angle": 45, "gravity": 9.8}
    },
    {
        "topic": "Horizontal Range & Optimal Launch Angle",
        "text": "Horizontal range is R = (u^2 * sin(2*theta))/g. Maximum range is achieved at 45 degrees. Complementary angles like 30 and 60 degrees achieve the same horizontal distance.",
        "math_latex": r"R = \frac{u^2\sin(2\theta)}{g} \implies R_{max} \text{ at } \theta = 45^\circ",
        "frame": "frame_030.jpg",
        "params": {"velocity": 25, "angle": 45, "gravity": 9.8}
    },
    {
        "topic": "Aerodynamic Air Resistance & Drag",
        "text": "Air resistance causes drag opposite to velocity, reducing horizontal range and making the trajectory steeper on the downward path, shifting optimal angle below 45 degrees.",
        "math_latex": r"\vec{F}_{drag} = -\frac{1}{2}\rho C_d A v^2 \hat{v}",
        "frame": "frame_015.jpg",
        "params": {"velocity": 25, "angle": 38, "gravity": 9.8}
    }
]

def run_ingest():
    print("Ingesting grounded kinematics concepts into Qdrant Vector Database...")
    qdrant_rag.upsert_chunks(GROUNDED_CHUNKS)
    print("Ingestion complete!")

if __name__ == "__main__":
    run_ingest()
