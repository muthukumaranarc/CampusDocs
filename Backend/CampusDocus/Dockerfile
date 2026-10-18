# Stage 1: Build application with Maven
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY pom.xml mvnw ./
COPY .mvn .mvn

# Ensure wrapper script is executable
RUN chmod +x ./mvnw

# Copy source code and build production jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal Production Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Default environment port
ENV PORT=8080
EXPOSE 8080

# Copy compiled jar from builder stage
COPY --from=builder /app/target/CampusDocus-*.jar app.jar

# Execute Spring Boot application
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
