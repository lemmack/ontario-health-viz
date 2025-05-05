# Dockerfile
# Use the official Golang image to create a build artifact.
FROM golang:1.24-alpine as builder

WORKDIR /app

# Copy local go mod and sum files to WORKDIR and download dependencies.
COPY go.mod go.sum ./
RUN go mod download

# Copy local source code to WORKDIR.
COPY . .

# Build the binary.
# -ldflags="-w -s" reduces the size of the static binary.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/water-quality-service ./main.go

# Use a minimal alpine image to run the compiled binary.
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage.
COPY --from=builder /app/water-quality-service /app/water-quality-service

# Expose the port the app runs on.
EXPOSE 8081

# Command to run the executable.
CMD ["/app/water-quality-service"]