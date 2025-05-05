// main.go
package main

import (
	"log"
	"net/http"
	"os"
	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Default port for local dev
	}

	// Create a Gin router with default middleware (logger, recovery)
	router := gin.Default()

	// --- Define API Routes ---
	// Group routes under /api/v1/water for better organization
	v1 := router.Group("/api/v1/water")
	{
		// Register the health check handler for GET requests on /api/v1/water/health
		v1.GET("/health", healthCheckHandler)

		// Add other water quality routes here later...
		// v1.GET("/quality", getWaterQualityHandler)
		// v1.GET("/advisories", getAdvisoriesHandler)
	}

	// --- Start the Server ---
	log.Printf("Water Quality Service starting on port %s using Gin...\n", port)

	// router.Run() listens on the specified address (e.g., ":8081")
	// It wraps http.ListenAndServe internally
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Could not start Gin server: %s\n", err)
	}
}

// healthCheckHandler is the handler function for the health check endpoint
// Note the function signature now takes *gin.Context
func healthCheckHandler(c *gin.Context) {
	// Use c.JSON() for easy JSON responses
	// gin.H is a shortcut for map[string]interface{}
	c.JSON(http.StatusOK, gin.H{
		"status":  "OK",
		"service": "Water Quality Service",
	})
}

// Define handlers for other routes here later...
/*
func getWaterQualityHandler(c *gin.Context) {
	// Logic to fetch and return water quality data
	c.JSON(http.StatusOK, gin.H{"message": "Water quality data endpoint"})
}

func getAdvisoriesHandler(c *gin.Context) {
	// Logic to fetch and return water advisory data
	c.JSON(http.StatusOK, gin.H{"message": "Water advisories endpoint"})
}
*/