# ── Stage 1: Compilar el JAR con Maven (Java 17) ───────────────────────────────
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ── Stage 2: Imagen ligera de ejecución (optimizada para 512 MB RAM en Render) ─
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080

# Si ORACLE_WALLET_ZIP_BASE64 está definida, descomprime el Wallet en /app/wallet antes de arrancar Spring Boot
ENTRYPOINT ["sh", "-c", "if [ -n \"$ORACLE_WALLET_ZIP_BASE64\" ]; then mkdir -p /app/wallet && printf '%s' \"$ORACLE_WALLET_ZIP_BASE64\" | tr -d '\\n\\r ' | base64 -d > /tmp/wallet.zip && unzip -oq /tmp/wallet.zip -d /app/wallet && rm -f /tmp/wallet.zip; unset ORACLE_WALLET_ZIP_BASE64; fi && exec java -Xms128m -Xmx256m -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=48m -XX:MaxDirectMemorySize=32m -Xss384k -XX:+UseSerialGC -XX:MinHeapFreeRatio=20 -XX:MaxHeapFreeRatio=40 -XX:+ExitOnOutOfMemoryError -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
