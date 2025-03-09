# Obsidian REST App

This project is an Express application running in a Docker environment. It provides a simple API for file management with shared key authentication.

This project does not provide an Obsidian plugin. It directly modifies the markdown files of an Obsidian vault.

I wrote this package in order to be able to play with my obsidian vault from within an alexa skill so it has only the functionality I thought that I may need. I also wrote this project because at the same time I was experimenting with node.js, express and all of that, alexa skills (python) and docker/docker-compose. I have attempted to provide a reasonable amount of documentation, however your mileage may vary.

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
- jest
- TypeScript
- Docker
- Docker-compose
- jwt

### Prerequisites

- Docker
- Docker Compose
- gnu make
- openssl binaries (for setting the initial pre-shared key)
- A working obsidian vault

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/calguy1000/obsidian_rest.git
   ```

2. Navigate to the project directory:

   ```
   cd obsidian_rest
   ```

3. Setup the environment

    - build the required directories and generate a preshared key
      ```
      make setup
      ```
    - change the  'docker-compose.yml' volume to point to your vault.  i.e:
      ```
      - "/home/rob/Documents/My Vault:/vault
      ```
    - build the container and run the server
      ```
      make server
      ```
        The application will be available at `http://localhost:3000`.

### Authentication

The application uses shared key authentication. A random pre-shared key is generated on setup and stored in the .env file.  You must use this when configuring your client.

### Security

This application is not to be considered as secure. It is for use in home labs, or over other secured connections (secure tunnels, vpn's etc).  
However, some small steps have been taken to provide a level of security:
    - A random pre-shared key is generated on initial setup
    - This pre-shared key must be provided to the /auth method in order to receive an authorization token
    - The authorization token is only valid for 30 minutes.
    - Only one authorization token is provided at a time.  i.e: it is stored as a static file in the private web directory.  
      If another account tries to create one (assuming they got the pre-shared key), if a token existed and was not expired, 
      the request would fail.
    - If the pre-shared key changes on the server side, the authorization token is invalidated. If you feel your site has been
      compromised, change the pre-shared key by running 'make genkey'

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

- `GET /api/vault/daily` - Get the content of the daily markdown file
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Response:
    - `200 OK`: `{ "content": "daily file content" }`
    - `404 Not Found`: `{ "message": "Daily file not found" }`
    - `500 Internal Server Error`: `{ "message": "Error reading daily file" }`

- `PATCH /api/vault/daily` - Append content to the daily markdown file
  - Headers:
    - `Authorization`: `Bearer your_jwt_token`
  - Body:
    - `{ "content": "content to append", "withtime": <boolean>, "undo": <boolean> }`
  - Response:
    - `200 OK`: `{ "message": "Content appended successfully" }`
    - `400 Bad Request`: `{ "message": "Invalid content" }`
    - `404 Not Found`: `{ "message": "Daily file not found" }`
    - `500 Internal Server Error`: `{ "message": "Error appending to daily file" }`
    - `200 OK`: `{ "message": "Last line removed successfully" }`

### License

This project is licensed under the MIT License.
