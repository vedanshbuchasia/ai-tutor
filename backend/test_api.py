import requests

BASE_URL = "http://localhost:8000"

def test_api():
    print("=== Testing Scalable Multi-User REST Endpoints ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/")
    print("\n1. Health Check:", res.json())

    # 2. Start session for Student 'Vedansh'
    user_req = {"user_id": "vedansh_01", "user_name": "Vedansh"}
    res = requests.post(f"{BASE_URL}/api/v1/session/start", json=user_req)
    print("\n2. Session Started Profile:", res.json())

    # 3. 1-on-1 Interaction: Initial turn
    turn_req = {
        "user_id": "vedansh_01",
        "user_message": "Hello Professor, let's start the kinematics session."
    }
    res = requests.post(f"{BASE_URL}/api/v1/tutor/interact", json=turn_req)
    turn_data = res.json()
    print("\n3. Tutor Turn Response:")
    print("   - Spoken Dialogue:", turn_data["spoken_dialogue"][:100], "...")
    print("   - Whiteboard Math:", turn_data["whiteboard"]["math_latex"])
    print("   - Whiteboard Action:", turn_data["whiteboard"]["action_name"])
    print("   - Mastery Score:", turn_data["user_mastery"], "%")

    # 4. User Profile check
    res = requests.get(f"{BASE_URL}/api/v1/user/vedansh_01")
    print("\n4. Updated User Profile:", res.json())

if __name__ == "__main__":
    test_api()
