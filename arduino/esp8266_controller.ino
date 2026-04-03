/**
 * Home Automation — ESP8266 Controller
 * Polls backend every 2s and controls GPIO pins via relay module
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClient.h>

// ── Configuration — CHANGE THESE ──────────────────────────
const char* WIFI_SSID     = "moto g62 5G_6286";       // your WiFi name
const char* WIFI_PASSWORD = "08520852";   // your WiFi password
const char* SERVER_IP     =  "10.133.230.93";
;       // your PC's local IP (see below)
const int   SERVER_PORT   = 5000;
const int   USER_ID       = 1;                     // your user ID from DB
const int   POLL_INTERVAL = 2000;                  // poll every 2 seconds

// ── Pin map: device DB id → GPIO pin ──────────────────────
// We'll dynamically assign these from the API response
// Max 8 devices supported
#define MAX_DEVICES 8
int deviceIds[MAX_DEVICES];
int devicePins[MAX_DEVICES];
int deviceCount = 0;

// ── WiFi + HTTP client ─────────────────────────────────────
WiFiClient   wifiClient;
HTTPClient   http;

unsigned long lastPoll = 0;

// ──────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\n\n=== Home Automation ESP8266 ===");

  // Connect to WiFi
  connectWiFi();

  // Initial device discovery
  fetchAndApply();
}

// ──────────────────────────────────────────────────────────
void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting...");
    connectWiFi();
  }

  // Poll backend on interval
  unsigned long now = millis();
  if (now - lastPoll >= POLL_INTERVAL) {
    lastPoll = now;
    fetchAndApply();
  }
}

// ──────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✓ Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n✗ WiFi connection failed. Restarting...");
    ESP.restart();
  }
}

// ──────────────────────────────────────────────────────────
void fetchAndApply() {
  String url = String("http://") + SERVER_IP + ":" + SERVER_PORT
             + "/api/esp/status?user_id=" + USER_ID;

  http.begin(wifiClient, url);
  http.setTimeout(5000);

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("Response: " + payload);
    parseAndApply(payload);
  } else {
    Serial.printf("HTTP error: %d\n", httpCode);
  }

  http.end();
}

// ──────────────────────────────────────────────────────────
void parseAndApply(String json) {
  // Allocate JSON document
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, json);

  if (error) {
    Serial.printf("JSON parse error: %s\n", error.c_str());
    return;
  }

  if (!doc["success"]) return;

  JsonArray devices = doc["devices"].as<JsonArray>();
  deviceCount = 0;

  for (JsonObject device : devices) {
    if (deviceCount >= MAX_DEVICES) break;

    int id    = device["id"];
    int pin   = device["pin"];
    int state = device["state"];   // 1=ON, 0=OFF

    // Register pin on first encounter
    bool known = false;
    for (int i = 0; i < deviceCount; i++) {
      if (deviceIds[i] == id) { known = true; break; }
    }

    if (!known) {
      deviceIds[deviceCount]  = id;
      devicePins[deviceCount] = pin;
      deviceCount++;
      pinMode(pin, OUTPUT);
      Serial.printf("Registered device %d on pin %d\n", id, pin);
    }

    // Apply state to GPIO
    digitalWrite(pin, state == 1 ? HIGH : LOW);
    Serial.printf("Device %d (pin %d) → %s\n", id, pin, state ? "ON" : "OFF");
  }
}