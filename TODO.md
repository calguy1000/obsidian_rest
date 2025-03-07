# Express server for a quick REST API  around a single vault
- Generate a secret key in docker container build process
- Environment variable for the vault name
- Environment variable for the JWT expiry, default it to 60 minutes
- GZIP compression  (npm install compression)
- Improved authentication
    - add an /auth api request that uses a pre-shared key that returns a temporary key
        : given a key, return a JWT and a sign key that is based on secret key, and timestamp and jwt
        : ONLY 1 jwt/sign key pair can be saved at a time.. so only one user at a time
          : if a token exists, AND it is not expired then we return an error          
    - use middleware to authenticate the JWT to ensure it is valid and not expired
      : if token is not supplied, is invalid, or does not match the one stored, or is expired... then throw an error
    OPTIONAL (enabled via environment variable or prod mode)
    - all api requests must be signed and included in a separate header
      signature method is:  sha256(jwt:secret_key:body_text) stored in a header
    - would requuire sharing a node module that is a middleware or something

- Complete API including PATCH to append to daily

- Tests
- Test production mode