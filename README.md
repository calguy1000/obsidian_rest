# Obsidian REST App

This project is an Express application running in a Docker environment. It provides a simple API for file management with shared key authentication.

## Features

- List files
- Get a specific file
- Append data to a file
- Delete a file
- Create a new file
- Authenticate and get a JWT token

## Technologies Used

- Node.js
- Express
- TypeScript
- Docker

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/calguy1000/obsidian_rest.git
   ```

2. Navigate to the project directory:

   ```
   cd obsidian_rest
   ```

3. Build the Docker image:

   ```
   docker-compose build
   ```

### Running the Application

To start the application, run:

```
make creaetkey
make run
```

The application will be available at `http://localhost:3000`.

### API Endpoints

#### Authentication

- `PUT /auth` - Authenticate and get a JWT token
  - Headers:
    - `x-api-key`: Your API key
  - Response:
    - `200 OK`: `{ "token": "your_jwt_token", "message": "Authentication successful" }`
    - `401 Unauthorized`: `{ "message": "Token error" }`
    - `400 Bad Request`: `{ "message": "Token error 1012" }`

#### Vault

- `GET /api/vault` - List all files
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Response:
    - `200 OK`: `[ "file1.md", "file2.md", ... ]`
    - `500 Internal Server Error`: `{ "message": "Error reading vault directory" }`

- `GET /api/vault/:filename` - Get a specific file
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Response:
    - `200 OK`: `{ "content": "file content", "stats": { "createdAt": "date", "modifiedAt": "date", "isWritable": true } }`
    - `400 Bad Request`: `{ "message": "Invalid file name" }`
    - `404 Not Found`: `{ "message": "File not found" }`
    - `403 Forbidden`: `{ "message": "File is not readable" }`
    - `500 Internal Server Error`: `{ "message": "Error reading file" }`

- `PATCH /api/vault/:filename` - Append data to a file
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Body:
    - `{ "content": "content to append" }`
  - Response:
    - `200 OK`: `{ "message": "Content appended successfully" }`
    - `400 Bad Request`: `{ "message": "Invalid file name" }`
    - `404 Not Found`: `{ "message": "File not found" }`
    - `403 Forbidden`: `{ "message": "File is not readable or writable" }`
    - `500 Internal Server Error`: `{ "message": "Error appending to file" }`

- `DELETE /api/vault/:filename` - Delete a file
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Response:
    - `200 OK`: `{ "message": "File deleted successfully" }`
    - `400 Bad Request`: `{ "message": "Invalid file name" }`
    - `404 Not Found`: `{ "message": "File not found" }`
    - `403 Forbidden`: `{ "message": "File is not readable or writable" }`
    - `500 Internal Server Error`: `{ "message": "Error deleting file" }`

- `POST /api/vault` - Create a new file
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Body:
    - `{ "fileName": "newfile.md", "title": "New File" }`
  - Response:
    - `201 Created`: `{ "message": "File created successfully" }`
    - `400 Bad Request`: `{ "message": "Invalid file name" }`
    - `409 Conflict`: `{ "message": "File already exists" }`
    - `500 Internal Server Error`: `{ "message": "Error creating file" }`

### Authentication

The application uses shared key authentication. Include the following header in your requests

### License

This project is licensed under the MIT License.