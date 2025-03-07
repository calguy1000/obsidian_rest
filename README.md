# Express Docker App

This project is an Express application running in a Docker environment. It provides a simple API for file management with shared key authentication.

## Features

- List files
- Get a specific file
- Append data to a file
- Delete a file
- Create a new file

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
   git clone https://github.com/yourusername/express-docker-app.git
   ```

2. Navigate to the project directory:

   ```
   cd express-docker-app
   ```

3. Build the Docker image:

   ```
   docker-compose build
   ```

### Running the Application

To start the application, run:

```
docker-compose up
```

The application will be available at `http://localhost:3000`.

### API Endpoints

- `GET /files` - List all files
- `GET /files/:filename` - Get a specific file
- `POST /files/:filename` - Append data to a file
- `DELETE /files/:filename` - Delete a file
- `PUT /files/:filename` - Create a new file

### Authentication

The application uses shared key authentication. Include the following header in your requests:

```
Authorization: Bearer YOUR_SHARED_KEY
```

### License

This project is licensed under the MIT License.