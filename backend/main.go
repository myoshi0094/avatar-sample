package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type AvatarConfig struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Position Position `json:"position"`
	Color   string   `json:"color"`
	Scale   float64  `json:"scale"`
	Visible bool     `json:"visible"`
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func avatarConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	config := AvatarConfig{
		ID:   "avatar-001",
		Name: "Default Avatar",
		Position: Position{
			X: 0,
			Y: 0,
			Z: 0,
		},
		Color:   "#4F46E5",
		Scale:   1.0,
		Visible: true,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(config); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/avatar-config", corsMiddleware(avatarConfigHandler))

	addr := ":8080"
	log.Printf("backend listening on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
