FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN apt update && apt install -y vim
RUN npm install
RUN npm install jest
RUN npm install ts-jest@next
RUN npx ts-jest config:init

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
# this is just for demonstration, the exposure is set in the docker-compose file
#EXPOSE 3000

# Command to run the application
CMD ["tail", "-f", "/dev/null"]
