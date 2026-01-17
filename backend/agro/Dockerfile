# ----------------------------
# Stage 1: Build the JAR
# ----------------------------
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the project files
COPY pom.xml .
COPY src ./src

# Build the application (skipping tests to speed it up)
RUN mvn clean package -DskipTests

# ----------------------------
# Stage 2: Run the Application
# ----------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 (Matches your application.properties)
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]