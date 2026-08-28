from flask import Flask, render_template, request, jsonify
from pathlib import Path
import joblib
import numpy as np

app = Flask(__name__)

ROOT = Path(__file__).resolve().parent
ART  = ROOT / "artifacts"

model = class_encoder = customer_encoder = travel_encoder = scaler = None

def load_models():
    global model, class_encoder, customer_encoder, travel_encoder, scaler
    try:
        model            = joblib.load(ART / "best_model.pkl")
        class_encoder    = joblib.load(ART / "class_encoder.pkl")
        customer_encoder = joblib.load(ART / "customer_encoder.pkl")
        travel_encoder   = joblib.load(ART / "travel_type_encoder.pkl")
        scaler           = joblib.load(ART / "input_scaler.pkl")
        return True
    except FileNotFoundError as e:
        print(f"[WARNING] Model not loaded: {e}")
        return False

models_loaded = load_models()

@app.route("/")
def index():
    return render_template("index.html", models_loaded=models_loaded)

@app.route("/predict", methods=["POST"])
def predict():
    if not models_loaded:
        return jsonify({"error": "Model files missing from artifacts/ folder."}), 500

    d = request.get_json()

    gender = 0 if d["gender"] == "Male" else 1

    try:
        cust = customer_encoder[d["customer_type"]]
        trav = travel_encoder[d["type_of_travel"]]
        cls  = class_encoder[d["class_"]]
    except KeyError as e:
        return jsonify({"error": f"Encoding error: {e}"}), 400

    features = np.array([[
        gender,
        cust,
        int(d["age"]),
        trav,
        cls,
        int(d["flight_distance"]),
        int(d["inflight_wifi_service"]),
        int(d["departure_arrival_time_convenient"]),
        int(d["ease_of_online_booking"]),
        int(d["gate_location"]),
        int(d["food_and_drink"]),
        int(d["online_boarding"]),
        int(d["seat_comfort"]),
        int(d["inflight_entertainment"]),
        int(d["on_board_service"]),
        int(d["leg_room_service"]),
        int(d["baggage_handling"]),
        int(d["checkin_service"]),
        int(d["inflight_service"]),
        int(d["cleanliness"]),
        int(d["departure_delay"]),
        int(d["arrival_delay"]),
    ]])

    scaled     = scaler.transform(features)
    prediction = int(model.predict(scaled)[0])

    try:
        proba = float(model.predict_proba(scaled)[0][1])
    except Exception:
        proba = None

    return jsonify({
        "prediction": prediction,
        "proba":      proba,
        "label":      "Satisfied" if prediction == 1 else "Neutral / Dissatisfied"
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
